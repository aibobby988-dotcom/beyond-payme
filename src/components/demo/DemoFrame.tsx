"use client";

import { Columns2, Pause, Play, RotateCcw, Workflow } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/Badge";
import { cn } from "@/lib/utils";
import { BackendPanel } from "./BackendPanel";
import { FlowChart } from "./FlowChart";
import type { Runner, Scenario, SystemDef } from "./useStageRunner";

export interface DemoScenario extends Scenario {
  title: string;
  icon: ReactNode;
  exception?: boolean;
}

/**
 * Shared chrome for both demos: scenario picker, pause/reset, and the two views of
 * one run — client and bank side by side, or the same run as an animated flow chart.
 */
export function DemoFrame({
  runner,
  scenarios,
  systems,
  groups,
  channel,
  client,
  picker,
  bankHeader,
  leftFooter,
  onReset,
}: {
  runner: Runner;
  scenarios: DemoScenario[];
  systems: SystemDef[];
  groups: { owner: string; ids: string[] }[];
  channel: string;
  client: ReactNode;
  /** Replaces the scenario buttons, e.g. with an order ticket. */
  picker?: ReactNode;
  /** Shown at the top of the bank panel, e.g. a live reserve check. */
  bankHeader?: ReactNode;
  /** Shown under the client view, e.g. presenter controls. */
  leftFooter?: ReactNode;
  /** Extra reset for state the demo keeps outside the runner. */
  onReset?: () => void;
}) {
  const [tab, setTab] = useState<"side" | "flow">("side");
  const { scenario, phase, paused, clock } = runner;
  const busy = phase === "running" || phase === "held";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {picker ?? scenarios.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={busy}
            onClick={() => runner.start(s)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              scenario?.key === s.key
                ? "border-brand-500 bg-brand-50 text-charcoal-900"
                : "border-paper-200 bg-paper-0 text-ink-700 hover:bg-paper-50",
              s.exception && scenario?.key !== s.key && "border-rose-100"
            )}
          >
            {s.icon}
            {s.title}
          </button>
        ))}
      </div>

      <div className="sticky top-12 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-paper-200 bg-paper-50/95 px-2 py-2 shadow-sm backdrop-blur">
        <div role="tablist" aria-label="Demo view" className="inline-flex rounded-lg border border-paper-200 bg-paper-0 p-1">
          {(
            [
              ["side", "Side-by-side view"],
              ["flow", "Flow chart"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                tab === key ? "bg-charcoal-900 text-paper-0" : "text-ink-500 hover:text-charcoal-900"
              )}
            >
              {key === "side" ? <Columns2 size={13} /> : <Workflow size={13} />}
              {label}
            </button>
          ))}
        </div>

        {scenario && (
          <span className="flex items-center gap-1.5 text-[12px] text-ink-500">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                paused ? "bg-amber-500" : phase === "running" ? "animate-pulse bg-blue-500" : phase === "completed" ? "bg-emerald-500" : phase === "failed" ? "bg-rose-500" : "bg-ink-400"
              )}
            />
            {paused ? "Paused" : phase === "running" ? "Running" : phase === "completed" ? "Finished" : phase === "failed" ? "Stopped" : "Ready"}
            <span className="font-mono text-ink-400">{clock}</span>
          </span>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-paper-200 bg-paper-0 p-0.5" role="group" aria-label="Playback speed">
            {[0.5, 1, 2].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => runner.setSpeed(v)}
                aria-pressed={runner.speed === v}
                className={cn("rounded-md px-2 py-1.5 font-mono text-[11.5px]", runner.speed === v ? "bg-charcoal-900 text-paper-0" : "text-ink-500 hover:text-charcoal-900")}
              >
                {v}×
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={runner.togglePause}
            disabled={phase !== "running"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium disabled:opacity-40",
              paused ? "border-brand-500 bg-brand-50 text-charcoal-900" : "border-paper-200 bg-paper-0 text-ink-700 hover:bg-paper-50"
            )}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? "Resume" : "Pause to explain"}
          </button>
          <button
            type="button"
            onClick={() => {
              runner.reset();
              onReset?.();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-0 px-3 py-2 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {tab === "flow" && <FlowChart runner={runner} lanes={groups} systems={systems} fallback={scenarios[0]} />}

      <div hidden={tab !== "side"} className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3 xl:sticky xl:top-16 xl:self-start">
          <div className="rounded-2xl border-2 border-brand-500 bg-paper-50 p-4 shadow-[0_0_0_4px_rgba(219,0,17,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">What the client sees</p>
              <Badge tone="neutral">{channel}</Badge>
            </div>
            {client}
          </div>
          {leftFooter}
        </div>

        <div className="flex flex-col rounded-2xl border border-charcoal-800 bg-charcoal-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-paper-200">What the bank is doing</p>
            <span className="font-mono text-[11px] text-ink-400">{scenario ? `${clock} HKT` : ""}</span>
          </div>
          {bankHeader}
          <BackendPanel runner={runner} systems={systems} groups={groups} />
        </div>
      </div>
    </div>
  );
}
