"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name: name || email.split("@")[0] });
      if (res.error) {
        setError(readableError(res.error.message));
      } else {
        router.replace("/");
      }
    } finally {
      setBusy(false);
    }
  }

  async function passkeyLogin() {
    setError("");
    setBusy(true);
    try {
      const res = await authClient.signIn.passkey();
      if (res?.error) {
        setError(readableError(res.error.message));
      } else {
        router.replace("/");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Trail<em>head</em></h1>
        <div className="auth-sub">TRAININGSZENTRALE · ANMELDEN</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="name">Name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)}
                autoComplete="name" placeholder="Wie sollen wir dich nennen?" />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="email">E-Mail</label>
            <input id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username webauthn" placeholder="du@beispiel.de" />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Passwort</label>
            <input id="password" type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="mind. 8 Zeichen" />
          </div>
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
            {busy ? "Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}
          </button>
        </form>
        <div className="auth-divider">oder</div>
        <button className="btn ghost" onClick={passkeyLogin} disabled={busy} style={{ width: "100%" }}>
          Mit Passkey anmelden
        </button>
        <div className="auth-switch">
          {mode === "login" ? (
            <>Noch kein Konto? <button onClick={() => { setMode("register"); setError(""); }}>Registrieren</button></>
          ) : (
            <>Schon ein Konto? <button onClick={() => { setMode("login"); setError(""); }}>Anmelden</button></>
          )}
        </div>
      </div>
      <div className="footer-note" style={{ paddingTop: 20 }}>
        Dein Trail-Trainingsplan · offline-fähig
      </div>
    </div>
  );
}

function readableError(msg?: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid email or password") || m.includes("invalid password")) return "E-Mail oder Passwort ist falsch.";
  if (m.includes("user already exists")) return "Für diese E-Mail gibt es schon ein Konto. Bitte anmelden.";
  if (m.includes("password too short")) return "Das Passwort ist zu kurz (mind. 8 Zeichen).";
  if (m.includes("failed to fetch")) return "Keine Verbindung zum Server. Bist du online?";
  return msg || "Das hat nicht geklappt. Bitte noch einmal versuchen.";
}
