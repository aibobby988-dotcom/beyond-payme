import { ArrowUpRight } from "lucide-react";

export function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-brand-600 underline decoration-brand-100 underline-offset-2 hover:decoration-brand-500">
      {children}
      <ArrowUpRight size={11} />
    </a>
  );
}

export function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-4xl">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-charcoal-900 [text-wrap:balance]">{title}</h2>
      {children && <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-ink-700">{children}</div>}
    </div>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="border-b border-charcoal-800 bg-charcoal-950">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-400">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-[30px] font-semibold leading-tight tracking-tight text-paper-0 sm:text-[38px] [text-wrap:balance]">{title}</h1>
        {children}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-paper-200 bg-paper-0">
      <div className="mx-auto max-w-[1400px] px-5 py-6 text-[12px] leading-relaxed text-ink-500 sm:px-8">
        Independent concept prototype for discussion. Not affiliated with or endorsed by HSBC. Clients, balances, prices, limits,
        system names, timings and team shapes are simulated or indicative; the integration map describes plausible system roles, not
        HSBC&apos;s actual internal architecture. Market facts link to public sources as of 23 September 2026; some are news
        summaries rather than primary releases.
      </div>
    </footer>
  );
}
