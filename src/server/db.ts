import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../../generated/prisma/client";
import {env} from "~/env";
const createClient=()=>new PrismaClient({adapter:new PrismaPg({connectionString:env.DATABASE_URL})});
const globalDb=globalThis as unknown as {prisma?:ReturnType<typeof createClient>};
export const db=globalDb.prisma??createClient();
if(env.NODE_ENV!=="production")globalDb.prisma=db;
