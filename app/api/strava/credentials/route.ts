import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stravaConnection } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";

/** Speichert die vom Nutzer angelegten Strava-App-Zugangsdaten (BYOK). */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { clientId?: string; clientSecret?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const clientId = String(body.clientId ?? "").trim();
  const clientSecret = String(body.clientSecret ?? "").trim();
  if (!/^\d{1,12}$/.test(clientId) || clientSecret.length < 20 || clientSecret.length > 80) {
    return NextResponse.json({ error: "invalid_credentials_shape" }, { status: 400 });
  }

  let clientSecretEnc: string;
  try { clientSecretEnc = encrypt(clientSecret); }
  catch { return NextResponse.json({ error: "server_misconfigured" }, { status: 500 }); }

  const now = Date.now();
  const userId = session.user.id;
  const existing = await db.select().from(stravaConnection).where(eq(stravaConnection.userId, userId));
  if (existing[0]) {
    await db.update(stravaConnection).set({
      clientId, clientSecretEnc,
      accessTokenEnc: null, refreshTokenEnc: null, expiresAt: 0,
      status: "pending", lastError: null,
    }).where(eq(stravaConnection.userId, userId));
  } else {
    await db.insert(stravaConnection).values({
      userId, clientId, clientSecretEnc, status: "pending", createdAt: now,
    });
  }
  return NextResponse.json({ ok: true });
}
