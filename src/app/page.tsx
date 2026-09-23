import Link from "next/link";
import { ArrowDown, ArrowRight, TriangleAlert } from "lucide-react";
import { FundRailDemo } from "@/components/demo/FundRailDemo";
import { Footer, SectionHead, Source } from "@/components/ui";
import { cn } from "@/lib/utils";

const SRC = {
  hsbcLicence: "https://www.about.hsbc.com.hk/news-and-media/hsbc-welcomes-hkmas-grant-of-a-hong-kong-stablecoin-issuer-licence",
  scLicence: "https://www.sc.com/en/press-release/standard-chartered-backed-anchorpoint-granted-stablecoin-issuer-licence-by-the-hong-kong-monetary-authority/",
  fintechFutures: "https://www.fintechfutures.com/blockchain-crypto-digital-assets/hkma-grants-first-hong-kong-stablecoin-licences-to-standard-chartered-jv-and-hsbc",
  ensemble: "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2025/11/20251113-3/",
  hsbcEnsemble: "https://www.about.hsbc.com.hk/news-and-media/hsbc-completes-first-live-cross-bank-transaction-in-ensembletx",
  csop: "https://www.prnewswire.com/apac/news-releases/csop-debuts-inaugural-tokenised-money-market-fund-offering-302790000.html",
  hkdapLaunch: "https://www.coindesk.com/business/2026/08/12/standard-chartered-led-anchorpoint-launches-hong-kong-dollar-stablecoin",
  scDistributor: "https://www.sc.com/en/press-release/standard-chartered-becomes-first-bank-distributor-of-hkdap-to-unlock-real-economy-benefits-of-hkd-stablecoins/",
  blackrock: "https://www.tokenizationinsight.com/post/blackrock-to-launch-tokenized-hkd-money-market-fund-with-standard-chartered",
  blackrockAam: "https://www.asiaasset.com/digital-assets/blackrock-gets-nod-to-launch-tokenised-money-market-fund-in-hong-kong/",
  paymentAsia: "https://www.prnewswire.com/apac/news-releases/payment-asia-osl-and-anchorpoint-implement-enterprise-payment-applications-for-regulated-hkd-stablecoin-hkdap-302877350.html",
  policy: "https://stablecoininsider.org/hong-kong-policy-address-stablecoin-trading/",
  chinaamc: "https://www.kucoin.com/news/flash/osl-completes-hong-kong-s-first-hkd-stablecoin-investment-use-case-with-china-amc-hk-and-standard-chartered",
  chinaamcFund: "https://fintechnews.hk/32688/blockchain/chinaamc-hkd-tokenised-fund/",
  tds: "https://www.about.hsbc.com.hk/news-and-media/hsbc-launches-tokenised-deposit-service-for-corporate-cash-management-in-hong-kong",
  noInterest: "https://www.morganlewis.com/pubs/2025/06/hong-kongs-stablecoins-ordinance-to-take-effect-august-1-an-overview-of-the-regulatory-framework",
  chinaamcTd: "https://www.bochk.com/dam/bochk/desktop/top/aboutus/pressrelease2/2025/251113068_Press_Release_EN.pdf",
  chinaamcTdPr: "https://www.chinaamc.com.hk/chinaamc-hk-pioneers-real-world-tokenized-fund-subscription-with-partners-under-hkmas-ensembletx/",
  chats: "https://www.hkicl.com.hk/eng/our_services/clearing_system_in_hong_kong/real_time_gross_settlement_system/hkd_clearing_system_in_hong_kong.php",
};

