import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { UserStoriesBoard } from "@/components/UserStoriesBoard";
import { Footer, PageHero, SectionHead } from "@/components/ui";
import { businessRules, epics, orderFields, personas, stories } from "@/lib/userStories";

export const metadata: Metadata = { title: "User stories — Beyond PayMe" };

export default function UserStoriesPage() {
  const total = stories.reduce((a, s) => a + s.points, 0);
  const must = stories.filter((s) => s.priority === "Must").length;

  return (
    <div className="min-h-screen">
      <PageHero eyebrow="User stories · epics and acceptance criteria" title="The fund-settlement demo, written as the user stories a squad would build from">
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-paper-200">
          Each story carries why it exists, named acceptance scenarios in Given/When/Then, the business rules that always hold, the edge cases to handle, the data and messages involved, non-functional expectations, dependencies and open questions — and points to the demo scenario or bank step where you can watch it. Priorities are Must, Should and Could; estimates are relative sizes, not days.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-paper-0">
          {[
            [String(epics.length), "epics"],
            [String(stories.length), "user stories"],
            [String(must), "must-haves"],
            [String(total), "points (indicative)"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-mono text-[26px] font-semibold tabular-nums">{n}</p>
              <p className="text-[12px] text-ink-400">{l}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <main className="mx-auto max-w-[1400px] space-y-16 px-5 py-10 sm:px-8">
        <section className="space-y-6">
          <SectionHead eyebrow="Who we are building for" title="Personas" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {personas.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-xl border border-paper-200 bg-paper-0 p-4">
                <UserRound size={18} className="mt-0.5 shrink-0 text-brand-500" />
                <div>
                  <p className="text-[14px] font-semibold text-charcoal-900">{p.name}</p>
                  <p className="text-[12px] text-ink-500">{p.role}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">{p.needs}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHead eyebrow="Epics and stories" title="Six epics: four we would build for any stablecoin use case, two for fund investing">
            <p>The <strong className="font-semibold text-charcoal-900">Stablecoin platform</strong> epics — issuing, wallets, reserve checks, channels — are built once as a licensed issuer and carry over to whatever HSBC builds on the coin next. The <strong className="font-semibold text-charcoal-900">Fund investing</strong> epics are the two specific to this product. Click any story to open it in full; S-301, subscribing to fund units in one instruction, is open to start with.</p>
          </SectionHead>
          <UserStoriesBoard />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <p className="text-[14px] font-semibold text-charcoal-900">Fund order instruction — data fields</p>
            <p className="mt-1 text-[12.5px] text-ink-500">What HSBCnet or the treasurer&apos;s ERP sends to place an order. Example values match the demo.</p>
            <table className="mt-3 w-full min-w-[680px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-paper-200 text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-3 font-medium">Field</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Required</th>
                  <th className="py-2 pr-3 font-medium">Example</th>
                  <th className="py-2 font-medium">Validation</th>
                </tr>
              </thead>
              <tbody>
                {orderFields.map(([f, t, r, e, v]) => (
                  <tr key={f} className="border-b border-paper-100 align-top last:border-0">
                    <td className="py-2 pr-3 font-mono text-charcoal-900">{f}</td>
                    <td className="py-2 pr-3 text-ink-700">{t}</td>
                    <td className="py-2 pr-3 text-ink-700">{r}</td>
                    <td className="py-2 pr-3 font-mono text-ink-700">{e}</td>
                    <td className="py-2 leading-relaxed text-ink-700">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">Business rules</p>
              <ol className="mt-2.5 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-ink-700">
                {businessRules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">How the stories were cut</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                Small end-to-end releases a squad can demo, each small enough for one sprint and independently testable. The one 13-point story,
                S-301, is the first candidate to split — its ERP callback, for example, can ship separately.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
