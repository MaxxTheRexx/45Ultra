import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { garminConnection } from "@/lib/db/schema";
import { decrypt, encrypt } from "@/lib/crypto";
import { syncUser, GARMIN_OAUTH, GarminAuthError } from "@/lib/garmin";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(`OAuth error: ${error}`, { status: 400 });
    }
    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    // Hole Garmin credentials
    const conn = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, session.user.id),
    });

    if (!conn) {
      return new Response("No Garmin credentials found", { status: 400 });
    }

    // Exchange code für Token
    const tokenRes = await fetch(`${GARMIN_OAUTH}/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: conn.clientId,
        client_secret: decrypt(conn.clientSecretEnc),
        redirect_uri: `${new URL(req.url).origin}/api/garmin/callback`,
      }).toString(),
    });

    if (!tokenRes.ok) {
      return new Response(`Token exchange failed: ${tokenRes.status}`, { status: 400 });
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // Speichere Tokens
    await db.update(garminConnection).set({
      accessTokenEnc: encrypt(tokenData.access_token),
      refreshTokenEnc: encrypt(tokenData.refresh_token),
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      status: "ok",
      lastError: null,
      lastSyncAt: Date.now(),
    }).where(eq(garminConnection.userId, session.user.id));

    // Triggere erste Sync
    try {
      const updated = await db.query.garminConnection.findFirst({
        where: eq(garminConnection.userId, session.user.id),
      });
      if (updated) {
        await syncUser(updated);
      }
    } catch (syncErr) {
      console.warn("First sync failed (non-blocking):", syncErr);
    }

    // Redirect zu Profil-Reiter
    const redirectUrl = `${new URL(req.url).origin}/?tab=profil#garmin-connected`;
    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  } catch (err) {
    console.error("garmin/callback error:", err);
    return new Response(`Error: ${err instanceof Error ? err.message : "unknown"}`, { status: 500 });
  }
}