const timeline = [
  {
    date: "13 Nov 2025",
    who: "HKMA · HSBC",
    what: "EnsembleTX pilot launches for real-value tokenised deposit and tokenised asset transactions, first focus tokenised money-market funds. HSBC completes one of the first live cross-bank tokenised deposit transfers (HK$3.8m, for Ant International).",
    src: [SRC.ensemble, SRC.hsbcEnsemble],
  },
  {
    date: "13 Nov 2025",
    who: "Futu · BOCHK · SC · ChinaAMC",
    what: "First real-value tokenised-deposit fund subscription: Futu moved tokenised deposits from BOCHK to Standard Chartered to subscribe to ChinaAMC's tokenised money-market fund, settled through EnsembleTX.",
    src: [SRC.chinaamcTd, SRC.chinaamcTdPr],
  },
  {
    date: "10 Apr 2026",
    who: "HKMA",
    what: "First two stablecoin issuer licences under the Stablecoins Ordinance — HSBC, and Anchorpoint (Standard Chartered, HKT and Animoca Brands). 36 applicants.",
    src: [SRC.hsbcLicence, SRC.fintechFutures],
    hsbc: true,
  },
  {
    date: "3 Jun 2026",
    who: "CSOP · HSBC · OSL",
    what: "CSOP launches a tokenised unlisted class of its HKD Money Market ETF. HSBC is tokenisation agent, trustee and registrar; OSL onboards the class exclusively for six months.",
    src: [SRC.csop],
    hsbc: true,
  },
  {
    date: "12 Aug 2026",
    who: "Anchorpoint",
    what: "HKDAP opens in beta for institutions, corporates and professional investors only. HashKey and OSL are the first distributors; retail planned for late 2026.",
    src: [SRC.hkdapLaunch],
  },
  {
    date: "24 Aug 2026",
    who: "Standard Chartered",
    what: "Becomes the first bank distributor of HKDAP: issuing and redeeming for institutional clients, custody, intragroup treasury settlement, cross-border payments, trade settlement, and tokenised MMF subscriptions from Q4.",
    src: [SRC.scDistributor],
  },
  {
    date: "10 Sep 2026",
    who: "BlackRock",
    what: "HKD Digital Liquidity Fund authorised — BlackRock's first tokenised fund in Asia-Pacific. Deals in fiat, tokenised deposits and licensed stablecoins, with HKDAP named. Standard Chartered is trustee, custodian and fund administrator.",
    src: [SRC.blackrock, SRC.blackrockAam],
  },
  {
    date: "14 Sep 2026",
    who: "Payment Asia · OSL · Anchorpoint",
    what: "First enterprise HKDAP payments: logistics fees and business-travel bookings settled per transaction instead of monthly, each linked to its commercial documents, reconciled the same day, then redeemed and removed from circulation.",
    src: [SRC.paymentAsia],
  },
  {
    date: "16 Sep 2026",
    who: "HKSAR Policy Address",
    what: "Licensed stablecoins to trade on licensed virtual-asset platforms and settle tokenised MMFs. EnsembleTX targeted for 24/7 operation and CBDC settlement by end-2026; digital currencies to be explored across the government bond lifecycle.",
    src: [SRC.policy],
  },
  {
    date: "18 Sep 2026",
    who: "OSL · ChinaAMC · Standard Chartered",
    what: "First investment use of HKDAP: subscriptions and redemptions in a ChinaAMC tokenised HKD money-market fund through OSL, with Standard Chartered as custodian and tokenisation agent.",
    src: [SRC.chinaamc, SRC.chinaamcFund],
  },
];

