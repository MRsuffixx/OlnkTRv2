import Redis from "ioredis";
import {env} from "~/env";
const holder=globalThis as unknown as {redis?:Redis};
export const redis=holder.redis??new Redis(env.REDIS_URL,{maxRetriesPerRequest:1,connectTimeout:500,lazyConnect:true,retryStrategy:()=>null});
if(env.NODE_ENV!=="production")holder.redis=redis;
redis.on("error",()=>undefined);
export async function ensureRedis(){if(redis.status==="wait")await redis.connect();}
