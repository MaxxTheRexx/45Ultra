import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { garminConnection, activity } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const conn = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, session.user.id),
    });

    if (!conn) {
      return new Response(JSON.stringify({ connected: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Count Garmin activities
    const activities = await db.query.activity.findMany({
      where: and(
        eq(activity.userId, session.user.id),
        sql`${activity.key} LIKE 'garmin:%'`
      ),
    });

    return new Response(
      JSON.stringify({
        connected: conn.status === "ok",
        status: conn.status,
        lastSyncAt: conn.lastSyncAt,
        activityCount: activities.length,
        lastError: conn.lastError,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (err) {
    console.error("garmin/status error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
}
