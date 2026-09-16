import {createHash} from "node:crypto";
import nodemailer from "nodemailer";
import {env} from "~/env";
import {db} from "~/server/db";
import {logger} from "~/server/observability/logger";
export interface MailMessage{to:string;subject:string;text:string;html:string}
export interface MailProvider{send(message:MailMessage):Promise<{messageId:string}>}
class SmtpMailProvider implements MailProvider{private transport=nodemailer.createTransport({host:env.SMTP_HOST,port:env.SMTP_PORT,secure:env.SMTP_SECURE,auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASSWORD}:undefined});async send(message:MailMessage){const result=await this.transport.sendMail({...message,from:{name:env.MAIL_FROM_NAME,address:env.MAIL_FROM}});return{messageId:result.messageId};}}
export const mailProvider:MailProvider|null=env.SMTP_HOST?new SmtpMailProvider():null;
export function magicLinkTemplate(url:string):Omit<MailMessage,"to">{return{subject:"Sign in to OlnkTR",text:`Open this single-use link to sign in: ${url}\n\nIt expires soon.`,html:`<p>Open this single-use link to sign in:</p><p><a href="${url.replaceAll("&","&amp;")}">Sign in to OlnkTR</a></p><p>This link expires soon.</p>`};}
export function welcomeTemplate(displayName:string):Omit<MailMessage,"to">{const name=displayName.replace(/[<>]/g,"");return{subject:"Welcome to OlnkTR",text:`Welcome ${name}. Your OlnkTR account is ready.`,html:`<p>Welcome ${name}. Your OlnkTR account is ready.</p>`};}
export function securityNotificationTemplate(summary:string):Omit<MailMessage,"to">{const safe=summary.replace(/[<>]/g,"");return{subject:"OlnkTR security notification",text:safe,html:`<p>${safe}</p>`};}
export function subscriptionNotificationTemplate(summary:string):Omit<MailMessage,"to">{const safe=summary.replace(/[<>]/g,"");return{subject:"OlnkTR subscription update",text:safe,html:`<p>${safe}</p>`};}
export async function sendTracked(template:string,message:MailMessage){if(!mailProvider)throw new Error("MAIL_PROVIDER_DISABLED");const recipientHash=createHash("sha256").update(message.to.toLowerCase()).digest("hex");const delivery=await db.mailDelivery.create({data:{template,recipientHash,provider:"smtp"}});try{const result=await mailProvider.send(message);await db.mailDelivery.update({where:{id:delivery.id},data:{status:"PROCESSED",messageId:result.messageId,sentAt:new Date()}});logger.info({operation:"mail.send",template,deliveryId:delivery.id},"mail delivered");return result;}catch(error){await db.mailDelivery.update({where:{id:delivery.id},data:{status:"FAILED",errorCode:"SMTP_SEND_FAILED"}});logger.error({operation:"mail.send",template,deliveryId:delivery.id,error},"mail failed");throw error;}}
