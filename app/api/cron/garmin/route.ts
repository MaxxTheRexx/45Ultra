import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { garminConnection } from "@/lib/db/schema";
import { syncUser, GarminAuthError } from "@/lib/garmin";

export async function GET(req: Request) {
  // CRON_SECRET Validation
  const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (cronSecret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Finde alle User mit status='ok'
    const conns = await db.query.garminConnection.findMany({
      where: eq(garminConnection.status, "ok"),
    });

    if (!conns.length) {
      return new Response(JSON.stringify({ synced: 0, errors: 0 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    let synced = 0;
    let errors = 0;

    // Sync sequenziell (nicht parallel, um DB-Last zu reduzieren)
    for (const conn of conns) {
      try {
        await syncUser(conn);
        synced++;
      } catch (err) {
        console.error(`Garmin sync failed for user ${conn.userId}:`, err);
        errors++;
        if (err instanceof GarminAuthError) {
          await db.update(garminConnection)
            .set({ status: "revoked", lastError: "auth_error" })
            .where(eq(garminConnection.userId, conn.userId));
        }
      }
    }

    return new Response(
      JSON.stringify({ synced, errors, total: conns.length }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (err) {
    console.error("garmin cron error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
}
