import type { Metadata } from "next";
import { CheckCircle2, Flag, Gauge, ShieldAlert } from "lucide-react";
import { Footer, PageHero, SectionHead, Source } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Delivery plan — Beyond PayMe" };

const releases = [
  {
    id: "R0",
    name: "Stablecoin foundation",
    sprints: "~5 sprints",
    scope: [
      "Issuance and redemption wired to HKD accounts and the segregated reserve",
      "Wallet approved-wallet list with travel-rule data on every transfer",
      "Check that stablecoins in circulation always match reserves after every movement, with automatic pausing of new issuance",
      "HSBCnet entitlements: orders follow each client's signature groups, limits and sole-control setting",
      "Test environment connected to the EnsembleTX sandbox",
    ],
    gate: ["1,000 test issue/redeem cycles with zero reconciliation breaks", "Security review, and sign-off of the witnessed key-creation process", "Financial crime compliance signs off the approved-wallet list model"],
    measure: "Reconciliation breaks: 0",
  },
  {
    id: "R1",
    name: "First live fund trade",
    sprints: "~4 sprints",
    scope: [
      "HSBC HKD stablecoin enabled as a settlement money on the CSOP tokenised class (HSBC is trustee, registrar and tokenisation agent)",
      "HSBCnet order ticket, authorisations queue, order status and contract notes; HSBCnet Mobile authorisation",
      "Subscribe and redeem settled delivery-versus-payment; settlement-routing service v1 (stablecoin by default)",
      "Exception path: units not issued → stablecoin returned, optionally converted back to HKD",
      "Contract notes and ERP callbacks",
    ],
    gate: ["Parallel run with one friendly corporate treasury", "HKMA engagement complete for the use case", "Runbooks live and the 24/7 support rota staffed"],
    measure: "First live subscribe and redeem in the HSBC HKD stablecoin",
  },
  {
    id: "R2",
    name: "Scale, fund by fund",
    sprints: "Ongoing",
    scope: [
      "BlackRock HKD Digital Liquidity Fund, then a fund HSBC does not service",
      "Settlement-router fallbacks: internal tokenised deposits, and cross-bank via EnsembleTX",
      "Investors who don't bank with HSBC hold the stablecoin through distributors and buy fund units with it",
      "Orders from clients' treasury systems over API, authorised in their own workflow",
      "Standing instructions (auto-invest surplus, auto-return to cash)",
    ],
    gate: ["Each new fund passes the same readiness checklist and its trustee signs off the settlement money"],
    measure: "Funds accepting the stablecoin · straight-through rate · weekly volume",
  },
];

const dependencies = [
  { dep: "HSBC HKD stablecoin issuer platform (retail launch due H2 2026)", owner: "GPS Digital Money · issuer", when: "R0", note: "Use the same platform HSBC is building for the PayMe launch. Corporate clients get their own wallets, not a second stablecoin system: one reserve, one set of keys, one reconciliation to the HKMA.", level: "high" },
  { dep: "Fund enables the HSBC HKD stablecoin as an accepted settlement money", owner: "CSOP, with HSBC as trustee and registrar", when: "R1", note: "The one external decision in R1 — and HSBC already sits in the fund's service chain.", level: "med" },
  { dep: "OSL's six-month exclusive onboarding of the CSOP class (from 3 June 2026)", owner: "Legal · Product", when: "R1", note: "Check whether it covers direct subscriptions; it would lapse around early December.", level: "med" },
  { dep: "EnsembleTX DvP and 24/7 operation (targeted by end-2026)", owner: "HKMA · EnsembleTX", when: "R1–R2", note: "R1 can settle through the transfer agent; EnsembleTX is an upgrade, not a blocker.", level: "low" },
  { dep: "Investor wallets onboarded to the issuer approved-wallet list and the fund register", owner: "Securities Services · FCC", when: "R1", note: "One onboarding journey for both lists, or every new investor waits twice.", level: "med" },
];

const raciRoles = ["Product (GPS Digital Money)", "GPS Technology", "Issuer ops & Treasury", "Securities Services", "Compliance / FCC", "Legal", "Risk"];
const raci: [string, string[]][] = [
  ["Issuer core and reserve reconciliation", ["A", "R", "R", "I", "C", "I", "C"]],
  ["Wallet approved-wallet list policy", ["A", "R", "I", "I", "R", "C", "C"]],
  ["Fund accepts the stablecoin for settlement", ["A", "R", "I", "R", "C", "C", "I"]],
  ["DvP integration (TA / EnsembleTX)", ["A", "R", "I", "R", "I", "I", "C"]],
  ["Investor wallet onboarding", ["A", "R", "I", "R", "R", "I", "I"]],
  ["HKMA engagement per use case", ["R", "C", "C", "C", "A", "C", "C"]],
  ["24/7 operations and incident response", ["C", "R", "A", "C", "I", "I", "I"]],
];

