"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AppProvider, useApp, useSync } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";
import { Onboarding } from "@/components/Onboarding";
import { AppHeader } from "@/components/AppHeader";
import { HeuteTab } from "@/components/HeuteTab";
import { KalenderTab } from "@/components/KalenderTab";
import { DashboardTab } from "@/components/DashboardTab";
import { PlanTab } from "@/components/PlanTab";
import { ErnaehrungTab } from "@/components/ErnaehrungTab";
import { DatenTab } from "@/components/DatenTab";
import * as ldb from "@/lib/local-db";
import { isOffline } from "@/lib/hooks";

const TABS = [
  { key: "heute", label: "Heute" },
  { key: "kalender", label: "Kalender" },
  { key: "dashboard", label: "Dashboard" },
  { key: "plan", label: "Plan" },
  { key: "ernaehrung", label: "Ernährung" },
  { key: "daten", label: "Daten" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function AppShell() {
  const { ready, planConfig } = useApp();
  const { firstSyncSettled } = useSync();
  const [tab, setTab] = useState<TabKey>("heute");

  if (!ready) return null;
  // Noch keine Config: erst nach dem ersten abgeschlossenen Sync-Versuch
  // entscheiden (er könnte eine Config vom Server ziehen), sonst ins Onboarding.
  if (!planConfig) {
    if (!firstSyncSettled) return null;
    return <Onboarding />;
  }

  return (
    <>
      <AppHeader />
      <nav>
        <div className="nav-inner" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`tab-btn${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
      <main>
        {tab === "heute" && <HeuteTab />}
        {tab === "kalender" && <KalenderTab />}
        {tab === "dashboard" && <DashboardTab />}
        {tab === "plan" && <PlanTab />}
        {tab === "ernaehrung" && <ErnaehrungTab />}
        {tab === "daten" && <DatenTab />}
      </main>
      <div className="footer-note">
        TRAININGSZENTRALE · offline-fähig · synchronisiert automatisch mit deinem Account
      </div>
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const { data: session, isPending, error } = useSession();
  const [offlineAuthed, setOfflineAuthed] = useState<{ hasAuthed: boolean; userId?: string } | null>(null);

  useEffect(() => {
    ldb.getAuthMeta().then(setOfflineAuthed);
  }, []);

  // Offline oder Server nicht erreichbar (error): lokaler Anmelde-Stand zählt.
  const unreachable = isOffline() || !!error;
  const authed = !!session || (unreachable && offlineAuthed?.hasAuthed);

  useEffect(() => {
    // Nur umleiten, wenn der Server erreichbar war und klar "nicht angemeldet" sagt.
    if (!isPending && offlineAuthed !== null && !authed && !unreachable) {
      router.replace("/login");
    }
  }, [isPending, offlineAuthed, authed, unreachable, router]);

  if (isPending || offlineAuthed === null || !authed) return null;

  const userId = session?.user.id ?? offlineAuthed.userId ?? null;

  return (
    <ToastProvider>
      <AppProvider userId={userId}>
        <AppShell />
      </AppProvider>
    </ToastProvider>
  );
}
