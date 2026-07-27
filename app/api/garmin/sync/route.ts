import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { garminConnection } from "@/lib/db/schema";
import { syncUser, GarminAuthError } from "@/lib/garmin";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const conn = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, session.user.id),
    });

    if (!conn || conn.status !== "ok") {
      return new Response(JSON.stringify({ error: "not_connected" }), { status: 400 });
    }

    const result = await syncUser(conn);

    return new Response(
      JSON.stringify({
        imported: result.imported,
        skipped: result.skipped,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (err) {
    console.error("garmin/sync error:", err);
    if (err instanceof GarminAuthError) {
      return new Response(JSON.stringify({ error: "auth_error" }), { status: 401 });
    }
    return new Response(JSON.stringify({ error: "sync_failed" }), { status: 500 });
  }
}
