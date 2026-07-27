import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { garminConnection } from "@/lib/db/schema";
import { revokeAtGarmin } from "@/lib/garmin";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const conn = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, session.user.id),
    });

    if (conn) {
      // Best-effort revoke
      await revokeAtGarmin(conn);

      // Lösche Connection aus DB
      await db.delete(garminConnection).where(eq(garminConnection.userId, session.user.id));
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("garmin/disconnect error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
}
