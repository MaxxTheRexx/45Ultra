import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { garminConnection } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import { GARMIN_API } from "@/lib/garmin";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const body = await req.json() as { clientId: string; clientSecret: string };
    if (!body.clientId || !body.clientSecret) {
      return new Response(JSON.stringify({ error: "missing_credentials" }), { status: 400 });
    }

    // Teste, ob Credentials gültig sind (dummy-Call zur Garmin API)
    // In Realität könnten wir hier einen Test-Call machen
    // Für MVP: Speichere einfach und lasse User später OAuth-Flow starten

    // Lösche alte Verbindung falls vorhanden
    await db.delete(garminConnection).where(eq(garminConnection.userId, session.user.id));

    // Speichere neue Verbindung (noch nicht authentifiziert)
    await db.insert(garminConnection).values({
      userId: session.user.id,
      clientId: body.clientId,
      clientSecretEnc: encrypt(body.clientSecret),
      status: "pending",
      createdAt: Date.now(),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("garmin/credentials error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
}
