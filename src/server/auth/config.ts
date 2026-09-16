import {PrismaAdapter} from "@auth/prisma-adapter";
import type {DefaultSession,NextAuthConfig} from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import {env} from "~/env";
import {db} from "~/server/db";
import {magicLinkTemplate,sendTracked} from "~/server/mail";
import {rateLimit} from "~/server/security/rate-limit";
declare module "next-auth"{interface User{role:"USER"|"MODERATOR"|"ADMIN"|"SUPER_ADMIN";status:"ACTIVE"|"SUSPENDED"|"DISABLED"|"DELETION_PENDING";onboardingStatus:"NOT_STARTED"|"PROFILE_CREATED"|"COMPLETED"}interface Session extends DefaultSession{user:{id:string;role:User["role"];status:User["status"];onboardingStatus:User["onboardingStatus"]}&DefaultSession["user"]}}
const providers:NextAuthConfig["providers"]=[];
if(env.SMTP_HOST)providers.push(Nodemailer({id:"email",server:{host:env.SMTP_HOST,port:env.SMTP_PORT,secure:env.SMTP_SECURE,auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASSWORD}:undefined},from:env.MAIL_FROM,maxAge:900,async sendVerificationRequest({identifier,url}){const limited=await rateLimit("magic-link-email",identifier,3,900);if(limited.allowed)await sendTracked("magic-link",{to:identifier,...magicLinkTemplate(url)});}}));
if(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET)providers.push(Google({clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET,allowDangerousEmailAccountLinking:false}));
export const authConfig={adapter:PrismaAdapter(db),providers,session:{strategy:"database",maxAge:2592000,updateAge:86400},pages:{signIn:"/login",verifyRequest:"/verify-request"},callbacks:{async signIn({user}){if(!user.id)return true;const existing=await db.user.findUnique({where:{id:user.id},select:{status:true}});return !existing||existing.status==="ACTIVE";},session({session,user}){return{...session,user:{...session.user,id:user.id,role:user.role,status:user.status,onboardingStatus:user.onboardingStatus}};}},events:{async signIn({user}){await db.securityEvent.create({data:{userId:user.id,type:"LOGIN_SUCCESS"}});}},trustHost:env.NODE_ENV!=="production"||process.env.AUTH_TRUST_HOST==="true"} satisfies NextAuthConfig;
