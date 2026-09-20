import {describe,expect,it} from "vitest";
import {
  maximumUploadBytes,
  maximumVideoUploadBytes,
  validateImageUpload,
  validateMediaUpload,
} from "~/server/storage/validation";
import {validateVideoProbe} from "~/server/media/probe";
import {buildVideoDerivativeKeys} from "~/server/media/processing";
import {selectDeliveryVariant} from "~/server/media/delivery";

describe("upload validation",()=>{
  it("rejects executable content disguised as an image",async()=>{await expect(validateImageUpload(Buffer.from("#!/bin/sh\necho bad"))).rejects.toThrow("Unsupported file signature");});
  it("rejects oversized data before storage",async()=>{await expect(validateImageUpload(new Uint8Array(maximumUploadBytes+1))).rejects.toThrow("Invalid file size");});
  it("accepts a signature-verified MP4 for asynchronous processing",async()=>{
    const bytes=Buffer.from("00000018667479706d703432000000006d7034326d703431", "hex");
    await expect(validateMediaUpload(bytes, maximumVideoUploadBytes)).resolves.toMatchObject({mime:"video/mp4",kind:"VIDEO"});
  });
  it("rejects video beyond the loop duration and dimension limits",()=>{
    expect(()=>validateVideoProbe({durationSeconds:31,width:1280,height:720})).toThrow("VIDEO_DURATION_EXCEEDED");
    expect(()=>validateVideoProbe({durationSeconds:12,width:3840,height:2160})).toThrow("VIDEO_DIMENSIONS_EXCEEDED");
  });
  it("creates generated private derivative keys without using original names",()=>{
    expect(buildVideoDerivativeKeys("user-1", "asset-1")).toEqual({
      optimized: "users/user-1/processed/asset-1.mp4",
      poster: "users/user-1/processed/asset-1.webp",
    });
  });
  it("serves optimized video and poster derivatives through the source asset id",()=>{
    const source={id:"source",mimeType:"video/webm",kind:"VIDEO" as const,objectKey:"source.webm",size:100n,derivatives:[
      {id:"optimized",mimeType:"video/mp4",kind:"VIDEO" as const,variant:"OPTIMIZED" as const,objectKey:"optimized.mp4",size:80n},
      {id:"poster",mimeType:"image/webp",kind:"IMAGE" as const,variant:"POSTER" as const,objectKey:"poster.webp",size:10n},
    ]};
    expect(selectDeliveryVariant(source,"content")?.id).toBe("optimized");
    expect(selectDeliveryVariant(source,"poster")?.id).toBe("poster");
  });
});
