import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { garminConnection } from "@/lib/db/schema";
import { GARMIN_OAUTH } from "@/lib/garmin";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    // Hole Garmin credentials aus DB
    const conn = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, session.user.id),
    });

    if (!conn) {
      return new Response(JSON.stringify({ error: "no_credentials" }), { status: 400 });
    }

    // Generiere state (CSRF-protection)
    const state = Math.random().toString(36).substring(7);

    // Speichere state in session/cookie (kurzzeitig)
    // Für MVP: Wir könnten einen simple state token in der URL haben
    // TODO: state validation in callback

    const params = new URLSearchParams({
      client_id: conn.clientId,
      scope: "wellness",
      redirect_uri: `${new URL(req.url).origin}/api/garmin/callback`,
      response_type: "code",
      state,
    });

    const authUrl = `${GARMIN_OAUTH}/authorize?${params.toString()}`;
    return new Response(null, {
      status: 302,
      headers: { Location: authUrl },
    });
  } catch (err) {
    console.error("garmin/connect error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
}
