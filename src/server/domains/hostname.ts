import { isIP } from "node:net";
import { domainToASCII } from "node:url";

import { AppError } from "~/server/errors";

export function normalizeHostname(input: string) {
  const ascii = domainToASCII(input.trim().replace(/\.$/, "")).toLowerCase();
  if (!ascii || ascii.length > 253 || isIP(ascii) || !ascii.includes(".")) throw new AppError("VALIDATION_ERROR", "Enter a valid hostname");
  const labels = ascii.split(".");
  if (labels.some((label) => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    throw new AppError("VALIDATION_ERROR", "Enter a valid hostname");
  }
  return ascii;
}
