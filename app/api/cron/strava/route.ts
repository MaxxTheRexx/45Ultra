import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stravaConnection } from "@/lib/db/schema";
import { syncUser } from "@/lib/strava";

// Hobby-Maximum; Standard-10s wäre bei mehreren Nutzern + Netzlatenz knapp.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Täglicher Abgleich aller aktiven Strava-Verbindungen (Vercel Cron). */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const start = Date.now();
  const conns = await db.select().from(stravaConnection).where(eq(stravaConnection.status, "ok"));
  const results: Record<string, string> = {};
  for (const conn of conns) { // sequenziell — schont Speicher und Rate-Limits
    if (Date.now() - start > 50_000) { results[conn.userId] = "skipped_time_budget"; continue; }
    try { const r = await syncUser(conn); results[conn.userId] = `ok:${r.imported}`; }
    catch { results[conn.userId] = "error"; } // syncUser setzt Status selbst (revoked/error)
  }
  return NextResponse.json({ ran: conns.length, results });
}
