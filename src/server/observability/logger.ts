import pino from "pino";
import {env} from "~/env";
export const logger=pino({level:env.NODE_ENV==="production"?"info":"debug",base:{service:"olnktr"},redact:{paths:["password","token","authorization","cookie","*.password","*.token","*.secret"],censor:"[REDACTED]"}});
