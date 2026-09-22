import {Prisma} from "../../../generated/prisma/client";
import {db} from "~/server/db";
import {AppError} from "~/server/errors";
import {parseBlockConfig} from "./block-schemas";
import {getUserEntitlements} from "~/server/entitlements/service";
import {resolveEntitlement} from "~/server/entitlements/resolver";
import {pageDraftUpdateSchema, type PageDraftUpdateInput} from "~/server/publishing/snapshot";
import {cacheDelete,cacheKeys} from "~/server/cache";
async function ownedPage(userId:string,pageId:string){const page=await db.page.findFirst({where:{id:pageId,profile:{userId}}});if(!page)throw new AppError("NOT_FOUND","Page not found");return page;}
async function validateAssetOwnership(userId:string,type:string,config:unknown){if(type!=="IMAGE")return;const assetId=(config as {assetId:string}).assetId;if(!await db.mediaAsset.findFirst({where:{id:assetId,ownerId:userId,status:"READY"},select:{id:true}}))throw new AppError("VALIDATION_ERROR","Image asset is unavailable");}
export async function createBlock(userId:string,input:{pageId:string;type:string;config:unknown}){await ownedPage(userId,input.pageId);const parsed=parseBlockConfig(input.type,input.config);await validateAssetOwnership(userId,input.type,parsed);const config=parsed as Prisma.InputJsonValue;const {grants}=await getUserEntitlements(userId);for(let attempt=0;attempt<3;attempt++){try{return await db.$transaction(async tx=>{const active={pageId:input.pageId,deletedAt:null};const [count,last]=await Promise.all([tx.block.count({where:active}),tx.block.aggregate({where:active,_max:{position:true}})]);if(!resolveEntitlement(grants,"BLOCKS",count).allowed)throw new AppError("PLAN_LIMIT_REACHED","Block limit reached");return tx.block.create({data:{pageId:input.pageId,type:input.type as never,config,position:(last._max.position??-1)+1}});},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034"&&attempt<2)continue;throw error;}}throw new AppError("CONFLICT","Please retry");}
export async function updateBlock(userId:string,input:{id:string;type:string;config:unknown;enabled?:boolean}){const block=await db.block.findFirst({where:{id:input.id,deletedAt:null,page:{profile:{userId}}}});if(!block)throw new AppError("NOT_FOUND","Block not found");const parsed=parseBlockConfig(input.type,input.config);await validateAssetOwnership(userId,input.type,parsed);return db.block.update({where:{id:block.id},data:{config:parsed as Prisma.InputJsonValue,enabled:input.enabled}});}
export async function deleteBlock(userId:string,id:string){const result=await db.block.updateMany({where:{id,deletedAt:null,page:{profile:{userId}}},data:{deletedAt:new Date(),enabled:false}});if(!result.count)throw new AppError("NOT_FOUND","Block not found");}
export async function setBlockEnabled(userId:string,id:string,enabled:boolean){const result=await db.block.updateMany({where:{id,deletedAt:null,page:{profile:{userId}}},data:{enabled}});if(!result.count)throw new AppError("NOT_FOUND","Block not found");}
export async function duplicateBlock(userId:string,id:string){const block=await db.block.findFirst({where:{id,deletedAt:null,page:{profile:{userId}}}});if(!block)throw new AppError("NOT_FOUND","Block not found");return createBlock(userId,{pageId:block.pageId,type:block.type,config:block.config});}
export async function reorderBlocks(userId:string,pageId:string,ids:string[]){await ownedPage(userId,pageId);const existing=await db.block.findMany({where:{pageId,deletedAt:null},select:{id:true}});if(existing.length!==ids.length||new Set(ids).size!==ids.length||existing.some((b)=>!ids.includes(b.id)))throw new AppError("VALIDATION_ERROR","Invalid block order");await db.$transaction(ids.map((id,position)=>db.block.update({where:{id},data:{position}})));}

export async function getOwnedDraft(userId: string, pageId: string) {
  const page = await db.page.findFirst({
    where: { id: pageId, profile: { userId } },
    include: {
      profile: { select: { id: true, username: true, displayName: true, bio: true, avatarAssetId: true } },
      draft: true,
      blocks: { where: { deletedAt: null }, orderBy: { position: "asc" } },
      publication: { select: { versionId: true, publishedAt: true } },
    },
  });
  if (!page?.draft) throw new AppError("NOT_FOUND", "Page draft not found");
  return { ...page, draft: page.draft };
}

export async function updateDraft(userId: string, input: PageDraftUpdateInput) {
  const parsed = pageDraftUpdateSchema.parse(input);
  const result = await db.$transaction(async (tx) => {
    const owned = await tx.page.findFirst({
      where: { id: parsed.pageId, profile: { userId } },
      select: {
        id: true,
        visibility: true,
        profile: { select: { username: true } },
      },
    });
    if (!owned) throw new AppError("NOT_FOUND", "Page not found");
    const [page, draft] = await Promise.all([
      tx.page.update({
        where: { id: owned.id },
        data: {
          title: parsed.title || null,
          description: parsed.description || null,
          visibility: parsed.visibility,
        },
      }),
      tx.pageDraft.update({
        where: { pageId: owned.id },
        data: {
          themeConfig: parsed.theme as Prisma.InputJsonValue,
          seoConfig: parsed.seo as Prisma.InputJsonValue,
        },
      }),
    ]);
    return {
      page,
      draft,
      previousVisibility: owned.visibility,
      username: owned.profile.username,
    };
  });
  if (result.previousVisibility !== result.page.visibility) {
    await cacheDelete(cacheKeys.publicProfile(result.username));
  }
  return { page: result.page, draft: result.draft };
}
