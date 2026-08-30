import crypto from "node:crypto";

function getKey() {
  const value = process.env.ENCRYPTION_KEY;

  if (!value || value.startsWith("generate_with_")) {
    throw new Error("ENCRYPTION_KEY is required for Google token encryption.");
  }

  const base64 = Buffer.from(value, "base64");
  if (base64.length === 32) {
    return base64;
  }

  const utf8 = Buffer.from(value, "utf8");
  if (utf8.length === 32) {
    return utf8;
  }

  return crypto.createHash("sha256").update(value).digest();
}

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decrypt(encrypted: string) {
  const [ivValue, authTagValue, encryptedValue] = encrypted.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Invalid encrypted token format.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
