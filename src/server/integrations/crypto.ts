import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

export interface EncryptedCredentials {
  [key: string]: string | number;
  version: 1;
  iv: string;
  ciphertext: string;
  authTag: string;
}

function decodeKey(encodedKey: string) {
  const key = Buffer.from(encodedKey, "base64");
  if (key.byteLength !== 32) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY_INVALID");
  }
  return key;
}

export function encryptCredentials(
  value: Record<string, unknown>,
  encodedKey: string,
): EncryptedCredentials {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", decodeKey(encodedKey), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptCredentials(
  encryptedValue: unknown,
  encodedKey: string,
): Record<string, unknown> {
  if (
    !encryptedValue ||
    typeof encryptedValue !== "object" ||
    Array.isArray(encryptedValue)
  ) {
    throw new Error("CREDENTIAL_PAYLOAD_INVALID");
  }
  const value = encryptedValue as Partial<EncryptedCredentials>;
  if (value.version !== 1) throw new Error("CREDENTIAL_VERSION_UNSUPPORTED");
  if (
    typeof value.iv !== "string" ||
    typeof value.ciphertext !== "string" ||
    typeof value.authTag !== "string"
  ) {
    throw new Error("CREDENTIAL_PAYLOAD_INVALID");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    decodeKey(encodedKey),
    Buffer.from(value.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  const parsed: unknown = JSON.parse(plaintext);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("CREDENTIAL_PAYLOAD_INVALID");
  }
  return parsed as Record<string, unknown>;
}
