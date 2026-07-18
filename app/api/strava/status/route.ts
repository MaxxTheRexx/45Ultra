import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stravaConnection } from "@/lib/db/schema";

/** Verbindungsstatus für die UI — niemals Secrets/Tokens. */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [conn] = await db.select().from(stravaConnection).where(eq(stravaConnection.userId, session.user.id));
  if (!conn) return NextResponse.json({ configured: false, connected: false });

  return NextResponse.json({
    configured: true,
    connected: conn.status === "ok" && !!conn.accessTokenEnc,
    status: conn.status,
    athleteName: conn.athleteName ?? undefined,
    lastSyncAt: conn.lastSyncAt || undefined,
    lastError: conn.lastError ?? undefined,
  });
}
