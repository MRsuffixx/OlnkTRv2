import {Prisma} from "../../../generated/prisma/client";
import {db} from "~/server/db";
import {AppError} from "~/server/errors";
import {usernameSchema} from "./username";
import {cacheDelete,cacheKeys} from "~/server/cache";
import {isRetryableTransactionError} from "~/server/db/transaction";
import {defaultThemeConfig} from "~/server/publishing/theme-v2";
const defaultTheme=defaultThemeConfig;
const defaultSeo={schemaVersion:1,robots:"index,follow"};
export async function completeOnboarding(userId:string,input:{username:string;displayName:string}){
  const username=usernameSchema.parse(input.username);
  for(let attempt=0;attempt<3;attempt+=1){
    try{
      return await db.$transaction(async(tx)=>{
        const reserved=await tx.reservedUsername.findUnique({where:{username}});
        if(reserved)throw new AppError("CONFLICT","Username is reserved");
        const user=await tx.user.findUniqueOrThrow({where:{id:userId}});
        if(user.status!=="ACTIVE")throw new AppError("ACCOUNT_SUSPENDED","Account is not active");
        if(user.onboardingStatus==="COMPLETED")throw new AppError("CONFLICT","Onboarding already completed");
        const profile=await tx.profile.create({data:{userId,username,displayName:input.displayName.trim(),status:"ACTIVE",page:{create:{draft:{create:{themeConfig:defaultTheme,seoConfig:defaultSeo}}}}},include:{page:true}});
        await tx.user.update({where:{id:userId},data:{name:input.displayName.trim(),onboardingStatus:"COMPLETED"}});
        return profile;
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    }catch(error){
      if(isRetryableTransactionError(error)&&attempt<2)continue;
      if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002")throw new AppError("CONFLICT","Username is unavailable");
      throw error;
    }
  }
  throw new AppError("CONFLICT","Please retry onboarding");
}
export async function updateProfile(userId:string,input:{profileId:string;displayName:string;bio?:string|null}){const result=await db.profile.updateMany({where:{id:input.profileId,userId},data:{displayName:input.displayName.trim(),bio:input.bio?.trim()||null}});if(!result.count)throw new AppError("NOT_FOUND","Profile not found");return db.profile.findUniqueOrThrow({where:{id:input.profileId}});}
export async function changeUsername(userId:string,input:{profileId:string;username:string}){const username=usernameSchema.parse(input.username);let oldUsername="";try{const profile=await db.$transaction(async tx=>{const current=await tx.profile.findFirst({where:{id:input.profileId,userId}});if(!current)throw new AppError("NOT_FOUND","Profile not found");if(current.username===username)return current;if(await tx.reservedUsername.findUnique({where:{username}}))throw new AppError("CONFLICT","Username is reserved");oldUsername=current.username;await tx.usernameHistory.create({data:{profileId:current.id,username:current.username}});const updated=await tx.profile.update({where:{id:current.id},data:{username}});await tx.auditLog.create({data:{actorId:userId,actorType:"USER",action:"USERNAME_CHANGED",targetType:"Profile",targetId:current.id,metadata:{from:current.username,to:username}}});return updated;},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});await cacheDelete(cacheKeys.publicProfile(oldUsername),cacheKeys.publicProfile(username));return profile;}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002")throw new AppError("CONFLICT","Username is unavailable");throw error;}}