const risks = [
  { r: "Coin supply and reserve drift apart", l: "Low", i: "Severe", m: "Reconcile after every movement; any break pauses issuance and pages the 24/7 rota", o: "Issuer ops" },
  { r: "Issuer key compromise", l: "Low", i: "Severe", m: "Keys in tamper-resistant hardware, more than one person needed above a threshold, and a switch to stop issuance globally or per wallet", o: "GPS Technology" },
  { r: "Funds slow to accept a second stablecoin", l: "Med", i: "High", m: "Start with CSOP, where HSBC is trustee and registrar; BlackRock second", o: "Product" },
  { r: "24/7 support cost", l: "High", i: "Med", m: "Automate unwinds; human decisions only on exceptions; staffed rota", o: "Issuer ops" },
  { r: "OSL's exclusive onboarding delays direct subscriptions on the CSOP class", l: "Med", i: "Med", m: "Confirm scope with Legal in R0; run the pilot inside the terms or once they lapse", o: "Legal · Product" },
  { r: "Stablecoin cannibalises tokenised deposits", l: "Med", i: "Med", m: "Clear roles: the stablecoin settles fund trades; tokenised deposits stay the corporate treasury product and the internal standby", o: "Product" },
];

const nfrs = [
  ["Availability", "24/7 for issuing, redeeming and transfers; 99.9% monthly target (indicative)"],
  ["Settlement speed", "Cash and units transfer in under 5 seconds, 95% of the time (indicative)"],
  ["Reconciliation", "Zero tolerance; checked after every movement, not end of day"],
  ["Recovery", "No lost records after a failure, and service back within an hour (indicative)"],
  ["Security", "Issuing keys held in tamper-resistant hardware (HSM); more than one person needed above an issuance threshold; a switch to stop issuance"],
  ["Audit", "Immutable event log tied to each order; retained per regulatory record-keeping"],
  ["Client messaging", "Never reveals which control fired; always says where the money is"],
];

const dod = [
  "Acceptance criteria met and demoed to the product owner",
  "Unit, integration and reconciliation tests pass in the pipeline",
  "Audit events emitted for every state change",
  "Monitoring and alerts in place; runbook updated",
  "Security review for anything touching keys or issuance",
  "FCC sign-off where a control changed",
  "Client-facing copy reviewed for tipping-off",
];

const readiness = [
  "Runbooks for pausing issuance, stuck settlement, failed delivery-versus-payment and reserve breaks",
  "24/7 rota with a named owner for any held order",
  "Rollback: pause issuance and let the router fall back to tokenised deposits; conventional payment if both settlement options are affected",
  "Fallback rehearsed end to end: issuance paused, order still settles in tokenised deposits",
  "Client communication templates for delay, unwind and gated redemptions",
  "HKMA engagement recorded for the use case",
  "Pilot client trained; parallel run signed off",
];

const measures = [
  { m: "Reconciliation breaks", t: "0", k: "Control" },
  { m: "Straight-through rate (no human touch)", t: "> 95% (indicative)", k: "Efficiency" },
  { m: "Time from instruction to settlement", t: "Seconds, not days", k: "Client" },
  { m: "Funds accepting the HSBC HKD stablecoin", t: "1 → 3 in the first year", k: "Adoption" },
  { m: "Investors outside HSBC buying fund units with the stablecoin", t: "First by R2", k: "Reach" },
  { m: "Failed trades unwound without a human", t: "100%", k: "Operations" },
];

