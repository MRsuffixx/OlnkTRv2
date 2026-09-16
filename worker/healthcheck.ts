import {ensureRedis,redis} from "../src/server/cache/redis.js";
import {db} from "../src/server/db.js";
try{await ensureRedis();const [,pong]=await Promise.all([db.$queryRaw`SELECT 1`,redis.ping()]);if(pong!=="PONG")process.exitCode=1;}catch{process.exitCode=1;}finally{await Promise.all([redis.quit().catch(()=>undefined),db.$disconnect()]);}
