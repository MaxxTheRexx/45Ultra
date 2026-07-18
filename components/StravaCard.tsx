"use client";

import { useCallback, useEffect, useState } from "react";
import { isOffline } from "@/lib/hooks";
import { useSync } from "@/lib/store";
import { useToast } from "./Toast";

type Status = {
  configured: boolean;
  connected: boolean;
  status?: string;
  athleteName?: string;
  lastSyncAt?: number;
  lastError?: string;
};

function relTime(ms?: number) {
  if (!ms) return "noch nie";
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3600e3);
  if (h < 1) return "gerade eben";
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} Tg.`;
}

export function StravaCard() {
  const { syncNow } = useSync();
  const toast = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const offline = isOffline();

  const loadStatus = useCallback(async () => {
    if (isOffline()) return;
    try { setStatus(await (await fetch("/api/strava/status")).json()); } catch { /* offline */ }
  }, []);

  // Status beim Mount laden und, falls wir gerade vom OAuth-Flow zurückkommen,
  // die passende Rückmeldung zeigen + ?strava-Param aus der URL entfernen.
  useEffect(() => {
    const s = new URLSearchParams(location.search).get("strava");
    if (s) {
      toast(s === "verbunden" ? "Strava verbunden"
        : s === "abgelehnt" ? "Strava-Verbindung abgebrochen"
        : "Strava-Verbindung fehlgeschlagen — bitte Zugangsdaten prüfen");
      history.replaceState(null, "", "/");
    }
    if (isOffline()) return;
    (async () => {
      try { const r = await fetch("/api/strava/status"); setStatus(await r.json()); } catch { /* offline */ }
    })();
  }, [toast]);

  async function saveAndConnect() {
    setBusy(true);
    try {
      const res = await fetch("/api/strava/credentials", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      if (!res.ok) { toast("Zugangsdaten unvollständig — Client-ID (Zahl) und Secret prüfen"); return; }
      window.location.href = "/api/strava/connect"; // OAuth-Weiterleitung
    } finally { setBusy(false); }
  }

  async function pullNow() {
    setBusy(true);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        toast(j.error === "revoked" ? "Strava-Zugriff wurde entzogen — bitte neu verbinden" : "Abruf fehlgeschlagen");
      } else {
        toast(j.imported ? `${j.imported} neue Aktivitäten von Strava` : "Keine neuen Aktivitäten");
        syncNow();
      }
      void loadStatus();
    } finally { setBusy(false); }
  }

  async function disconnect() {
    if (!confirm("Strava-Verbindung trennen? Deine bereits importierten Aktivitäten bleiben erhalten.")) return;
    setBusy(true);
    try {
      await fetch("/api/strava/disconnect", { method: "POST" });
      toast("Strava getrennt");
      setShowForm(false);
      void loadStatus();
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h3><span className="accent">{"//"}</span> Garmin / Strava</h3>

      {offline && (
        <div className="sub">Strava-Abgleich braucht Internet. Deine Aktivitäten kommen automatisch, sobald du online bist.</div>
      )}

      {!offline && status?.connected && (
        <>
          <div className="sub" style={{ fontSize: 14 }}>
            <span className="sync-dot" /> Verbunden{status.athleteName ? ` als ${status.athleteName}` : ""} · letzter Abgleich {relTime(status.lastSyncAt)}
          </div>
          <div className="sub" style={{ marginTop: 6 }}>
            Neue Aktivitäten kommen automatisch einmal täglich von Strava (Garmin lädt sie dorthin hoch).
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className="btn small" disabled={busy} onClick={pullNow}>Jetzt abgleichen</button>
            <button className="btn ghost small" disabled={busy} onClick={disconnect}
              style={{ borderColor: "var(--red)", color: "var(--red)" }}>Trennen</button>
          </div>
        </>
      )}

      {!offline && status && !status.connected && status.status === "revoked" && (
        <>
          <div className="advice warn">Die Verbindung zu Strava wurde getrennt. Deine Aktivitäten bleiben erhalten.</div>
          <button className="btn small" style={{ marginTop: 10 }} disabled={busy}
            onClick={() => { window.location.href = "/api/strava/connect"; }}>Neu verbinden</button>
        </>
      )}

      {!offline && status && !status.connected && status.status !== "revoked" && (
        <>
          <div className="sub" style={{ fontSize: 14, marginBottom: 10 }}>
            Verbinde dein Strava-Konto, damit deine Garmin-Aktivitäten automatisch hier landen
            (Garmin lädt sie zu Strava hoch). Einmalige Einrichtung, ca. 5 Minuten.
          </div>
          {status.status === "error" && status.lastError === "token_exchange" && (
            <div className="advice stop">Das Client-Secret scheint falsch zu sein oder die Callback-Domain stimmt nicht. Bitte unten neu eingeben — die Domain muss exakt <b>endurance24.vercel.app</b> lauten.</div>
          )}

          {!showForm ? (
            <button className="btn small" style={{ marginTop: 4 }} onClick={() => setShowForm(true)}>
              Einrichtung starten
            </button>
          ) : (
            <>
              <details className="ex" open style={{ marginTop: 10 }}>
                <summary>Schritt für Schritt: eigene Strava-App anlegen</summary>
                <div className="ex-body">
                  {`1. Öffne (eingeloggt) strava.com/settings/api und lege eine API-Anwendung an.
2. Trage ein:
   · Name: z. B. „Mein Trainingslog" (darf nicht „Strava" enthalten)
   · Website: https://endurance24.vercel.app
   · Autorisierungs-Callback-Domain: endurance24.vercel.app
     (genau so — ohne https:// und ohne Schrägstrich; häufigster Fehler)
   · Logo: beliebiges Bild hochladen (Pflichtfeld)
3. Strava zeigt dir Client-ID (Zahl) und Client-Secret (auf „Anzeigen" klicken).
   Beides unten einfügen. Das Secret wird verschlüsselt gespeichert.`}
                </div>
              </details>
              <div className="auth-field" style={{ marginTop: 10 }}>
                <label htmlFor="st-cid">Client-ID</label>
                <input id="st-cid" inputMode="numeric" value={clientId}
                  onChange={(e) => setClientId(e.target.value)} placeholder="z. B. 123456" />
              </div>
              <div className="auth-field">
                <label htmlFor="st-secret">Client-Secret</label>
                <input id="st-secret" type="password" value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)} placeholder="langer Zeichencode" />
              </div>
              <button className="btn small" disabled={busy || !clientId || !clientSecret} onClick={saveAndConnect}>
                Speichern &amp; mit Strava verbinden
              </button>
              <div className="sub" style={{ marginTop: 8 }}>
                Deine Strava-App gehört nur dir. Das Secret verlässt den Server nicht.
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
