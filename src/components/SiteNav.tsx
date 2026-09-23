"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Demos" },
  { href: "/delivery/", label: "Delivery plan" },
  { href: "/user-stories/", label: "User stories" },
];

export function SiteNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, "")));
  return (
    <nav className="sticky top-0 z-30 border-b border-charcoal-800 bg-charcoal-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 sm:px-8">
        <span className="flex items-center gap-2 py-3 text-[13px] font-semibold text-paper-0">
          <span className="h-3 w-3 rotate-45 bg-brand-500" aria-hidden />
          Beyond PayMe
        </span>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "border-b-2 px-3 py-3 text-[13px] font-medium transition-colors",
                active(l.href) ? "border-brand-500 text-paper-0" : "border-transparent text-ink-400 hover:text-paper-0"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
