import {Queue} from "bullmq";
import {env} from "~/env";
import {logger} from "~/server/observability/logger";
const connection={url:env.REDIS_URL};
export const emailQueue=new Queue("email",{connection,defaultJobOptions:{attempts:5,backoff:{type:"exponential",delay:1000},removeOnComplete:1000}});
export const analyticsQueue=new Queue("analytics",{connection,defaultJobOptions:{attempts:5,backoff:{type:"exponential",delay:500},removeOnComplete:5000}});
export const billingQueue=new Queue("billing",{connection,defaultJobOptions:{attempts:8,backoff:{type:"exponential",delay:2000},removeOnComplete:1000}});
export const maintenanceQueue=new Queue("maintenance",{connection,defaultJobOptions:{attempts:3,backoff:{type:"exponential",delay:5000}}});
export const mediaQueue=new Queue("media",{connection,defaultJobOptions:{attempts:3,backoff:{type:"exponential",delay:3000},removeOnComplete:1000}});
export const integrationQueue=new Queue("integration",{connection,defaultJobOptions:{attempts:5,backoff:{type:"exponential",delay:2000},removeOnComplete:1000}});
export function enqueueEntitlementRefresh(userId:string,marker:string,delay=0){return billingQueue.add("refresh-publication-entitlements",{userId},{jobId:`entitlements-${userId}-${marker.replace(/[^a-zA-Z0-9_-]/g,"-")}`,delay,attempts:5,backoff:{type:"exponential",delay:2000},removeOnComplete:1000});}
export function enqueueWidgetRefresh(blockId:string,now=Date.now()){return integrationQueue.add("refresh-widget",{blockId},{jobId:`widget-${blockId}-${Math.floor(now/60_000)}`,removeOnComplete:1000});}
for(const queue of [emailQueue,analyticsQueue,billingQueue,maintenanceQueue,mediaQueue,integrationQueue])queue.on("error",error=>{if(!process.env.SKIP_ENV_VALIDATION)logger.warn({operation:"queue.connection",queue:queue.name,error},"queue connection error");});
