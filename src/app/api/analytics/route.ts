import {NextResponse} from "next/server";
import {z} from "zod";
import {analyticsQueue} from "~/server/queues";
import {rateLimit} from "~/server/security/rate-limit";
const schema=z.object({eventType:z.enum(["PROFILE_VIEW","BLOCK_CLICK"]),profileId:z.string().cuid(),blockId:z.string().cuid().optional()});
export async function POST(request:Request){const ip=request.headers.get("x-forwarded-for")?.split(",")[0]??"unknown";const limited=await rateLimit("analytics",ip,120,60);if(!limited.allowed)return new NextResponse(null,{status:429});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return new NextResponse(null,{status:400});const country=[request.headers.get("x-vercel-ip-country"),request.headers.get("cf-ipcountry")].find(value=>/^[A-Za-z]{2}$/.test(value??""))?.toUpperCase();await analyticsQueue.add("ingest",{...parsed.data,occurredAt:new Date().toISOString(),referrer:request.headers.get("referer"),userAgent:request.headers.get("user-agent"),country,ip},{removeOnComplete:true});return new NextResponse(null,{status:202});}
