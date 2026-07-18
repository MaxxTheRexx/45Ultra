import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stravaConnection } from "@/lib/db/schema";
import { StravaAuthError, syncUser } from "@/lib/strava";

/** Manueller Abruf für den eingeloggten Nutzer. */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [conn] = await db.select().from(stravaConnection).where(eq(stravaConnection.userId, session.user.id));
  if (!conn || conn.status === "pending" || !conn.accessTokenEnc) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }
  try {
    const r = await syncUser(conn);
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof StravaAuthError) return NextResponse.json({ error: "revoked" }, { status: 409 });
    return NextResponse.json({ error: "sync_failed" }, { status: 502 });
  }
}
