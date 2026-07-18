import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stravaConnection } from "@/lib/db/schema";
import { STRAVA_OAUTH } from "@/lib/strava";
import { baseURL } from "@/lib/base-url";

/** Startet den Strava-OAuth-Flow mit der client_id DES NUTZERS. */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.redirect(new URL("/login", baseURL()));

  const [conn] = await db.select().from(stravaConnection)
    .where(eq(stravaConnection.userId, session.user.id));
  if (!conn) return NextResponse.redirect(new URL("/?strava=fehler&grund=keine-zugangsdaten", baseURL()));

  const state = randomBytes(16).toString("hex");
  const authorize = new URL(`${STRAVA_OAUTH}/authorize`);
  authorize.search = new URLSearchParams({
    client_id: conn.clientId,
    redirect_uri: `${baseURL()}/api/strava/callback`,
    response_type: "code",
    scope: "activity:read_all",
    approval_prompt: "auto",
    state,
  }).toString();

  const res = NextResponse.redirect(authorize);
  res.cookies.set("strava_oauth_state", state, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/api/strava", maxAge: 600,
  });
  return res;
}