export default function Page() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-charcoal-800 bg-charcoal-950">
        <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-400">Concept demo · Licensed HKD stablecoin</p>
          <h1 className="mt-3 max-w-4xl text-[30px] font-semibold leading-tight tracking-tight text-paper-0 sm:text-[38px] [text-wrap:balance]">
            Beyond PayMe: a tokenised fund settlement service for HSBC&apos;s HKD stablecoin
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-paper-200">
            HSBC&apos;s stablecoin is heading for PayMe. This site is the other half: the same licence settling corporate fund trades.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a href="#package-a" className="group rounded-xl border border-charcoal-700 bg-charcoal-900 p-4 hover:border-brand-500">
              <p className="text-[12px] font-semibold text-brand-400">The demo · Tokenised fund settlement service</p>
              <p className="mt-1 text-[15px] font-semibold text-paper-0">Issue stablecoin → buy tokenised fund units → sell them back → remove the stablecoin from circulation</p>
              <p className="mt-1 flex items-center gap-1 text-[12.5px] text-ink-400 group-hover:text-paper-200">
                Measurable: first live subscribe and redeem in the HSBC HKD stablecoin <ArrowDown size={12} />
              </p>
            </a>
            <Link href="/delivery/" className="group rounded-xl border border-charcoal-700 bg-charcoal-900 p-4 hover:border-brand-500">
              <p className="text-[12px] font-semibold text-brand-400">Delivery plan and user stories</p>
              <p className="mt-1 text-[15px] font-semibold text-paper-0">From demo to first live transaction — releases, RACI, RAID, epics and stories</p>
              <p className="mt-1 flex items-center gap-1 text-[12.5px] text-ink-400 group-hover:text-paper-200">
                For delivery and product <ArrowRight size={12} />
              </p>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-16 px-5 py-10 sm:px-8">
        {/* MARKET */}
        <section id="market" className="scroll-mt-16 space-y-6">
          <SectionHead eyebrow="Context · what has happened" title="Hong Kong's licensed stablecoin market, as of 22 September 2026">
            <p>
              The licence was never the hard part. A regulated stablecoin with nothing to buy and nobody to pay is a compliance exercise,
              not money. Since August, the Standard Chartered camp has been filling that gap one use case at a time — and the
              Policy Address has just endorsed the direction.
            </p>
          </SectionHead>

          <div className="overflow-hidden rounded-2xl border border-paper-200 bg-paper-0">
            <ol className="divide-y divide-paper-100">
              {timeline.map((t) => (
                <li key={t.date + t.who} className={cn("grid gap-2 px-5 py-3.5 sm:grid-cols-[120px_200px_1fr]", t.hsbc && "bg-brand-50")}>
                  <span className="font-mono text-[12px] tabular-nums text-ink-500">{t.date}</span>
                  <span className="text-[13px] font-semibold text-charcoal-900">{t.who}</span>
                  <span className="text-[13px] leading-relaxed text-ink-700">
                    {t.what}{" "}
                    {t.src.map((s, i) => (
                      <span key={s} className="mr-1.5">
                        <Source href={s}>{`source${t.src.length > 1 ? ` ${i + 1}` : ""}`}</Source>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">HSBC&apos;s announced plan — the retail track</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                HSBC&apos;s HKD stablecoin is due in the second half of 2026, inside PayMe (3.3 million users) and the HSBC HK app: person-to-person
                payments, paying merchants, and subscribing to tokenised investments in the app. Reserves held in segregated accounts.{" "}
                <Source href={SRC.hsbcLicence}>HSBC</Source>
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                That track is already planned. This site is about the other one: what the same licence does for corporates and
                institutions — the question of what the stablecoin is for beyond everyday payments.
              </p>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">What HSBC already runs that the stablecoin can plug into</p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li><strong className="font-semibold text-charcoal-900">Tokenised Deposit Service</strong> — 24/7 HKD and USD corporate payments with programmable transfers. <Source href={SRC.tds}>HSBC</Source></li>
                <li><strong className="font-semibold text-charcoal-900">EnsembleTX participant</strong> — among the first live cross-bank tokenised deposit transfers. <Source href={SRC.hsbcEnsemble}>HSBC</Source></li>
                <li><strong className="font-semibold text-charcoal-900">Fund tokenisation roles</strong> — tokenisation agent, trustee and registrar for CSOP&apos;s tokenised HKD money-market class. <Source href={SRC.csop}>CSOP</Source></li>
                <li><strong className="font-semibold text-charcoal-900">A licensed issuer</strong> — which Standard Chartered reached through a joint venture; HSBC holds it directly. <Source href={SRC.hsbcLicence}>HSBC</Source></li>
              </ul>
            </div>
          </div>
        </section>

        {/* THE DEMO */}
        <section id="package-a" className="scroll-mt-16 space-y-6">
          <SectionHead eyebrow="The demo · Tokenised fund settlement service" title="A treasurer invests idle HKD in a tokenised money-market fund — and the stablecoin does the settling">
            <p>
              The same loop crypto markets run every day with USDC and tokenised Treasury funds — issue, buy, sell, remove from circulation — but
              with every party named, a licensed issuer, and delivery-versus-payment done by the transfer agent or EnsembleTX. The
              treasurer pays from an HKD account and never handles a stablecoin; HSBC issues it, settles with it, then removes it from circulation. It is the
              use the Policy Address has just endorsed, and the one both ChinaAMC and BlackRock have built for.
            </p>
          </SectionHead>

          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <p className="text-[14px] font-semibold text-charcoal-900">Which funds first — a pipeline, not a catalogue</p>
            <table className="mt-3 w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-paper-200 text-[11.5px] uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4 font-medium">Fund</th>
                  <th className="py-2 pr-4 font-medium">Why</th>
                  <th className="py-2 font-medium">What it takes</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                <tr className="border-b border-paper-100 align-top">
                  <td className="py-3 pr-4 font-semibold text-charcoal-900">1 · CSOP HKD Money Market ETF, tokenised class</td>
                  <td className="py-3 pr-4 leading-relaxed text-ink-700">HSBC already runs the register, trusteeship and tokenisation — the easiest first live transaction. <Source href={SRC.csop}>CSOP</Source></td>
                  <td className="py-3 leading-relaxed text-ink-700">Add the HSBC HKD stablecoin as an accepted settlement money; mind OSL&apos;s six-month exclusive onboarding from June.</td>
                </tr>
                <tr className="border-b border-paper-100 align-top">
                  <td className="py-3 pr-4 font-semibold text-charcoal-900">2 · BlackRock HKD Digital Liquidity Fund</td>
                  <td className="py-3 pr-4 leading-relaxed text-ink-700">Built to deal in licensed stablecoins and tokenised deposits; the strongest ecosystem signal. <Source href={SRC.blackrock}>source</Source></td>
                  <td className="py-3 leading-relaxed text-ink-700">BlackRock and its trustee (Standard Chartered) enable a second licensed stablecoin. In the demo, HSBC is onboarded as a distributor too — the same fund, two licensed coins. Launch date not yet announced.</td>
                </tr>
                <tr className="align-top">
                  <td className="py-3 pr-4 font-semibold text-charcoal-900">3 · ChinaAMC HKD Digital Money Market Fund</td>
                  <td className="py-3 pr-4 leading-relaxed text-ink-700">Hong Kong&apos;s first retail tokenised fund; already dealing in HKDAP. <Source href={SRC.chinaamcFund}>source</Source></td>
                  <td className="py-3 leading-relaxed text-ink-700">Proves the HSBC HKD stablecoin works in a fund HSBC does not service — the interoperability test. This fund has already been subscribed with cross-bank tokenised deposits (Nov 2025) and with HKDAP (Sep 2026), so the coin would be its third settlement money.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <FundRailDemo />

          <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <p className="text-[14px] font-semibold text-charcoal-900">The client simply invests HKD — HSBC picks how it settles</p>
            <p className="mt-1 text-[13px] text-ink-500">
              The client simply invests HKD. HSBC selects the safest eligible settlement method in the background: the stablecoin
              where reach between banks is needed, or tokenised deposits where they are simpler. Try the &ldquo;Stablecoin not
              accepted&rdquo; scenario, or the controls on the bank side.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-paper-200 text-[11.5px] uppercase tracking-wide text-ink-400">
                    <th className="py-2 pr-4 font-medium">If…</th>
                    <th className="py-2 pr-4 font-medium">The router uses</th>
                    <th className="py-2 font-medium">Why</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  <tr className="border-b border-paper-100 align-top">
                    <td className="py-3 pr-4 font-semibold text-charcoal-900">The fund has enabled the HSBC HKD stablecoin</td>
                    <td className="py-3 pr-4 font-semibold text-brand-600">HSBC HKD stablecoin</td>
                    <td className="py-3 leading-relaxed text-ink-700">
                      One settlement money for every investor, HSBC client or not. It lands in the fund&apos;s wallet at any bank, at any hour,
                      with no interbank step — and funds such as BlackRock&apos;s are built to accept licensed stablecoins.
                    </td>
                  </tr>
                  <tr className="border-b border-paper-100 align-top">
                    <td className="py-3 pr-4 font-semibold text-charcoal-900">Not yet, but the fund&apos;s cash is at HSBC (the CSOP class)</td>
                    <td className="py-3 pr-4 text-charcoal-900">HSBC tokenised deposits, internally</td>
                    <td className="py-3 leading-relaxed text-ink-700">Stays inside HSBC, 24/7, with no stablecoin issued and no reserve movement. <Source href={SRC.tds}>HSBC</Source></td>
                  </tr>
                  <tr className="border-b border-paper-100 align-top">
                    <td className="py-3 pr-4 font-semibold text-charcoal-900">Not yet, the fund banks elsewhere, interbank window open</td>
                    <td className="py-3 pr-4 text-charcoal-900">Cross-bank tokenised deposits via EnsembleTX</td>
                    <td className="py-3 leading-relaxed text-ink-700">Works between participating banks, with interbank settlement through RTGS during the pilot — business hours today, 24/7 targeted by end-2026. <Source href={SRC.ensemble}>HKMA</Source></td>
                  </tr>
                  <tr className="align-top">
                    <td className="py-3 pr-4 font-semibold text-charcoal-900">Not yet, fund elsewhere, window closed</td>
                    <td className="py-3 pr-4 text-charcoal-900">Queue for the next payment window</td>
                    <td className="py-3 leading-relaxed text-ink-700">Nothing debited meanwhile. This is the gap the stablecoin closes — the case for every fund accepting it.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">Why a treasurer would use it</p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li>Licensed issuers may not pay holders interest. <Source href={SRC.noInterest}>Morgan Lewis</Source> The money-market fund is where an idle balance earns — so a coin with a tokenised fund settlement service is worth more than one without.</li>
                <li>Cash and units move together, so there is no moment where the money has gone and the units have not arrived.</li>
                <li>One flow from the HKD account to units and back, with the stablecoin existing only as long as it is needed.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">What is new versus HKDAP</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                No exchange account in the middle for primary dealing: the issuer, the register and settlement are all HSBC roles that
                already exist. The treasurer pays from an HKD account and never handles the stablecoin directly — and where a fund does not accept it
                yet, HSBC falls back to tokenised deposits behind the scenes, which HKDAP cannot do.
              </p>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="flex items-center gap-1.5 text-[14px] font-semibold text-charcoal-900">
                <TriangleAlert size={15} className="text-amber-500" />
                The hard parts
              </p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li><strong className="font-semibold text-charcoal-900">The fund decides what it will accept.</strong> Each manager and trustee must approve the HSBC stablecoin for settlement.</li>
                <li><strong className="font-semibold text-charcoal-900">The stablecoin does not change dealing hours.</strong> Cut-offs and pricing are the fund&apos;s rules.</li>
                <li><strong className="font-semibold text-charcoal-900">Reserve and supply must reconcile continuously</strong> — stablecoins in circulation always equals reserve held.</li>
                <li><strong className="font-semibold text-charcoal-900">Wallet onboarding</strong> for investors on the issuer&apos;s approved-wallet list and the fund&apos;s register.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* COIN VS TDS */}
        <section id="coin-or-deposit" className="scroll-mt-16 space-y-6">
          <SectionHead eyebrow="Two settlement options, one client experience" title="Stablecoin or tokenised deposit — when to pick which, and which backs the other up">
            <p>
              Both already work for buying a tokenised fund. Tokenised deposits did it first: in November 2025 Futu moved deposits
              from BOCHK to Standard Chartered to subscribe to ChinaAMC&apos;s fund through EnsembleTX.{" "}
              <Source href={SRC.chinaamcTd}>BOCHK</Source> HKDAP did the same job with a licensed stablecoin ten months later.{" "}
              <Source href={SRC.chinaamc}>OSL</Source> The question is no longer whether either works — it is which one a bank should
              reach for, and what happens when the first choice is unavailable.
            </p>
          </SectionHead>

          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-paper-200 text-[11.5px] uppercase tracking-wide text-ink-400">
                  <th className="w-44 py-2 pr-4 font-medium" />
                  <th className="py-2 pr-4 font-medium text-brand-600">HSBC HKD stablecoin</th>
                  <th className="py-2 font-medium">HSBC tokenised deposits</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {[
                  ["What it is", "A regulated digital HKD, held only in approved, identified wallets and backed 1:1 by a segregated reserve.", "A deposit at HSBC, in token form. A claim on the bank, on the bank's balance sheet."],
                  ["Who can hold it", "Anyone identified and approved-wallet listed — including firms that don't bank with HSBC.", "HSBC clients only. Cross-bank movement needs EnsembleTX between participating banks."],
                  ["Hours", "Any hour, including weekends, within HSBC's own settlement network.", "24/7 inside HSBC; cross-bank legs settle through RTGS during the Ensemble pilot, so business hours."],
                  ["Interest", "None — licensed issuers may not pay holders interest.", "It is a deposit, so it can earn interest."],
                  ["Cost to the bank", "Issuing and redeeming, reserve management, attestation and reporting as a licensee.", "No new issuance machinery; uses the deposit ledger."],
                  ["Where the money sits", "Reserve assets stay with HSBC even after the stablecoin leaves.", "The deposit leaves HSBC when it moves to another bank."],
                  ["Best for", "Paying funds or counterparties that are not HSBC clients, out of hours, or where the money moves on again.", "Both sides inside HSBC, or a cross-bank deposit leg in business hours where the counterparty prefers bank money."],
                ].map(([k, coin, tds]) => (
                  <tr key={k} className="border-b border-paper-100 align-top last:border-0">
                    <td className="py-3 pr-4 font-semibold text-charcoal-900">{k}</td>
                    <td className="bg-brand-50/60 px-3 py-3 leading-relaxed text-charcoal-900">{coin}</td>
                    <td className="py-3 leading-relaxed text-ink-700">{tds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">If the stablecoin is unavailable, tokenised deposits take over</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                HSBC treats the stablecoin as the first choice and tokenised deposits as the standby. Three things can take the stablecoin
                out of play, and the client&apos;s order still settles in all of them:
              </p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li><strong className="font-semibold text-charcoal-900">The fund hasn&apos;t enabled it</strong> — settle internally in deposits, or cross-bank through EnsembleTX.</li>
                <li><strong className="font-semibold text-charcoal-900">Issuance is paused</strong> — a reserve break or an incident stops issuance. New orders route to deposits; coin already in escrow still settles or unwinds. Redemptions of existing coin keep working, so holders can always get cash back.</li>
                <li><strong className="font-semibold text-charcoal-900">Neither rail is open</strong> — the order queues for the next CHATS window and nothing is debited meanwhile.</li>
              </ul>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-500">
                Try it: the <strong className="font-semibold text-ink-700">Stablecoin paused · deposits instead</strong> scenario, or the
                issuance switch on the bank side.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">Why two settlement options is the point</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                A single settlement option is a single point of failure, and a bank that only has the stablecoin has to tell clients to wait. Running
                deposits as the standby means an stablecoin-issuer operational incident degrades the service instead of stopping it — and the client never
                has to know which rail carried their money.
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                It also answers the internal objection. The stablecoin does not replace the deposit franchise; it reaches the clients and
                funds the tokenised-deposit option cannot, and hands the flow back when it can.
              </p>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="flex items-center gap-1.5 text-[14px] font-semibold text-charcoal-900">
                <TriangleAlert size={15} className="text-amber-500" />
                The honest caveats
              </p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li><strong className="font-semibold text-charcoal-900">Shared infrastructure is not a fallback.</strong> If the stablecoin and tokenised deposits run on the same platform, one incident can take both. The standby only counts if the failure domains differ — otherwise the real fallback is conventional payment.</li>
                <li><strong className="font-semibold text-charcoal-900">The fund must accept whichever arrives.</strong> Every settlement money needs the manager and trustee to enable it, so a fallback is only real once both are enabled.</li>
                <li><strong className="font-semibold text-charcoal-900">Pausing is a decision, not a switch.</strong> Who can pause issuance, on what evidence, and what is said to clients and the HKMA, all need to be agreed in advance.</li>
              </ul>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
