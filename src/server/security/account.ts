import {db} from "~/server/db";
import {AppError} from "~/server/errors";

export async function requireActiveAccount(userId:string){const user=await db.user.findUnique({where:{id:userId},select:{status:true,role:true}});if(!user)throw new AppError("UNAUTHORIZED","Account not found");if(user.status!=="ACTIVE")throw new AppError("ACCOUNT_SUSPENDED","Account is not active");return user;}
