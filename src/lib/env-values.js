import { z } from "zod";

export const envBoolean = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

export const googleSiteVerification = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(6).optional(),
);
