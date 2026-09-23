"use client";

import { Check, ChevronRight, CircleDashed, Loader2, PauseCircle, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Runner, StageStatus, SystemDef } from "./useStageRunner";

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === "active") return <Loader2 size={14} className="animate-spin text-blue-600" />;
  if (status === "done") return <Check size={14} strokeWidth={3} className="text-emerald-600" />;
  if (status === "failed") return <X size={14} strokeWidth={3} className="text-rose-600" />;
  if (status === "held") return <PauseCircle size={14} className="text-amber-500" />;
  if (status === "reversed") return <RotateCcw size={13} className="text-amber-500" />;
  return <CircleDashed size={14} className="text-ink-400" />;
}

const toneClass = {
  info: "text-ink-500",
  pass: "text-emerald-600",
  warn: "text-amber-500",
  fail: "text-rose-600",
  settle: "text-paper-0 font-semibold",
};

export function BackendPanel({
  runner,
  systems,
  groups,
}: {
  runner: Runner;
  systems: SystemDef[];
  groups: { owner: string; ids: string[] }[];
}) {
  const { scenario, statuses, reversalStatuses, log } = runner;
  const logRef = useRef<HTMLUListElement>(null);
  // Presenters can open any step to talk through it; a fresh scenario clears their choices.
  const [manual, setManual] = useState<Record<string, boolean>>({});
  useEffect(() => setManual({}), [scenario?.key]);
  const toggle = (id: string, isOpen: boolean) => setManual((m) => ({ ...m, [id]: !isOpen }));

  // Keep the newest audit entry in view while presenting.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);
  const stages = scenario?.stages ?? [];

  // A system is busy if any running stage or reversal step touches it; done if a completed stage used it.
  const systemState = (id: string): StageStatus => {
    let state: StageStatus = "pending";
    stages.forEach((st, i) => {
      if (!st.systemIds.includes(id)) return;
      const s = statuses[i];
      if (s === "active" || s === "failed" || s === "held") state = s;
      else if (s === "done" && state === "pending") state = "done";
    });
    (scenario?.reversal ?? []).forEach((r, i) => {
      if (r.systemIds.includes(id) && reversalStatuses[i] !== "pending") state = reversalStatuses[i];
    });
    return state;
  };

  const byId = Object.fromEntries(systems.map((s) => [s.id, s]));
  // Only the step in focus shows its detail; finished steps collapse to one line.
  const lastDone = statuses.reduce((acc, s, i) => (s === "done" ? i : acc), -1);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-paper-200">
          Systems this touches · illustrative
        </p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {groups.map((g) => (
            <div key={g.owner} className="rounded-lg border border-charcoal-700 bg-charcoal-900 px-2 py-1.5">
              <p className="px-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{g.owner}</p>
              <div className="flex flex-wrap gap-1">
                {g.ids.map((id) => {
                  const sys = byId[id];
                  const st = systemState(id);
                  return (
                    <div
                      key={id}
                      title={sys.role}
                      className={cn(
                        "flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 transition-colors duration-300",
                        st === "active" && "border-blue-500 bg-blue-500/15",
                        st === "done" && "border-emerald-600/60 bg-emerald-500/10",
                        (st === "failed" || st === "held") && "border-rose-500 bg-rose-500/15",
                        st === "held" && "border-amber-500 bg-amber-500/15",
                        st === "reversed" && "border-amber-500 bg-amber-500/10",
                        st === "pending" && "border-charcoal-700 bg-charcoal-850"
                      )}
                    >
                      <span className="shrink-0">
                        <StatusIcon status={st} />
                      </span>
                      <p className="min-w-0 truncate text-[11.5px] font-medium text-paper-0">{sys.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-charcoal-700 bg-charcoal-900">
        <p className="flex items-baseline gap-2 border-b border-charcoal-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-paper-200">
          Stages before finality
          <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-ink-400">Click any step to open it</span>
        </p>
        <ol className="divide-y divide-charcoal-800">
          {stages.length === 0 && (
            <li className="px-3 py-6 text-center text-[12px] text-ink-400">Choose a scenario to run.</li>
          )}
          {stages.map((st, i) => {
            const s = statuses[i];
            const auto = s === "active" || s === "failed" || s === "held" || (i === lastDone && !statuses.some((x) => x === "active" || x === "failed" || x === "held"));
            const show = manual[st.id] ?? auto;
            return (
              <li
                key={st.id}
                className={cn(
                  "transition-colors",
                  s === "active" && "bg-blue-500/10",
                  s === "failed" && "bg-rose-500/10",
                  s === "held" && "bg-amber-500/10"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(st.id, show)}
                  aria-expanded={show}
                  className="flex w-full gap-2 px-2.5 py-1.5 text-left hover:bg-paper-0/5"
                >
                  <span className="mt-0.5 w-4 shrink-0 text-right font-mono text-[10.5px] text-ink-400">{i + 1}</span>
                  <span className="mt-0.5 shrink-0">
                    <StatusIcon status={s} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[12.5px] font-medium", s === "pending" ? "text-ink-400" : "text-paper-0", !show && "truncate")}>
                      {st.label}
                      {show && (
                        <span className="ml-2 text-[10.5px] font-normal text-ink-400">
                          {st.systemIds.map((id) => byId[id]?.name).join(" · ")}
                        </span>
                      )}
                    </p>
                    {show && (
                      <p
                        className={cn(
                          "mt-0.5 text-[11.5px] leading-relaxed",
                          s === "failed" ? "text-rose-500" : s === "held" ? "text-amber-500" : "text-paper-200"
                        )}
                      >
                        {s === "failed"
                          ? scenario?.failDetail ?? st.detail
                          : s === "held"
                            ? scenario?.holdDetail ?? st.detail
                            : st.detail}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={13} className={cn("mt-1 shrink-0 text-ink-400 transition-transform", show && "rotate-90")} />
                </button>
              </li>
            );
          })}
          {(scenario?.reversal ?? []).map((r, i) => {
            if (reversalStatuses[i] === "pending") return null;
            const id = `R${i + 1}`;
            const show = manual[id] ?? true;
            return (
              <li key={r.label} className="bg-amber-500/10">
                <button
                  type="button"
                  onClick={() => toggle(id, show)}
                  aria-expanded={show}
                  className="flex w-full gap-2.5 px-3 py-2 text-left hover:bg-paper-0/5"
                >
                  <span className="mt-0.5 w-4 shrink-0 text-right font-mono text-[10.5px] text-amber-500">{id}</span>
                  <span className="mt-0.5 shrink-0">
                    <StatusIcon status={reversalStatuses[i]} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[12.5px] font-medium text-paper-0", !show && "truncate")}>{r.label}</p>
                    {show && <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-500">{r.detail}</p>}
                  </div>
                  <ChevronRight size={13} className={cn("mt-1 shrink-0 text-amber-500/70 transition-transform", show && "rotate-90")} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col overflow-hidden rounded-lg border border-charcoal-700 bg-charcoal-900">
        <p className="border-b border-charcoal-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-paper-200">
          Event log · immutable audit trail
        </p>
        <ul ref={logRef} className="max-h-56 space-y-1.5 overflow-y-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed [scrollbar-color:#3a3f45_transparent]">
          {log.length === 0 && <li className="text-ink-400">Waiting for an instruction…</li>}
          {log.map((l, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 text-ink-400">{l.time}</span>
              <span className={toneClass[l.tone]}>{l.text}</span>
            </li>
          ))}
        </ul>
      </div>
      </div>
      </div>
    </div>
  );
}
