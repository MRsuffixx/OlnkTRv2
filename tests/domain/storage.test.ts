import {describe,expect,it} from "vitest";
import {maximumUploadBytes,validateImageUpload} from "~/server/storage/validation";

describe("upload validation",()=>{
  it("rejects executable content disguised as an image",async()=>{await expect(validateImageUpload(Buffer.from("#!/bin/sh\necho bad"))).rejects.toThrow("Unsupported file signature");});
  it("rejects oversized data before storage",async()=>{await expect(validateImageUpload(new Uint8Array(maximumUploadBytes+1))).rejects.toThrow("Invalid file size");});
});
