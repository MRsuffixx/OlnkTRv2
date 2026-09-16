import {fileTypeFromBuffer} from "file-type";
import {AppError} from "~/server/errors";

const allowedImageTypes=new Set(["image/jpeg","image/png","image/webp","image/gif"]);
export const maximumUploadBytes=5*1024*1024;

export async function validateImageUpload(bytes:Uint8Array){if(bytes.byteLength===0||bytes.byteLength>maximumUploadBytes)throw new AppError("VALIDATION_ERROR","Invalid file size");const detected=await fileTypeFromBuffer(bytes);if(!detected||!allowedImageTypes.has(detected.mime))throw new AppError("VALIDATION_ERROR","Unsupported file signature");return detected;}
