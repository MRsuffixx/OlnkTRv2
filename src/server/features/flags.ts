import {db} from "~/server/db";
import {env} from "~/env";
import type {Role} from "~/server/security/authorization";

export async function isFeatureEnabled(key:string,role:Role="USER"){const flag=await db.featureFlag.findUnique({where:{key}});if(!flag?.enabled||!flag.environments.includes(env.NODE_ENV))return false;return !flag.adminOnly||(role==="ADMIN"||role==="SUPER_ADMIN");}
