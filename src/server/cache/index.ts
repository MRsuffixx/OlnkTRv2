import {ensureRedis,redis} from "./redis";
export const cacheKeys={publicProfile:(u:string)=>`olnk:v1:profile:${u}`,entitlement:(id:string)=>`olnk:v1:entitlement:${id}`};
export async function cacheGet<T>(key:string):Promise<T|null>{try{await ensureRedis();const value=await redis.get(key);return value?JSON.parse(value) as T:null;}catch{return null;}}
export async function cacheSet(key:string,value:unknown,ttl:number){try{await ensureRedis();await redis.set(key,JSON.stringify(value),"EX",ttl);}catch{}}
export async function cacheDelete(...keys:string[]){try{if(keys.length){await ensureRedis();await redis.del(...keys);}}catch{}}
