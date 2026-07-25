"use client";

import { useEffect, useRef } from "react";
import { planModel } from "@/lib/plan-model";
import { placementFor, scienceFor } from "@/lib/content/training-science";
import { SESSION_IMG } from "@/lib/img";
import { useApp } from "@/lib/store";
import { TYPELBL, type PlanSession } from "@/lib/types";

/**
 * Detailansicht einer Trainingseinheit: Foto, Ablauf, wissenschaftlicher
 * Hintergrund, Nutzen, Platz im Plan, Quellen. Bottom-Sheet (mobil) / Modal
 * (Desktop) — nur CSS/JSX, keine Zusatz-Dependency.
 */
export function TrainingDetail({
  session, onClose, onStartMove,
}: {
  session: PlanSession;
  onClose: () => void;
  onStartMove?: (id: string) => void;
}) {
  const { planConfig, toggleDone } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const sci = scienceFor(session);
  const model = planConfig ? planModel(planConfig) : null;
  const phase = model?.phaseOfWeek(session.week);
  const weeks = model?.weeks;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={session.title} onClick={(e) => e.stopPropagation()}>
        <div className={`sheet-photo s-${session.type}`}>
          <img src={SESSION_IMG[session.type]} alt="" />
          <div className="pc-overlay" />
          <button ref={closeRef} className="sheet-close" onClick={onClose} aria-label="Schließen">×</button>
          <div className="pc-body">
            <div className="chip-row" style={{ marginBottom: 8 }}>
              <span className="chip solid">{TYPELBL[session.type]}</span>
              <span className="chip">ca. {session.dur} min</span>
              {session.km ? <span className="chip">{session.km} km</span> : null}
              {session.hm ? <span className="chip">{session.hm} hm</span> : null}
              {session.done ? <span className="chip done">✓ erledigt</span> : null}
            </div>
            <div className="pc-title" style={{ fontSize: 26 }}>{session.title}</div>
          </div>
        </div>

        <div className="sheet-body">
          {weeks && phase && (
            <div className="pill" style={{ marginBottom: 4 }}>Woche {session.week} von {weeks} · {phase.name}</div>
          )}

          <h4>So läuft&apos;s</h4>
          <p>{session.detail}</p>

          <h4>Warum dieses Training</h4>
          {sci.why.map((p, i) => <p key={i} style={{ marginBottom: 8 }}>{p}</p>)}

          <h4>Was es dir bringt</h4>
          <p className="sheet-lead">{sci.benefit}</p>

          <h4>Dein Platz im Plan</h4>
          <p>{placementFor(sci, phase?.kind)}{phase?.desc ? `\n\n${phase.desc}` : ""}</p>

          <h4>Quellen</h4>
          <p style={{ fontSize: 12.5 }}>
            {sci.sources.map((s, i) => (
              <span key={i}>
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--orange)", fontWeight: 600 }}>{s.label} ↗</a>
              </span>
            ))}
          </p>
        </div>

        <div className="sheet-foot">
          <button className="btn" style={{ flex: 1 }} onClick={() => { toggleDone(session.id); onClose(); }}>
            {session.done ? "Doch nicht erledigt" : "Als erledigt markieren"}
          </button>
          {onStartMove && (
            <button className="btn ghost" onClick={() => { onStartMove(session.id); onClose(); }}>Verschieben</button>
          )}
        </div>
      </div>
    </div>
  );
}
