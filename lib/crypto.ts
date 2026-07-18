import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM für ruhende Geheimnisse (Strava Client-Secret + OAuth-Tokens).
 * Diese müssen wiederherstellbar sein (wir rufen damit Strava auf) → Hashing
 * scheidet aus. GCM liefert authentifizierte Verschlüsselung in einem Schritt.
 * Der Schlüssel liegt ausschließlich in der Env-Variable ENCRYPTION_KEY
 * (32 Bytes base64), nie in der Datenbank.
 */
function key(): Buffer {
  const k = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "base64");
  if (k.length !== 32) {
    throw new Error("ENCRYPTION_KEY fehlt oder ist ungültig (32 Bytes base64 erwartet)");
  }
  return k;
}

/** Format: "v1.<iv b64>.<tag b64>.<ciphertext b64>" */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64")}.${c.getAuthTag().toString("base64")}.${ct.toString("base64")}`;
}

export function decrypt(enc: string): string {
  const [v, ivB, tagB, ctB] = enc.split(".");
  if (v !== "v1" || !ivB || !tagB || !ctB) throw new Error("unbekanntes Verschlüsselungsformat");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64"));
  d.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([d.update(Buffer.from(ctB, "base64")), d.final()]).toString("utf8");
}
