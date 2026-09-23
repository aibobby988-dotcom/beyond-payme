import { CheckCircle2 } from "lucide-react";
import { cn, hkd } from "@/lib/utils";

/** Live issuer check shown to the bank: stablecoins in circulation must always equal reserve held. */
export function ReserveCheck({ outstanding, moving, note }: { outstanding: number; moving: boolean; note?: string }) {
  return (
    <div className="mb-3 grid grid-cols-[1fr_1fr_auto] items-center gap-3 rounded-lg border border-charcoal-700 bg-charcoal-900 px-3 py-2.5">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Stablecoins in circulation</p>
        <p className={cn("font-mono text-[14px] font-semibold tabular-nums text-paper-0 transition-colors", moving && "text-blue-500")}>{hkd(outstanding)}</p>
      </div>
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Segregated reserve</p>
        <p className={cn("font-mono text-[14px] font-semibold tabular-nums text-paper-0 transition-colors", moving && "text-blue-500")}>{hkd(outstanding)}</p>
      </div>
      <p className="flex items-center gap-1 text-[11.5px] font-medium text-emerald-500">
        <CheckCircle2 size={14} /> 1 : 1
      </p>
      {note && <p className="col-span-3 text-[10.5px] text-ink-400">{note}</p>}
    </div>
  );
}
