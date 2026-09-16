import {NextResponse} from "next/server";
import {auth} from "~/server/auth";
import {developmentBillingProvider} from "~/server/billing/provider";
import {persistBillingWebhook} from "~/server/billing/service";
import {billingQueue} from "~/server/queues";

export async function GET(request:Request){
  if(process.env.NODE_ENV==="production")return new NextResponse(null,{status:404});
  const session=await auth();
  if(!session?.user)return NextResponse.redirect(new URL("/login",request.url));
  const url=new URL(request.url);const encoded=url.searchParams.get("payload")??"";const signature=url.searchParams.get("signature")??"";
  if(!developmentBillingProvider.verifyWebhook(encoded,signature))return new NextResponse("Invalid checkout",{status:401});
  let event;
  try{event=developmentBillingProvider.normalizeWebhookEvent(Buffer.from(encoded,"base64url").toString("utf8"));}catch{return new NextResponse("Invalid checkout",{status:400});}
  if(event.userId!==session.user.id||event.planKey!=="PREMIUM")return new NextResponse("Invalid checkout",{status:403});
  const stored=await persistBillingWebhook("development",event);
  if(stored.processingStatus==="PENDING")await billingQueue.add("process-webhook",{id:stored.id},{jobId:`billing-${stored.id}`});
  return NextResponse.redirect(new URL("/dashboard/billing?checkout=accepted",request.url));
}
