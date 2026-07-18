import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stravaConnection } from "@/lib/db/schema";
import { decrypt, encrypt } from "@/lib/crypto";
import { BACKFILL_MS, STRAVA_OAUTH, syncUser } from "@/lib/strava";
import { baseURL } from "@/lib/base-url";

/** Schließt den OAuth-Flow ab: Code gegen Tokens tauschen, speichern, erst-syncen. */
export async function GET(req: NextRequest) {
  const base = baseURL();
  const fail = (grund: string) => NextResponse.redirect(new URL(`/?strava=fehler&grund=${grund}`, base));

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.redirect(new URL("/login", base));

  if (req.nextUrl.searchParams.get("error")) return NextResponse.redirect(new URL("/?strava=abgelehnt", base));
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("strava_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return fail("state");

  const [conn] = await db.select().from(stravaConnection).where(eq(stravaConnection.userId, session.user.id));
  if (!conn) return fail("keine-zugangsdaten");

  let secret: string;
  try { secret = decrypt(conn.clientSecretEnc); }
  catch { return fail("server"); }

  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: conn.clientId, client_secret: secret,
      grant_type: "authorization_code", code,
    }),
  });
  if (!res.ok) {
    await db.update(stravaConnection).set({ status: "error", lastError: "token_exchange" })
      .where(eq(stravaConnection.userId, session.user.id));
    return fail("zugangsdaten");
  }
  const t = await res.json() as {
    access_token: string; refresh_token: string; expires_at: number;
    athlete?: { id: number; firstname?: string; lastname?: string };
  };

  await db.update(stravaConnection).set({
    accessTokenEnc: encrypt(t.access_token),
    refreshTokenEnc: encrypt(t.refresh_token),
    expiresAt: t.expires_at * 1000,
    athleteId: t.athlete ? String(t.athlete.id) : null,
    athleteName: t.athlete ? [t.athlete.firstname, t.athlete.lastname].filter(Boolean).join(" ") : null,
    syncedAfter: Date.now() - BACKFILL_MS,
    status: "ok", lastError: null,
  }).where(eq(stravaConnection.userId, session.user.id));

  // Erst-Sync direkt, best-effort (Cron holt sonst nach).
  try {
    const [fresh] = await db.select().from(stravaConnection).where(eq(stravaConnection.userId, session.user.id));
    if (fresh) await syncUser(fresh);
  } catch { /* egal */ }

  const out = NextResponse.redirect(new URL("/?strava=verbunden", base));
  out.cookies.delete("strava_oauth_state");
  return out;
}
