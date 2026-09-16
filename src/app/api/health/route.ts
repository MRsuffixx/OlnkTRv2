import {NextResponse} from "next/server";
import {db} from "~/server/db";
import {ensureRedis,redis} from "~/server/cache/redis";
export const dynamic="force-dynamic";
export async function GET(){try{await Promise.all([db.$queryRaw`SELECT 1`,ensureRedis().then(()=>redis.ping())]);return NextResponse.json({status:"ok"});}catch{return NextResponse.json({status:"not_ready"},{status:503});}}