export default function DeliveryPage() {
  return (
    <div className="min-h-screen">
      <PageHero eyebrow="Delivery plan · for GPS Technology" title="First live transaction first, breadth later">
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-paper-200">
          Build the issuer core once, then deliver the fund settlement service in small end-to-end releases, each ending in a real transaction the HKMA
          can see. Sprint counts, targets and team sizes are indicative — they show the shape of the plan, not a commitment.
        </p>
      </PageHero>

      <main className="mx-auto max-w-[1400px] space-y-16 px-5 py-10 sm:px-8">

        <section className="space-y-6">
          <SectionHead eyebrow="Release plan" title="Three releases, each with a go/no-go gate">
            <p>Two-week sprints. R1 starts once R0 passes its gate; R2 then adds funds one at a time on the same service.</p>
          </SectionHead>
          <div className="grid gap-4 lg:grid-cols-3">
            {releases.map((r) => (
              <div key={r.id} className={cn("flex h-full flex-col rounded-2xl border bg-paper-0 p-5", r.id === "R0" ? "border-charcoal-900" : "border-paper-200")}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-[13px] font-semibold text-brand-600">{r.id}</p>
                  <span className="rounded-full bg-paper-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">{r.sprints}</span>
                </div>
                <p className="mt-1 text-[15px] font-semibold text-charcoal-900">{r.name}</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-[12.5px] leading-relaxed text-ink-700">
                  {r.scope.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-lg bg-paper-50 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    <Flag size={12} /> Go/no-go gate
                  </p>
                  <ul className="mt-1.5 space-y-1 text-[12.5px] text-ink-700">
                    {r.gate.map((g) => (
                      <li key={g} className="flex gap-1.5">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-[12.5px] font-medium text-charcoal-900">
                  <Gauge size={14} className="mt-0.5 shrink-0 text-brand-500" />
                  {r.measure}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHead eyebrow="Critical path" title="Dependencies that set the pace">
            <p>One sits on the critical path: the shared issuer platform. The one external decision is a fund agreeing to accept the stablecoin — which is why R1 starts with CSOP, where HSBC is already trustee and registrar.</p>
          </SectionHead>
          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0">
            <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-paper-200 text-[11.5px] uppercase tracking-wide text-ink-400">
                  <th className="w-[24%] px-5 py-2.5 font-medium">Dependency</th>
                  <th className="w-[16%] px-3 py-2.5 font-medium">Owner</th>
                  <th className="w-24 whitespace-nowrap px-3 py-2.5 font-medium">Needed by</th>
                  <th className="w-32 px-3 py-2.5 font-medium">Criticality</th>
                  <th className="px-5 py-2.5 font-medium">Handling</th>
                </tr>
              </thead>
              <tbody>
                {dependencies.map((d) => (
                  <tr key={d.dep} className="border-b border-paper-100 align-top last:border-0">
                    <td className="px-5 py-3 font-medium text-charcoal-900">{d.dep}</td>
                    <td className="px-3 py-3 text-ink-700">{d.owner}</td>
                    <td className="px-3 py-3 font-mono text-ink-700">{d.when}</td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", d.level === "high" ? "bg-rose-100 text-rose-600" : d.level === "med" ? "bg-amber-100 text-amber-500" : "bg-emerald-100 text-emerald-600")}>
                        {d.level === "high" ? "Critical path" : d.level === "med" ? "Watch" : "Not blocking"}
                      </span>
                    </td>
                    <td className="px-5 py-3 leading-relaxed text-ink-700">{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-ink-500">
            Sources: <Source href="https://www.about.hsbc.com.hk/news-and-media/hsbc-welcomes-hkmas-grant-of-a-hong-kong-stablecoin-issuer-licence">HSBC stablecoin plan</Source>{" "}
            · <Source href="https://www.prnewswire.com/apac/news-releases/csop-debuts-inaugural-tokenised-money-market-fund-offering-302790000.html">CSOP and OSL</Source>{" "}
            · <Source href="https://stablecoininsider.org/hong-kong-policy-address-stablecoin-trading/">EnsembleTX 24/7 target</Source>
          </p>
        </section>

        <section className="space-y-6">
          <SectionHead eyebrow="RAID" title="Risks, assumptions, issues and dependencies (RAID)">
            <p>Ordered worst case first: severe impact at the top, then by how likely each one is. The two severe risks are both low-likelihood and both have an automatic response — that is the point of listing them first.</p>
          </SectionHead>
          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0">
            <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-paper-200 text-[11.5px] uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Risk</th>
                  <th className="px-3 py-2.5 font-medium">Likelihood</th>
                  <th className="px-3 py-2.5 font-medium">Impact</th>
                  <th className="px-3 py-2.5 font-medium">Mitigation</th>
                  <th className="px-5 py-2.5 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={r.r} className="border-b border-paper-100 align-top last:border-0">
                    <td className="px-5 py-3 font-medium text-charcoal-900">{r.r}</td>
                    <td className="px-3 py-3 text-ink-700">{r.l}</td>
                    <td className={cn("px-3 py-3 font-medium", r.i === "Severe" ? "text-rose-600" : r.i === "High" ? "text-amber-500" : "text-ink-700")}>{r.i}</td>
                    <td className="px-3 py-3 leading-relaxed text-ink-700">{r.m}</td>
                    <td className="px-5 py-3 text-ink-700">{r.o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">Assumptions</p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-700">
                <li>HSBC&apos;s licence covers these uses, subject to HKMA engagement per use case</li>
                <li>The retail issuer platform can serve institutional wallets</li>
                <li>One friendly corporate treasury is available for the parallel run</li>
                <li>CSOP is willing to add a second settlement money</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">Issues</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-700">None open — this is pre-project. The first issue log opens at R0 kick-off.</p>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">Dependencies</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-700">Tracked in the critical-path table above, with owner and the release that needs each one.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <p className="text-[14px] font-semibold text-charcoal-900">How success is measured</p>
            <table className="mt-3 w-full min-w-[480px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-paper-200 text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-3 font-medium">Measure</th>
                  <th className="py-2 pr-3 font-medium">Target</th>
                  <th className="py-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {measures.map((m) => (
                  <tr key={m.m} className="border-b border-paper-100 last:border-0">
                    <td className="py-2 pr-3 text-charcoal-900">{m.m}</td>
                    <td className="py-2 pr-3 font-medium text-charcoal-900">{m.t}</td>
                    <td className="py-2 text-ink-500">{m.k}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <p className="text-[14px] font-semibold text-charcoal-900">Team shape and governance (indicative)</p>
            <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-ink-700">
              <p>
                <strong className="font-semibold text-charcoal-900">Platform team</strong> — tech lead, three engineers, QA, site
                reliability. Owns issuing, redeeming, the approved-wallet list and reserve checks for every use of the stablecoin.
              </p>
              <p>
                <strong className="font-semibold text-charcoal-900">Fund settlement squad</strong> — product owner, business analyst, three
                engineers, QA, a Securities Services specialist; financial-crime compliance part-time.
              </p>
              <p>
                <strong className="font-semibold text-charcoal-900">Cadence</strong> — fortnightly demo of working software; monthly
                steering; design authority for any change to keys or issuance; risk forum before each go-live.
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-paper-200 bg-paper-50 px-5 py-4">
          <p className="text-[13px] leading-relaxed text-ink-700">
            <span className="font-semibold text-charcoal-900">Below: the working detail.</span> Responsibilities, non-functional
            requirements, definition of done and operational readiness — the artefacts a squad builds from, rather than the ones you
            talk through in a review.
          </p>
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Minimum end-to-end pilot first", "One issuance, one fund purchase and one redemption working end to end in the sandbox before any feature is widened. Engineers call this a walking skeleton."],
            ["Every release ends in a transaction", "Not a UAT sign-off — a real, measurable first: first subscription, first redemption."],
            ["Build the issuer once", "The fund settlement service and the PayMe retail track share issuing, redeeming, the approved-wallet list and reserve checks."],
            ["Controls are features", "Approved-wallet list, reconciliation and the kill switch ship in the MVP, not a later hardening phase."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-paper-200 bg-paper-0 p-4">
              <p className="text-[14px] font-semibold text-charcoal-900">{t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{b}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <SectionHead eyebrow="Who does what" title="RACI across the teams involved">
            <p>A responsibility map (RACI): R does the work, A is accountable for it, C is consulted, I is kept informed. Illustrative team names, not HSBC&apos;s org chart.</p>
          </SectionHead>
          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0">
            <table className="w-full min-w-[980px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-paper-200 text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Activity</th>
                  {raciRoles.map((r) => (
                    <th key={r} className="px-2 py-2.5 text-center font-medium">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {raci.map(([act, cells]) => (
                  <tr key={act} className="border-b border-paper-100 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-charcoal-900">{act}</td>
                    {cells.map((c, i) => (
                      <td key={i} className="px-2 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-[12px] font-semibold",
                            c === "A" && "bg-charcoal-900 text-paper-0",
                            c === "R" && "bg-brand-500 text-paper-0",
                            c === "C" && "bg-paper-100 text-ink-700",
                            c === "I" && "text-ink-400"
                          )}
                        >
                          {c}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <p className="text-[14px] font-semibold text-charcoal-900">Non-functional requirements</p>
            <dl className="mt-3 divide-y divide-paper-100 text-[13px]">
              {nfrs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-2">
                  <dt className="font-medium text-charcoal-900">{k}</dt>
                  <dd className="leading-relaxed text-ink-700">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">Definition of done</p>
              <ul className="mt-2.5 space-y-1.5 text-[13px] text-ink-700">
                {dod.map((d) => (
                  <li key={d} className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="flex items-center gap-1.5 text-[14px] font-semibold text-charcoal-900">
                <ShieldAlert size={15} className="text-brand-500" /> Operational readiness before any go-live
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[13px] text-ink-700">
                {readiness.map((d) => (
                  <li key={d} className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
