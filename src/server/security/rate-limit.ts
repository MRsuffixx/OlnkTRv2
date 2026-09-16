import {createHash} from "node:crypto";
import {ensureRedis,redis} from "~/server/cache/redis";
export const hashDimension=(v:string)=>createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
export async function rateLimit(scope:string,dimension:string,limit:number,seconds:number){await ensureRedis();const key=`olnk:v1:rl:${scope}:${hashDimension(dimension)}`;const count=await redis.incr(key);if(count===1)await redis.expire(key,seconds);return{allowed:count<=limit,remaining:Math.max(0,limit-count),retryAfter:Math.max(1,await redis.ttl(key))};}
