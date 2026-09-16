import {NextResponse} from "next/server";
import {developmentBillingProvider} from "~/server/billing/provider";
import {billingQueue} from "~/server/queues";
import {persistBillingWebhook} from "~/server/billing/service";
export async function POST(request:Request,{params}:{params:Promise<{provider:string}>}){const {provider}=await params;if(provider!=="development")return new NextResponse(null,{status:404});const raw=await request.text();const signature=request.headers.get("x-olnk-signature")??"";if(!developmentBillingProvider.verifyWebhook(raw,signature))return new NextResponse(null,{status:401});const event=developmentBillingProvider.normalizeWebhookEvent(raw);const stored=await persistBillingWebhook(provider,event);if(stored.processingStatus==="PENDING")await billingQueue.add("process-webhook",{id:stored.id},{jobId:`billing-${stored.id}`});return NextResponse.json({accepted:true},{status:202});}
