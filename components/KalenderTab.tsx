"use client";

import { useState } from "react";
import { DOW, addDays, fmtD, fmtDM, weekdayIndex, weekIndexOf, weekMonday } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { phaseOfWeek, planModel } from "@/lib/plan-model";
import { useApp } from "@/lib/store";
import { useToast } from "./Toast";
import { TYPELBL } from "@/lib/types";

export function KalenderTab() {
  const { plan, toggleDone, moveSession, planConfig } = useApp();
  const toast = useToast();
  const today = useToday();
  // Angezeigte Woche: solange nicht navigiert wurde, die aktuelle.
  const [mondayOverride, setMonday] = useState<Date | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const monday = mondayOverride ?? (today ? weekMonday(new Date()) : null);
  if (!monday || !today || !planConfig) return null;
  const w = weekIndexOf(planConfig.planStart, fmtD(monday));
  const weeks = planModel(planConfig).weeks;
  const ph = phaseOfWeek(planConfig, w);
  const end = addDays(monday, 6);

  function tryMove(id: string, dateStr: string) {
    const s = plan.find((x) => x.id === id);
    if (!s || !planConfig) return;
    const wd = weekdayIndex(new Date(dateStr + "T12:00"));
    if (wd === 0 && !["stretch", "ruhe", "yoga"].includes(s.type)) {
      toast("Montag ist Ruhetag. Nur Stretching/Yoga erlaubt.");
      return;
    }
    moveSession(id, dateStr, weekIndexOf(planConfig.planStart, dateStr));
    toast(`"${s.title}" → ${DOW[wd]} verschoben`);
  }

  return (
    <section className="tab">
      <div className="cal-head">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn ghost small" onClick={() => setMonday(addDays(monday, -7))}>←</button>
          <button className="btn ghost small" onClick={() => setMonday(weekMonday(new Date()))}>Heute</button>
          <button className="btn ghost small" onClick={() => setMonday(addDays(monday, 7))}>→</button>
        </div>
        <div className="cal-week-label">
          {fmtDM(monday)} – {fmtDM(end)}
        </div>
        <div className="sub">
          {w >= 1 && w <= weeks
            ? <>Woche <b className="mono" style={{ color: "var(--orange)" }}>{w}/{weeks}</b> · {ph?.name ?? ""}</>
            : "außerhalb des Plans"}
        </div>
      </div>
      <div className="sub" style={{ marginBottom: 10 }}>
        Einheit ziehen (Desktop) oder antippen und dann den Zieltag antippen (Mobil). Klick auf ✓ = erledigt. Montag bleibt Ruhetag, nur Stretching dorthin schieben.
      </div>
      <div className="cal-grid">
        {[...Array(7)].map((_, i) => {
          const d = addDays(monday, i), ds = fmtD(d);
          const ses = plan.filter((s) => s.date === ds);
          return (
            <div
              key={ds}
              className={`cal-day${ds === today ? " today-col" : ""}${dragOver === ds ? " dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(ds); }}
              onDragLeave={() => setDragOver((cur) => (cur === ds ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                tryMove(e.dataTransfer.getData("text"), ds);
              }}
              onClick={() => {
                if (movingId) { tryMove(movingId, ds); setMovingId(null); }
              }}
            >
              <div className="d-head">
                <span>{DOW[i]}{i === 0 ? " · Ruhetag" : ""}</span>
                <span className="dnum">{fmtDM(d)}</span>
              </div>
              {ses.map((s) => (
                <div
                  key={s.id}
                  className={`sess s-${s.type}${s.done ? " done" : ""}${movingId === s.id ? " moving" : ""}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text", s.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMovingId((cur) => (cur === s.id ? null : s.id));
                    if (movingId !== s.id) toast("Jetzt Zieltag antippen");
                  }}
                >
                  <div className="s-t">{TYPELBL[s.type]}</div>
                  <div className="s-n">{s.title}</div>
                  <div className="s-d">
                    {s.dur} min {s.km ? `· ${s.km} km` : ""} {s.hm ? `· ${s.hm} hm` : ""}
                    <span
                      style={{ float: "right", cursor: "pointer" }}
                      title="erledigt"
                      onClick={(e) => { e.stopPropagation(); toggleDone(s.id); }}
                    >
                      {s.done ? "✓" : "○"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
