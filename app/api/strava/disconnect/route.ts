import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stravaConnection } from "@/lib/db/schema";
import { revokeAtStrava } from "@/lib/strava";

/** Verbindung trennen: bei Strava widerrufen (best-effort) + Zeile löschen.
    Importierte Aktivitäten bleiben erhalten (gehören dem Nutzer). */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [conn] = await db.select().from(stravaConnection).where(eq(stravaConnection.userId, session.user.id));
  if (conn) {
    await revokeAtStrava(conn);
    await db.delete(stravaConnection).where(eq(stravaConnection.userId, session.user.id));
  }
  return NextResponse.json({ ok: true });
}
