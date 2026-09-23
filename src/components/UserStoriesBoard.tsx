"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { epics, personas, stories, type Pkg } from "@/lib/userStories";
import { cn } from "@/lib/utils";

const filters: ("All" | Pkg)[] = ["All", "Any use case", "Fund investing"];
const pkgTone: Record<Pkg, string> = {
  "Any use case": "bg-paper-100 text-ink-700",
  "Fund investing": "bg-blue-100 text-blue-600",
};
const prioTone = { Must: "text-brand-600", Should: "text-charcoal-900", Could: "text-ink-500" };

export function UserStoriesBoard() {
  const [filter, setFilter] = useState<"All" | Pkg>("All");
  const [open, setOpen] = useState<Set<string>>(new Set(["S-301"]));
  const personaName = Object.fromEntries(personas.map((p) => [p.id, p.name]));
  const shown = epics.filter((e) => filter === "All" || e.pkg === filter);
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const visibleStories = stories.filter((s) => shown.some((e) => e.id === s.epic));
  const allOpen = visibleStories.every((s) => open.has(s.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              filter === f ? "border-brand-500 bg-brand-50 text-charcoal-900" : "border-paper-200 bg-paper-0 text-ink-700 hover:bg-paper-50"
            )}
          >
            {f}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(visibleStories.map((s) => s.id)))}
          className="ml-auto rounded-lg border border-paper-200 bg-paper-0 px-3 py-1.5 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50"
        >
          {allOpen ? "Collapse all" : "Expand all criteria"}
        </button>
      </div>

      {shown.map((e) => {
        const eStories = stories.filter((s) => s.epic === e.id);
        const pts = eStories.reduce((a, s) => a + s.points, 0);
        return (
          <div key={e.id} className="overflow-hidden rounded-2xl border border-paper-200 bg-paper-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-paper-200 bg-paper-50 px-5 py-3">
              <span className="font-mono text-[13px] font-semibold text-brand-600">{e.id}</span>
              <span className="text-[14px] font-semibold text-charcoal-900">{e.name}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", pkgTone[e.pkg])}>{e.pkg}</span>
              <span className="ml-auto text-[12px] text-ink-500">
                {e.release} · {eStories.length} {eStories.length === 1 ? "story" : "stories"} · {pts} pts
              </span>
              <p className="w-full text-[12.5px] text-ink-500">{e.goal}</p>
            </div>
            <ul className="divide-y divide-paper-100">
              {eStories.map((s) => {
                const isOpen = open.has(s.id);
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => toggle(s.id)} aria-expanded={isOpen} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-paper-50">
                      <ChevronRight size={15} className={cn("mt-0.5 shrink-0 text-ink-400 transition-transform", isOpen && "rotate-90")} />
                      <span className="w-14 shrink-0 font-mono text-[12px] text-ink-500">{s.id}</span>
                      <span className="flex-1 text-[13.5px] leading-relaxed text-charcoal-900">
                        As a <strong className="font-semibold">{personaName[s.persona]}</strong>, I want {s.want}, so that {s.so}.
                      </span>
                      <span className={cn("hidden w-14 shrink-0 text-right text-[12px] font-semibold sm:block", prioTone[s.priority])}>{s.priority}</span>
                      <span className="w-10 shrink-0 text-right font-mono text-[12px] text-ink-500">{s.points}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-3 px-5 pb-4 pl-[92px]">
                        <p className="text-[12.5px] leading-relaxed text-ink-700">
                          <span className="font-semibold text-charcoal-900">Why: </span>
                          {s.context}
                        </p>

                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Acceptance criteria</p>
                          <div className="space-y-2">
                            {s.criteria.map((c) => (
                              <div key={c.name} className="overflow-hidden rounded-lg bg-charcoal-950">
                                <p className="border-b border-charcoal-800 px-3.5 py-1.5 text-[11.5px] font-semibold text-paper-0">{c.name}</p>
                                <div className="px-3.5 py-2.5 font-mono text-[12px] leading-relaxed">
                                  {c.gwt.map(([k, v], i) => (
                                    <p key={i} className="flex gap-2">
                                      <span
                                        className={cn(
                                          "w-10 shrink-0 font-semibold",
                                          k === "Given" ? "text-blue-500" : k === "When" ? "text-amber-500" : k === "Then" ? "text-emerald-500" : "text-ink-400"
                                        )}
                                      >
                                        {k}
                                      </span>
                                      <span className="text-paper-100">{v}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {([
                            ["Business rules", s.rules],
                            ["Edge cases to handle", s.edge],
                            ["Data and messages", s.data],
                            ["Non-functional", s.nfr],
                            ["Dependencies", s.deps],
                            ["Open questions", s.questions],
                          ] as const)
                            .filter(([, items]) => items && items.length)
                            .map(([title, items]) => (
                              <div key={title} className="rounded-lg border border-paper-200 bg-paper-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{title}</p>
                                <ul className="mt-1.5 space-y-1 text-[12.5px] leading-relaxed text-ink-700">
                                  {items!.map((i) => (
                                    <li key={i} className="flex gap-2">
                                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                                      {i}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                        </div>

                        <p className="text-[12px] text-ink-500">
                          <span className="font-semibold text-ink-700">Seen in the demo:</span> {s.trace}
                          {s.notes && (
                            <>
                              {" · "}
                              <span className="font-semibold text-ink-700">Note:</span> {s.notes}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
