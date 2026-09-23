import {db} from "~/server/db";
import {env} from "~/env";
import type {Role} from "~/server/security/authorization";
import {AppError} from "~/server/errors";

export const featureFlagKeys = {
  adultLinks: "ADULT_LINKS",
} as const;

export async function isFeatureEnabled(key:string,role:Role="USER"){const flag=await db.featureFlag.findUnique({where:{key}});if(!flag?.enabled||!flag.environments.includes(env.NODE_ENV))return false;return !flag.adminOnly||(role==="ADMIN"||role==="SUPER_ADMIN");}

export async function requireFeatureEnabled(key: string, role: Role = "USER") {
  if (!(await isFeatureEnabled(key, role))) {
    throw new AppError(
      "FEATURE_NOT_AVAILABLE",
      "This feature is not currently available",
      { feature: key },
    );
  }
}
