"use client";

import { Bell, Check, CheckCircle2, ChevronRight, Clock, FileText, Loader2, Play, UserRound, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  ACCOUNT,
  buildGroups,
  buildScenario,
  buildSystems,
  clientStatus,
  fundBy,
  funds,
  MANDATE,
  routeInfo,
  routeReason,
  type FundKey,
  type Injected,
  type OrderSpec,
  type RailScenario,
  type RouteInputs,
  type Side,
  type Channel,
} from "@/lib/fundRail";
import { cn, hkd, units } from "@/lib/utils";
import { DemoFrame } from "./DemoFrame";
import { ReserveCheck } from "./ReserveCheck";
import { useStageRunner } from "./useStageRunner";

type Role = "maker" | "checker" | "gt";
type Tab = "invest" | "auth" | "orders" | "positions";
type PhoneMode = "idle" | "open" | "signing" | "done";

/** The four statuses a real portal shows; the step-by-step timeline sits behind "Show settlement detail". */
const COARSE = ["Approved", "Submitted", "Confirmed", "Settled"] as const;
const CONFIRMED_FROM = new Set(["price", "fundcash", "interbank", "commit", "fundout", "post", "confirm"]);
type Tone = "blue" | "green" | "amber" | "rose" | "grey";

/** Client screens say creator and approver; HSBCnet's own terms are preparer and authoriser. */
const users: Record<Role, { id: string; title: string; short: string }> = {
  maker: { id: "Alice Chan", title: "treasury dealer (creates orders)", short: "creator" },
  checker: { id: "Brian Lau", title: "treasury manager (approves up to HK$100m)", short: "approver" },
  gt: { id: "Carmen Ho", title: "Group Treasurer (approves above HK$100m)", short: "senior approver" },
};

interface Book {
  account: number;
  holdings: Record<FundKey, number>; // units
  coinOutstanding: number;
}

const START_BOOK: Book = {
  account: 200_000_000,
  holdings: { csop: 12_000_000, blackrock: 80_000_000, chinaamc: 8_000_000 },
  coinOutstanding: 1_250_000_000,
};

interface Order extends OrderSpec {
  status: "pending" | "rejected" | "live";
  needs: Role[];
  signed: Role[];
  submittedAt: string;
  committed: boolean;
  soleControl?: boolean;
  outcome?: { label: string; tone: Tone };
  positionAfter?: { fund: string; value: string; units: string; cash: string };
  history?: TimelineRow[];
  note?: string[];
}

type TimelineRow = { time: string; label: string; tone?: "fail" | "warn" };

interface Draft {
  fund: FundKey;
  side: Side;
  /** Null until the treasurer picks one — nothing is pre-filled from a Trade click. */
  amount: number | null;
  step: "edit" | "review";
}

type GroupKey = "core" | "controls" | "fallback" | "failure";

/** Scenario groups, with what each one is meant to prove. */
const GROUPS: { key: GroupKey; label: string; note: string }[] = [
  { key: "core", label: "Core journeys", note: "The everyday flow, end to end" },
  { key: "controls", label: "Controls & channels", note: "Approval limits, and orders from the client's own systems" },
  { key: "fallback", label: "When the stablecoin can't be used", note: "The order still gets done — by another route, or at the next window" },
  { key: "failure", label: "When something genuinely fails", note: "Nothing settles, and the client ends up exactly where they started" },
];

interface Journey {
  title: string;
  group: GroupKey;
  draft: Omit<Draft, "step"> & { amount: number };
  inputs: RouteInputs;
  injected: Injected;
  channel?: Channel;
}

const ON: RouteInputs = { coinEnabled: true, windowOpen: true, coinPaused: false };

/** Pre-programmed journeys: one click fills the ticket, submits, approves and runs the bank side. */
const journeys: Journey[] = [
  { group: "core", title: "Subscribe HK$50m · CSOP", draft: { fund: "csop", side: "subscribe", amount: 50_000_000 }, inputs: ON, injected: "none" },
  { group: "core", title: "Subscribe HK$50m · BlackRock", draft: { fund: "blackrock", side: "subscribe", amount: 50_000_000 }, inputs: ON, injected: "none" },
  { group: "core", title: "Subscribe HK$20m · ChinaAMC", draft: { fund: "chinaamc", side: "subscribe", amount: 20_000_000 }, inputs: ON, injected: "none" },
  { group: "core", title: "Redeem HK$20m · ChinaAMC", draft: { fund: "chinaamc", side: "redeem", amount: 20_000_000 }, inputs: ON, injected: "none" },
  { group: "controls", title: "HK$150m · two approvers", draft: { fund: "csop", side: "subscribe", amount: 150_000_000 }, inputs: ON, injected: "none" },
  { group: "controls", title: "From treasury system (API)", draft: { fund: "chinaamc", side: "subscribe", amount: 50_000_000 }, inputs: ON, injected: "none", channel: "api" },
  { group: "fallback", title: "After hours · waits for the next window", draft: { fund: "chinaamc", side: "subscribe", amount: 50_000_000 }, inputs: { coinEnabled: false, windowOpen: false, coinPaused: false }, injected: "none" },
  { group: "failure", title: "Fund rejects · auto-unwind", draft: { fund: "chinaamc", side: "subscribe", amount: 50_000_000 }, inputs: ON, injected: "register" },
  { group: "fallback", title: "Fund won't take stablecoin · deposits instead", draft: { fund: "chinaamc", side: "subscribe", amount: 50_000_000 }, inputs: { coinEnabled: false, windowOpen: true, coinPaused: false }, injected: "none" },
  { group: "fallback", title: "Stablecoin paused · deposits instead", draft: { fund: "csop", side: "subscribe", amount: 50_000_000 }, inputs: { coinEnabled: true, windowOpen: true, coinPaused: true }, injected: "none" },
];

const AMOUNTS = [10_000_000, 20_000_000, 50_000_000, 150_000_000];

function Chip({ tone, children, spin }: { tone: Tone; children: React.ReactNode; spin?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "blue" && "bg-blue-100 text-blue-600",
        tone === "green" && "bg-emerald-100 text-emerald-600",
        tone === "amber" && "bg-amber-100 text-amber-500",
        tone === "rose" && "bg-rose-100 text-rose-600",
        tone === "grey" && "bg-paper-100 text-ink-700"
      )}
    >
      {spin && <Loader2 size={10} className="animate-spin" />}
      {children}
    </span>
  );
}

function LightSeg<T extends string | boolean>({ label, value, options, onChange, disabled }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", disabled && "opacity-40")}>
      <span className="text-[12px] text-ink-700">{label}</span>
      <div className="flex rounded-md border border-paper-200 bg-paper-50 p-0.5">
        {options.map(([v, l]) => (
          <button key={String(v)} type="button" disabled={disabled} onClick={() => onChange(v)} aria-pressed={value === v} className={cn("rounded px-2 py-0.5 text-[11.5px] font-medium", value === v ? "bg-charcoal-900 text-paper-0" : "text-ink-500 hover:text-charcoal-900")}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function applyOrder(b: Book, s: RailScenario): Book {
  const o = s.order;
  const coin = s.route === "coin";
  const h = { ...b.holdings };
  if (o.side === "subscribe") {
    h[o.fund] += s.u;
    return { account: b.account - o.amount, holdings: h, coinOutstanding: b.coinOutstanding + (coin ? o.amount : 0) };
  }
  h[o.fund] -= s.u;
  return { account: b.account + o.amount, holdings: h, coinOutstanding: b.coinOutstanding - (coin ? o.amount : 0) };
}

export function FundRailDemo() {
  const runner = useStageRunner();
  const { scenario, statuses, reversalStatuses, phase, clock, log } = runner;

  const [book, setBook] = useState<Book>(START_BOOK);
  const [orders, setOrders] = useState<Order[]>([]);
  const [seq, setSeq] = useState(1);
  const [role, setRole] = useState<Role>("maker");
  const [tab, setTab] = useState<Tab>("invest");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [inputs, setInputs] = useState<RouteInputs>(ON);
  const [injected, setInjected] = useState<Injected>("none");
  const [notice, setNotice] = useState("Tokenised HKD money-market funds now settle in HSBC HKD stablecoin.");
  const [sole, setSole] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [phone, setPhone] = useState<{ mode: PhoneMode; ref?: string; as?: Role }>({ mode: "idle" });
  const [detail, setDetail] = useState(false);
  const playToken = useRef(0);

  const sc = scenario as RailScenario | null;
  const busyRun = phase === "running" || phase === "held";
  const scOrder = sc ? orders.find((o) => o.ref === sc.order.ref) : undefined;
  const active = orders.find((o) => o.status === "pending") ?? (busyRun ? scOrder : undefined);
  const done = (id: string) => sc !== null && statuses[sc.stages.findIndex((s) => s.id === id)] === "done";
  const reversed = (i: number) => reversalStatuses[i] === "reversed";

  // In-flight effects of the running order, layered over the settled book.
  let reserved = 0;
  let coinDelta = 0;
  let bookView = book;
  if (sc && scOrder && !scOrder.committed) {
    const o = sc.order;
    const coin = sc.route === "coin";
    const unwound = sc.failAt === "accept" && reversed(1);
    if (o.side === "subscribe") {
      if (done("fundin") && !done("commit") && !unwound) reserved = o.amount;
      if (coin && done("fundin") && !unwound) coinDelta = o.amount;
    } else if (coin && done("fundout")) coinDelta = -o.amount;
    if (phase === "completed") {
      reserved = 0;
      coinDelta = 0;
      bookView = applyOrder(book, sc);
    }
  }
  const available = bookView.account - reserved;

  /** Fold a finished run into the book before anything new starts. */
  const settleFinished = () => {
    if (!sc || !scOrder || scOrder.committed) return;
    if (phase === "completed") setBook((b) => applyOrder(b, sc));
    const outcome: { label: string; tone: Tone } =
      phase === "completed" ? { label: "Settled", tone: "green" } : sc.queued ? { label: "Queued · next CHATS window", tone: "amber" } : { label: "Not completed · funds released", tone: "rose" };
    const fd = fundBy(scOrder.fund);
    const settledBook = phase === "completed" ? applyOrder(book, sc) : book;
    const positionAfter =
      phase === "completed"
        ? { fund: fd.short, value: hkd(settledBook.holdings[scOrder.fund] * fd.nav), units: units(settledBook.holdings[scOrder.fund]), cash: hkd(settledBook.account) }
        : undefined;
    const history = timeline(scOrder);
    const note = phase === "completed" ? contractNote(scOrder) : undefined;
    setOrders((os) => os.map((x) => (x.ref === scOrder.ref ? { ...x, committed: true, outcome, history, note, positionAfter } : x)));
  };

  /** Index into COARSE, or a terminal state. */
  const coarse = (o: Order): { step: number; label: string; tone: Tone; spin?: boolean } => {
    if (o.status === "rejected") return { step: 0, label: "Rejected", tone: "rose" };
    if (o.status === "pending") return { step: 0, label: `Pending approval${o.needs.length > 1 ? ` ${o.signed.length}/${o.needs.length}` : ""}`, tone: "amber" };
    if (o.outcome) return { step: o.outcome.tone === "green" ? 3 : 1, ...o.outcome };
    if (sc?.order.ref !== o.ref) return { step: 1, label: "Submitted", tone: "blue" };
    if (phase === "completed") return { step: 3, label: "Settled", tone: "green" };
    if (phase === "failed") return sc.queued ? { step: 1, label: "Queued · next CHATS window", tone: "amber" } : { step: 1, label: "Not completed · funds released", tone: "rose" };
    const st = sc.stages[runner.current];
    const confirmed = st && CONFIRMED_FROM.has(st.id);
    return { step: confirmed ? 2 : 1, label: confirmed ? "Confirmed" : "Submitted", tone: "blue", spin: !runner.paused };
  };

  const contractNote = (o: Order): string[] => {
    const fd = fundBy(o.fund);
    return [
      `Fund          ${fd.name}`,
      `Order         ${o.side === "subscribe" ? "Subscription" : "Redemption"} · ${hkd(o.amount)}`,
      `Units         ${units(o.amount / fd.nav)} @ NAV HK$${fd.nav.toFixed(4)}`,
      `Account       ${ACCOUNT}`,
      `Settlement    ${sc ? routeInfo[sc.route].asset : ""} · DvP`,
      "Distributor   HSBC",
      `Settled       ${sc ? `${sc.clockStart.label} ${clock}` : ""} HKT`,
    ];
  };

  const timeline = (o: Order): TimelineRow[] => {
    if (o.history) return o.history;
    const rows: TimelineRow[] =
      o.channel === "api"
        ? [{ time: o.submittedAt, label: "Received from Party A's treasury system (API) — approved there" }]
        : [{ time: o.submittedAt, label: `Created by ${users.maker.id}${o.soleControl ? " and approved by the same person (single-person approval)" : ""}` }];
    o.signed.forEach((r) => rows.push({ time: o.submittedAt, label: `Approved by ${users[r].id} (${users[r].short})` }));
    if (o.status === "rejected") rows.push({ time: o.submittedAt, label: "Rejected by approver — nothing was reserved", tone: "fail" });
    if (sc?.order.ref === o.ref) {
      let last = "";
      log.forEach((l) => {
        if (l.tone === "fail") {
          rows.push({ time: l.time, label: sc.queued ? "Queued for the next CHATS window — nothing debited" : "The fund could not accept the order", tone: sc.queued ? "warn" : "fail" });
          return;
        }
        if (l.tone === "warn") {
          if (!sc.queued && (l.text.startsWith("Stablecoin redeemed and removed from circulation; hold released") || l.text.startsWith("Hold released"))) rows.push({ time: l.time, label: `Hold released — ${hkd(o.amount)} back in ${ACCOUNT}` });
          return;
        }
        const stage = sc.stages.find((s) => l.text.startsWith(s.label));
        const label = stage ? clientStatus[stage.id] : undefined;
        if (label && label !== last) {
          rows.push({ time: l.time, label });
          last = label;
        }
      });
      const cur = sc.stages[runner.current];
      const curLabel = cur && clientStatus[cur.id];
      if (busyRun && curLabel && curLabel !== last) rows.push({ time: clock, label: `${curLabel}…` });
    }
    return rows;
  };

  // ---- actions ---------------------------------------------------------------

  /** Who must still approve, per Party A's approval rules. */
  const requiredSigners = (amount: number, soleOn: boolean): Role[] => {
    if (soleOn) return amount > MANDATE ? ["gt"] : [];
    return amount > MANDATE ? ["checker", "gt"] : ["checker"];
  };

  const newRef = () => {
    const ref = `FND-2609-${String(seq).padStart(4, "0")}`;
    setSeq((n) => n + 1);
    return ref;
  };

  const run = (o: Order, approvers: string[], inp: RouteInputs, inj: Injected) => {
    runner.start(buildScenario({ ref: o.ref, fund: o.fund, side: o.side, amount: o.amount, approvers, channel: o.channel }, inp, inj));
  };

  /** Create the order from a ticket; returns it so an autoplay can keep driving it. */
  const place = (d: Omit<Draft, "step"> & { amount: number }, channel: Channel, soleOn: boolean, inp: RouteInputs, inj: Injected, fresh?: string): Order => {
    if (!fresh) settleFinished();
    runner.reset();
    const ref = fresh ?? newRef();
    const needs = channel === "api" ? [] : requiredSigners(d.amount, soleOn);
    const approvers = channel === "api" ? ["Alice Chan and Brian Lau, in Party A's treasury system"] : [users.maker.id];
    const o: Order = { ref, fund: d.fund, side: d.side, amount: d.amount, channel, approvers, status: needs.length ? "pending" : "live", needs, signed: [], submittedAt: "10:31:05", committed: false, soleControl: channel === "portal" && soleOn };
    setOrders((os) => [o, ...os]);
    setDraft(null);
    setTab("orders");
    setOpenRef(ref);
    if (!needs.length) {
      run(o, approvers, inp, inj);
      setNotice(channel === "api" ? `${ref} received from your treasury system — processing.` : `${ref} created and approved by the same person — processing.`);
    } else {
      setNotice(`${ref} submitted — waiting for ${needs.map((r) => users[r].short).join(" and ")}.`);
    }
    return o;
  };

  /** Sign as a role; starts processing once every required signature is in. */
  const authorise = (o: Order, as: Role, inp: RouteInputs, inj: Injected): Order => {
    const signed = [...o.signed, as];
    const complete = o.needs.every((r) => signed.includes(r));
    const approvers = [users.maker.id, ...signed.map((r) => users[r].id)];
    const next: Order = { ...o, signed, approvers, status: complete ? "live" : "pending" };
    setOrders((os) => os.map((x) => (x.ref === o.ref ? next : x)));
    if (complete) {
      run(next, approvers, inp, inj);
      setNotice(`${o.ref} fully approved — processing.`);
    } else {
      setNotice(`${o.ref} approved by ${users[as].id} — waiting for ${o.needs.filter((r) => !signed.includes(r)).map((r) => users[r].short).join(" and ")}.`);
    }
    return next;
  };

  const submit = () => {
    if (draft && draft.amount !== null) place({ ...draft, amount: draft.amount }, "portal", sole, inputs, injected);
  };
  const approve = (o: Order) => authorise(o, role, inputs, injected);

  const reject = (o: Order) => {
    setOrders((os) => os.map((x) => (x.ref === o.ref ? { ...x, status: "rejected" } : x)));
    setNotice(`${o.ref} rejected by ${users[role].id}. Nothing was reserved.`);
  };

  const changeRole = (r: Role) => {
    setRole(r);
    setTab(r === "maker" ? "invest" : "auth");
  };

  /** Next signature an order still needs, and who holds that phone. */
  const nextSigner = (o: Order): Role | undefined => o.needs.find((r) => !o.signed.includes(r));

  const phoneAuthorise = (o: Order, as: Role) => {
    setPhone({ mode: "signing", ref: o.ref, as });
    setTimeout(() => {
      authorise(o, as, inputs, injected);
      setPhone({ mode: "done", ref: o.ref, as });
      setTimeout(() => setPhone((p) => (p.mode === "done" ? { mode: "idle" } : p)), 1600);
    }, 900);
  };

  /** Autoplay a journey end to end, at a pace the audience can follow. */
  const play = async (j: Journey) => {
    if (active || playing) return;
    const token = ++playToken.current;
    const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms / runner.speed));
    const alive = () => playToken.current === token;
    // Every scenario starts from the same clean position, so it plays identically each time.
    runner.reset();
    setBook(START_BOOK);
    setOrders([]);
    setSeq(2);
    setPlaying(j.title);
    setPhone({ mode: "idle" });
    setInputs(j.inputs);
    setInjected(j.injected);
    setSole(false);
    const channel = j.channel ?? "portal";
    try {
      if (channel === "api") {
        setRole("maker");
        setNotice("Incoming order from Party A's treasury system…");
        await pause(1200);
        if (!alive()) return;
        place(j.draft, "api", false, j.inputs, j.injected, "FND-2609-0001");
        return;
      }
      setRole("maker");
      setTab("invest");
      setOpenRef(null);
      setDraft({ ...j.draft, step: "edit" });
      setNotice(`Preparing: ${j.title}`);
      await pause(1300);
      if (!alive()) return;
      setDraft({ ...j.draft, step: "review" });
      await pause(1600);
      if (!alive()) return;
      let o = place(j.draft, "portal", false, j.inputs, j.injected, "FND-2609-0001");
      for (const r of o.needs) {
        // The approver gets a push notification, opens it and confirms with a security code.
        await pause(1500);
        if (!alive()) return;
        setPhone({ mode: "open", ref: o.ref, as: r });
        await pause(1500);
        if (!alive()) return;
        setPhone({ mode: "signing", ref: o.ref, as: r });
        await pause(1000);
        if (!alive()) return;
        o = authorise(o, r, j.inputs, j.injected);
        setPhone({ mode: "done", ref: o.ref, as: r });
        await pause(1000);
        if (!alive()) return;
        setPhone({ mode: "idle" });
      }
    } finally {
      if (alive()) setPlaying(null);
    }
  };

  const resetAll = () => {
    playToken.current++;
    setPlaying(null);
    setPhone({ mode: "idle" });
    setBook(START_BOOK);
    setOrders([]);
    setSeq(1);
    setRole("maker");
    setTab("invest");
    setDraft(null);
    setOpenRef(null);
    setInputs(ON);
    setInjected("none");
    setSole(false);
    setNotice("Demo reset.");
  };

  // ---- derived for the bank side -----------------------------------------------

  const previewSpec: OrderSpec = { ref: "FND-2609-PREVIEW", fund: draft?.fund ?? "csop", side: draft?.side ?? "subscribe", amount: draft?.amount ?? 50_000_000, approvers: [users.maker.id, users.checker.id], channel: "portal" };
  const preview = buildScenario(previewSpec, inputs, injected);
  const view = sc ?? preview;
  const viewFund = fundBy(view.order.fund);
  const pendingForMe = orders.filter((o) => o.status === "pending" && o.needs.includes(role) && !o.signed.includes(role));

  // ---- portal ------------------------------------------------------------------

  const header = (
    <div className="-mx-4 -mt-1 mb-3 border-b border-paper-200 bg-paper-0 px-4 pb-2.5 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rotate-45 bg-brand-500" aria-hidden />
          <span className="text-[14px] font-semibold tracking-tight text-charcoal-900">HSBCnet</span>
          <span className="text-[11px] text-ink-400">(mock)</span>
          <span className="ml-2 text-[12px] text-ink-700">Party A Holdings (HK) Ltd</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
          <Clock size={12} />
          {sc ? `${sc.clockStart.label} · ${clock}` : "Tue 22 Sep · 10:31"} HKT
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" role="tablist" aria-label="HSBCnet sections">
          {(role === "maker"
            ? ([
                ["invest", "Invest"],
                ["orders", "Orders"],
                ["positions", "Positions"],
              ] as const)
            : ([
                ["auth", "Approvals"],
                ["orders", "Orders"],
                ["positions", "Positions"],
              ] as const)
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn("rounded-md px-2.5 py-1 text-[12.5px] font-medium", tab === k ? "bg-charcoal-900 text-paper-0" : "text-ink-700 hover:bg-paper-50")}
            >
              {l}
              {k === "auth" && pendingForMe.length > 0 && <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] text-paper-0">{pendingForMe.length}</span>}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
          <UserRound size={13} />
          <span className="sr-only">Signed in as</span>
          <select value={role} onChange={(e) => changeRole(e.target.value as Role)} className="rounded-md border border-paper-200 bg-paper-0 px-1.5 py-1 text-[11.5px] text-charcoal-900">
            {(Object.keys(users) as Role[]).map((r) => (
              <option key={r} value={r}>
                {users[r].id} · {users[r].title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );

  const noticeBar = (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-paper-200 bg-paper-0 px-3 py-2 text-[12px] text-ink-700">
      <Bell size={13} className="mt-0.5 shrink-0 text-brand-500" />
      <span>{notice}</span>
    </div>
  );

  const f = draft ? fundBy(draft.fund) : null;
  const holdingValue = f ? bookView.holdings[f.key] * f.nav : 0;
  // What this order would do to the client's position, shown before they commit.
  const impact = draft && f && draft.amount !== null
    ? {
        cashFrom: bookView.account,
        cashTo: draft.side === "subscribe" ? bookView.account - draft.amount! : bookView.account + draft.amount!,
        fundFrom: holdingValue,
        fundTo: draft.side === "subscribe" ? holdingValue + draft.amount! : holdingValue - draft.amount!,
        unitsDelta: draft.amount! / f.nav,
      }
    : null;

  const investTab = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper-0 px-3 py-2 text-[12px]">
        <span className="text-ink-500">
          Settlement account <span className="font-medium text-charcoal-900">{ACCOUNT}</span>
        </span>
        <span className="text-ink-500">
          Available <span className="font-mono font-semibold tabular-nums text-charcoal-900">{hkd(available)}</span>
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-paper-200 bg-paper-0">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-paper-200 text-[10.5px] uppercase tracking-wide text-ink-400">
              <th className="px-3 py-2 font-medium">Tokenised HKD money-market funds</th>
              <th className="px-2 py-2 font-medium">7-day yield*</th>
              <th className="px-2 py-2 font-medium">Cut-off*</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {funds.map((fd) => (
              <tr key={fd.key} className={cn("border-b border-paper-100 last:border-0", draft?.fund === fd.key && "bg-brand-50")}>
                <td className="px-3 py-2">
                  <p className="font-semibold text-charcoal-900">{fd.short}</p>
                  <p className="text-[11px] text-ink-500">
                    {fd.manager}
                    <span className="ml-1.5 text-ink-400 underline decoration-dotted underline-offset-2" title="Mock link — offering document and key facts statement">Offering doc · KFS</span>
                  </p>
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-charcoal-900">{fd.yield7d}</td>
                <td className="px-2 py-2 font-mono tabular-nums text-ink-700">{fd.cutoff} HKT</td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    disabled={role !== "maker" || !!active}
                    onClick={() => setDraft({ fund: fd.key, side: "subscribe", amount: null, step: "edit" })}
                    className="rounded-md border border-paper-200 px-2.5 py-1 text-[11.5px] font-medium text-charcoal-900 hover:border-brand-500 disabled:opacity-40"
                  >
                    Trade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-paper-100 px-3 py-1.5 text-[10.5px] text-ink-400">
          All settle in HSBC HKD stablecoin, delivery versus payment. *Yields and cut-offs illustrative, not fund data.
        </p>
      </div>

      {role !== "maker" && <p className="text-[12px] text-ink-500">Signed in as an approver — orders waiting for you are under Approvals.</p>}
      {active && role === "maker" && <p className="text-[12px] text-ink-500">An order is in progress — see Orders.</p>}

      {draft && f && role === "maker" && !active && (
        <div className="rounded-lg border border-charcoal-900 bg-paper-0 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-charcoal-900">{f.name}</p>
              <p className="text-[11px] text-ink-500">{f.manager}</p>
            </div>
            <button type="button" onClick={() => setDraft(null)} aria-label="Close ticket" className="text-ink-400 hover:text-charcoal-900">
              <X size={15} />
            </button>
          </div>

          {draft.step === "edit" ? (
            <div className="mt-2.5 space-y-2.5">
              <div className="flex rounded-lg border border-paper-200 bg-paper-50 p-0.5">
                {(["subscribe", "redeem"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setDraft({ ...draft, side: s })} className={cn("flex-1 rounded-md py-1.5 text-[12px] font-medium capitalize", draft.side === s ? "bg-paper-0 text-charcoal-900 shadow-sm" : "text-ink-500")}>
                    {s}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-ink-500">Amount</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {AMOUNTS.map((a) => (
                    <button key={a} type="button" onClick={() => setDraft({ ...draft, amount: a })} className={cn("rounded-md border px-2.5 py-1 font-mono text-[12px]", draft.amount === a ? "border-brand-500 bg-brand-50 text-charcoal-900" : "border-paper-200 text-ink-700")}>
                      {hkd(a)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11.5px] text-ink-500">{draft.side === "subscribe" ? `Paid from ${ACCOUNT} · available ${hkd(available)}` : `Current holding ${hkd(holdingValue)} · proceeds to ${ACCOUNT}`}</p>
              {impact && (
                <div className="rounded-md bg-paper-50 px-2.5 py-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Your position after this order</p>
                  <div className="mt-1 space-y-0.5 text-[11.5px]">
                    <p className="flex items-center justify-between gap-2 text-ink-700">
                      <span>Cash · {ACCOUNT}</span>
                      <span className="font-mono tabular-nums">
                        {hkd(impact.cashFrom)} <span className="text-ink-400">→</span> <span className="font-semibold text-charcoal-900">{hkd(impact.cashTo)}</span>
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-2 text-ink-700">
                      <span>{f.short}</span>
                      <span className="font-mono tabular-nums">
                        {hkd(impact.fundFrom)} <span className="text-ink-400">→</span> <span className="font-semibold text-charcoal-900">{hkd(impact.fundTo)}</span>
                      </span>
                    </p>
                    <p className="text-[10.5px] text-ink-400">
                      {draft.side === "subscribe" ? "+" : "−"}
                      {units(impact.unitsDelta)} units at NAV HK${f.nav.toFixed(4)} (illustrative)
                    </p>
                  </div>
                </div>
              )}
              {draft.amount !== null && draft.side === "redeem" && draft.amount > holdingValue && <p className="text-[11.5px] font-medium text-rose-600">Exceeds your current holding.</p>}
              {draft.amount !== null && draft.amount > MANDATE && <p className="text-[11.5px] font-medium text-amber-500">Above the HK$100m approval limit — a second, more senior approver must also sign.</p>}
              <button
                type="button"
                disabled={draft.amount === null || (draft.side === "redeem" && draft.amount > holdingValue) || (draft.side === "subscribe" && draft.amount > available)}
                onClick={() => setDraft({ ...draft, step: "review" })}
                className="w-full rounded-lg bg-charcoal-900 py-2 text-[12.5px] font-semibold text-paper-0 disabled:opacity-40"
              >
                {draft.amount === null ? "Choose an amount" : "Review order"}
              </button>
            </div>
          ) : (
            <div className="mt-2.5 space-y-2.5">
              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-[12px]">
                <dt className="text-ink-500">Order</dt>
                <dd className="font-medium capitalize text-charcoal-900">
                  {draft.side} · {hkd(draft.amount ?? 0)}
                </dd>
                <dt className="text-ink-500">{draft.side === "subscribe" ? "Pay from" : "Proceeds to"}</dt>
                <dd className="text-charcoal-900">{ACCOUNT}</dd>
                <dt className="text-ink-500">Settlement</dt>
                <dd className="text-charcoal-900">HSBC HKD stablecoin · delivery versus payment</dd>
                <dt className="text-ink-500">Dealing</dt>
                <dd className="text-charcoal-900">Today before {f.cutoff} HKT; priced at the valuation point</dd>
                <dt className="text-ink-500">After settlement</dt>
                <dd className="text-charcoal-900">{impact && `Cash ${hkd(impact.cashTo)} · ${f.short} ${hkd(impact.fundTo)}`}</dd>
                <dt className="text-ink-500">Approval</dt>
                <dd className="text-charcoal-900">
                  {requiredSigners(draft.amount ?? 0, sole).length === 0 ? "You — single-person approval" : requiredSigners(draft.amount ?? 0, sole).map((r) => users[r].short).join(" + ")}
                </dd>
              </dl>
              <p className="rounded-md bg-paper-50 px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-700">
                {draft.side === "subscribe" ? "Cash is reserved once approved and stays yours until the units are delivered." : "Units are reserved once approved; proceeds are credited to your account at settlement."}
                <br />
                HSBC acts as distributor. The fund&apos;s trustee and custodian may be another bank.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDraft({ ...draft, step: "edit" })} className="flex-1 rounded-lg border border-paper-200 py-2 text-[12.5px] font-medium text-ink-700">
                  Edit
                </button>
                <button type="button" onClick={submit} className="flex-[2] rounded-lg bg-brand-500 py-2 text-[12.5px] font-semibold text-paper-0 hover:bg-brand-600">
                  {requiredSigners(draft.amount ?? 0, sole).length === 0 ? "Submit and approve" : "Submit for approval"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const orderSummary = (o: Order) => {
    const fd = fundBy(o.fund);
    return (
      <dl className="grid grid-cols-[92px_1fr] gap-y-1 text-[12px]">
        <dt className="text-ink-500">Order</dt>
        <dd className="font-medium capitalize text-charcoal-900">
          {o.side} · {hkd(o.amount)}
        </dd>
        <dt className="text-ink-500">Fund</dt>
        <dd className="text-charcoal-900">{fd.name}</dd>
        <dt className="text-ink-500">Account</dt>
        <dd className="text-charcoal-900">{ACCOUNT}</dd>
        <dt className="text-ink-500">Created by</dt>
        <dd className="text-charcoal-900">{users.maker.id}</dd>
        <dt className="text-ink-500">Settlement</dt>
        <dd className="text-charcoal-900">HSBC HKD stablecoin · DvP</dd>
      </dl>
    );
  };

  const authTab = (
    <div className="space-y-2.5">
      {pendingForMe.length === 0 && <p className="rounded-lg bg-paper-0 px-3 py-6 text-center text-[12px] text-ink-500">Nothing waiting for your approval.</p>}
      {pendingForMe.map((o) => (
        <div key={o.ref} className="rounded-lg border border-amber-500 bg-paper-0 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-500">{o.ref}</span>
            <Chip tone="amber">{coarse(o).label}</Chip>
          </div>
          {orderSummary(o)}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => approve(o)} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-charcoal-900 py-1.5 text-[12px] font-medium text-paper-0">
              <Check size={12} /> Approve as {users[role].short}
            </button>
            <button type="button" onClick={() => reject(o)} className="flex items-center gap-1 rounded-md border border-paper-200 px-3 py-1.5 text-[12px] font-medium text-ink-700">
              <X size={12} /> Reject
            </button>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-ink-400">Most approvers do this on HSBCnet Mobile with a security code — see the phone below.</p>
    </div>
  );

  const tracker = (o: Order) => {
    const c = coarse(o);
    const failed = c.tone === "rose";
    return (
      <ol className="flex items-center gap-1">
        {COARSE.map((label, i) => {
          const isDone = i < c.step || (i === c.step && c.tone === "green");
          const isNow = i === c.step && !isDone;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                  isDone && "border-emerald-500 bg-emerald-500 text-paper-0",
                  isNow && !failed && "border-blue-500 text-blue-600",
                  isNow && failed && "border-rose-500 bg-rose-500 text-paper-0",
                  !isDone && !isNow && "border-paper-200 text-ink-400"
                )}
              >
                {isDone ? <Check size={11} strokeWidth={3} /> : isNow && failed ? <X size={11} strokeWidth={3} /> : isNow && c.spin ? <Loader2 size={11} className="animate-spin" /> : i + 1}
              </span>
              <span className={cn("truncate text-[11px]", isDone || isNow ? "font-medium text-charcoal-900" : "text-ink-400")}>{label}</span>
              {i < COARSE.length - 1 && <span className="mx-0.5 h-px min-w-2 flex-1 bg-paper-200" />}
            </li>
          );
        })}
      </ol>
    );
  };

  const ordersTab = (
    <div className="space-y-2.5">
      {orders.length === 0 && <p className="rounded-lg bg-paper-0 px-3 py-6 text-center text-[12px] text-ink-500">No orders today. Create one in Invest, or play a scenario above.</p>}
      {orders.map((o) => {
        const st = coarse(o);
        const fd = fundBy(o.fund);
        const open = openRef === o.ref;
        const isRun = sc?.order.ref === o.ref;
        const rows = timeline(o);
        const signers = o.signed.map((r) => `${users[r].id} (${users[r].short})`);
        return (
          <div key={o.ref} className="rounded-lg border border-paper-200 bg-paper-0">
            <button type="button" onClick={() => setOpenRef(open ? null : o.ref)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
              <ChevronRight size={14} className={cn("shrink-0 text-ink-400 transition-transform", open && "rotate-90")} />
              <span className="hidden font-mono text-[11px] text-ink-500 sm:inline">{o.ref}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium capitalize text-charcoal-900">
                {o.side} · {fd.short}
                {o.channel === "api" && <span className="ml-1.5 rounded bg-paper-100 px-1 py-px text-[10px] font-semibold normal-case text-ink-700">API</span>}
              </span>
              <span className="font-mono text-[12px] tabular-nums text-charcoal-900">{hkd(o.amount)}</span>
              <Chip tone={st.tone} spin={st.spin}>
                {st.label}
              </Chip>
            </button>
            {open && (
              <div className="space-y-3 border-t border-paper-100 px-3 py-3">
                {tracker(o)}
                <p className="text-[11.5px] text-ink-500">
                  {o.channel === "api"
                    ? "Received from Party A's treasury system — approved there."
                    : `Created by ${users.maker.id}${o.soleControl ? " and approved by the same person (single-person approval)" : ""}${signers.length ? ` · approved by ${signers.join(", ")}` : ""}${o.status === "pending" ? ` · waiting for ${o.needs.filter((r) => !o.signed.includes(r)).map((r) => users[r].short).join(" and ")}` : ""}.`}
                </p>
                {o.status !== "pending" && o.status !== "rejected" && (
                  <div className="rounded-md border border-dashed border-paper-200">
                    <button type="button" onClick={() => setDetail(!detail)} className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11.5px] font-medium text-ink-700">
                      <ChevronRight size={12} className={cn("transition-transform", detail && "rotate-90")} />
                      {detail ? "Hide settlement detail" : "Show settlement detail"}
                      <span className="ml-auto rounded bg-brand-50 px-1.5 py-px text-[10px] font-semibold text-brand-600">Proposed experience</span>
                    </button>
                    {detail && (
                      <div className="border-t border-dashed border-paper-200 px-2.5 py-2">
                        <p className="mb-2 text-[11px] leading-relaxed text-ink-500">
                          Live settlement tracking — possible because the stablecoin settles inside HSBC&apos;s own settlement network. Portals today show only the four statuses above.
                        </p>
                        <ol className="space-y-1.5">
                          {rows.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-[12px]">
                              {r.tone === "fail" ? (
                                <X size={13} className="mt-0.5 shrink-0 text-rose-600" />
                              ) : r.tone === "warn" ? (
                                <Clock size={13} className="mt-0.5 shrink-0 text-amber-500" />
                              ) : i === rows.length - 1 && isRun && busyRun ? (
                                <Loader2 size={13} className={cn("mt-0.5 shrink-0 text-blue-600", !runner.paused && "animate-spin")} />
                              ) : (
                                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                              )}
                              <span className="w-14 shrink-0 font-mono text-[11px] text-ink-500">{r.time}</span>
                              <span className="text-charcoal-900">{r.label}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
                {isRun && sc.route !== "coin" && done("route") && sc.route !== "queued" && (
                  <p className="text-[11.5px] text-ink-500">This fund does not accept the HSBC stablecoin yet, so HSBC settled it with tokenised deposits instead. No action needed.</p>
                )}
                {(o.positionAfter || (isRun && phase === "completed")) && (
                  <div className="rounded-md border border-emerald-500 bg-emerald-100 px-2.5 py-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-emerald-600">Your position now</p>
                    <div className="mt-1 space-y-0.5 text-[12px] text-charcoal-900">
                      <p className="flex items-center justify-between gap-2">
                        <span>{o.positionAfter ? o.positionAfter.fund : fd.short}</span>
                        <span className="font-mono tabular-nums">
                          {o.positionAfter ? o.positionAfter.value : hkd(bookView.holdings[o.fund] * fd.nav)}
                          <span className="ml-1.5 text-[10.5px] text-ink-500">{o.positionAfter ? o.positionAfter.units : units(bookView.holdings[o.fund])} units</span>
                        </span>
                      </p>
                      <p className="flex items-center justify-between gap-2">
                        <span>Cash · {ACCOUNT}</span>
                        <span className="font-mono tabular-nums">{o.positionAfter ? o.positionAfter.cash : hkd(bookView.account)}</span>
                      </p>
                    </div>
                  </div>
                )}
                {(o.note || (isRun && phase === "completed")) && (
                  <div className="whitespace-pre-wrap rounded-md bg-paper-50 p-2.5 font-mono text-[11px] leading-relaxed text-charcoal-900">
                    <p className="mb-1 flex items-center gap-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
                      <FileText size={12} /> Contract note · {o.ref}
                    </p>
                    {(o.note ?? contractNote(o)).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const phoneOrder = orders.find((o) => o.status === "pending");
  const phoneSigner = phone.as ?? (phoneOrder ? nextSigner(phoneOrder) : undefined);
  const phoneCard = (
    <div className="mx-auto w-full max-w-[250px] rounded-[26px] border-[5px] border-charcoal-900 bg-charcoal-950 p-2 shadow-sm">
      <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-charcoal-700" />
      <div className="flex items-center justify-between px-1 text-[10px] text-ink-400">
        <span>{sc ? clock.slice(0, 5) : "10:31"}</span>
        <span>{phoneSigner ? users[phoneSigner].id : "Approver"}</span>
      </div>
      <div className="mt-1.5 min-h-[178px] rounded-2xl bg-paper-50 p-2.5">
        <p className="flex items-center gap-1 text-[10.5px] font-semibold text-charcoal-900">
          <span className="h-2 w-2 rotate-45 bg-brand-500" aria-hidden /> HSBCnet Mobile <span className="font-normal text-ink-400">(mock)</span>
        </p>
        {phone.mode === "signing" && (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <Loader2 size={20} className="animate-spin text-brand-500" />
            <p className="text-[11.5px] text-charcoal-900">Checking your security code…</p>
          </div>
        )}
        {phone.mode === "done" && (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <CheckCircle2 size={22} className="text-emerald-600" />
            <p className="text-[11.5px] font-medium text-charcoal-900">Approved</p>
            <p className="font-mono text-[10.5px] text-ink-500">{phone.ref}</p>
          </div>
        )}
        {(phone.mode === "idle" || phone.mode === "open") && !phoneOrder && (
          <p className="mt-10 text-center text-[11px] text-ink-400">No approvals waiting</p>
        )}
        {phone.mode === "idle" && phoneOrder && phoneSigner && (
          <button
            type="button"
            onClick={() => setPhone({ mode: "open", ref: phoneOrder.ref, as: phoneSigner })}
            className="mt-2 w-full animate-pulse rounded-xl bg-paper-0 p-2 text-left shadow-sm ring-1 ring-paper-200"
          >
            <p className="flex items-center gap-1 text-[10.5px] font-semibold text-charcoal-900">
              <Bell size={11} className="text-brand-500" /> 1 order waiting for your approval
            </p>
            <p className="mt-0.5 text-[10.5px] capitalize text-ink-500">
              {phoneOrder.side} {hkd(phoneOrder.amount)} · {fundBy(phoneOrder.fund).short}
            </p>
            <p className="mt-1 text-[10px] font-medium text-brand-600">Tap to review</p>
          </button>
        )}
        {phone.mode === "open" && phoneOrder && phoneSigner && (
          <div className="mt-2 space-y-1.5 text-[11px]">
            <p className="font-mono text-[10px] text-ink-500">{phoneOrder.ref}</p>
            <p className="font-semibold capitalize text-charcoal-900">
              {phoneOrder.side} {hkd(phoneOrder.amount)}
            </p>
            <p className="text-ink-700">{fundBy(phoneOrder.fund).short} · from {ACCOUNT}</p>
            <p className="text-ink-500">Settles in HSBC HKD stablecoin</p>
            <p className="text-ink-500">Approving as {users[phoneSigner].short}</p>
            <div className="flex gap-1.5 pt-1">
              <button type="button" onClick={() => phoneAuthorise(phoneOrder, phoneSigner)} className="flex-1 rounded-lg bg-brand-500 py-1.5 text-[11px] font-semibold text-paper-0">
                Approve
              </button>
              <button type="button" onClick={() => { reject(phoneOrder); setPhone({ mode: "idle" }); }} className="rounded-lg border border-paper-200 px-2 py-1.5 text-[11px] text-ink-700">
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const investedValue = funds.reduce((t, fd) => t + bookView.holdings[fd.key] * fd.nav, 0);
  const positionsTab = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-lg border border-paper-200 bg-paper-0 p-3">
          <p className="text-[11px] text-ink-500">Cash · {ACCOUNT}</p>
          <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-charcoal-900">{hkd(bookView.account)}</p>
          {reserved > 0 ? (
            <p className="mt-0.5 text-[11px] font-medium text-blue-600">{hkd(reserved)} reserved · {hkd(available)} available</p>
          ) : (
            <p className="mt-0.5 text-[11px] text-ink-400">All available</p>
          )}
        </div>
        <div className="rounded-lg border border-paper-200 bg-paper-0 p-3">
          <p className="text-[11px] text-ink-500">Invested in funds</p>
          <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-charcoal-900">{hkd(investedValue)}</p>
          <p className="mt-0.5 text-[11px] text-ink-400">{funds.filter((fd) => bookView.holdings[fd.key] > 0).length} of {funds.length} funds</p>
        </div>
        <div className="rounded-lg border border-paper-200 bg-paper-0 p-3">
          <p className="text-[11px] text-ink-500">Total</p>
          <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-charcoal-900">{hkd(bookView.account + investedValue)}</p>
          <p className="mt-0.5 text-[11px] text-ink-400">Cash and funds</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-paper-200 bg-paper-0">
        <table className="w-full min-w-[460px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-paper-200 text-[10.5px] uppercase tracking-wide text-ink-400">
              <th className="px-3 py-2 font-medium">Fund holding</th>
              <th className="px-2 py-2 text-right font-medium">Units</th>
              <th className="px-2 py-2 text-right font-medium">NAV*</th>
              <th className="px-3 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((fd) => (
              <tr key={fd.key} className="border-b border-paper-100 last:border-0">
                <td className="px-3 py-2">
                  <p className="font-medium text-charcoal-900">{fd.short}</p>
                  <p className="text-[11px] text-ink-500">{fd.manager}</p>
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-ink-700">{units(bookView.holdings[fd.key])}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-ink-700">{fd.nav.toFixed(4)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-charcoal-900">{hkd(bookView.holdings[fd.key] * fd.nav)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10.5px] leading-relaxed text-ink-400">
        *Illustrative NAVs. Positions update when an order is confirmed. Orders settle through an HSBC-held settlement wallet; no
        stablecoin is left in your name between orders.
      </p>
    </div>
  );

  const client = (
    <>
      {header}
      {noticeBar}
      {tab === "invest" ? investTab : tab === "auth" ? authTab : tab === "orders" ? ordersTab : positionsTab}
    </>
  );

  const picker = (
    <div className="flex flex-col gap-2">
      {GROUPS.map((g) => (
        <div key={g.key} className="flex flex-wrap items-center gap-1.5">
          <span className="w-52 shrink-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-400">{g.label}</span>
            <span className="block text-[10.5px] leading-tight text-ink-400">{g.note}</span>
          </span>
          {journeys
            .filter((j) => j.group === g.key)
            .map((j) => (
              <button
                key={j.title}
                type="button"
                disabled={!!active || !!playing}
                onClick={() => play(j)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium disabled:opacity-40",
                  playing === j.title ? "border-brand-500 bg-brand-50 text-charcoal-900" : "border-paper-200 bg-paper-0 text-ink-700 hover:border-brand-500"
                )}
              >
                {playing === j.title ? <Loader2 size={12} className="animate-spin text-brand-500" /> : <Play size={11} className="text-brand-500" />}
                {j.title}
              </button>
            ))}
        </div>
      ))}
    </div>
  );

  const presenter = (
    <div className="rounded-2xl border border-dashed border-paper-200 bg-paper-0 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Presenter controls · conditions the bank sees</p>
      <p className="mt-0.5 text-[11.5px] text-ink-400">Not part of the client&apos;s screen. Scenario buttons set these for you.</p>
      <div className="mt-2.5 grid gap-2">
        <LightSeg label="Fund accepts HSBC stablecoin for settlement" value={inputs.coinEnabled} options={[[true, "Yes"], [false, "No"]]} onChange={(v) => setInputs({ ...inputs, coinEnabled: v })} disabled={!!active} />
        <LightSeg label="Stablecoin issuance (operational incident switch)" value={!inputs.coinPaused} options={[[true, "Live"], [false, "Paused"]]} onChange={(v) => setInputs({ ...inputs, coinPaused: !v })} disabled={!!active} />
        <LightSeg label="EnsembleTX interbank window" value={inputs.windowOpen} options={[[true, "Open"], [false, "Closed"]]} onChange={(v) => setInputs({ ...inputs, windowOpen: v })} disabled={!!active || (inputs.coinEnabled && !inputs.coinPaused)} />
        <LightSeg label="Party A setting · single-person approval" value={sole} options={[[false, "Off"], [true, "On"]]} onChange={setSole} disabled={!!active} />
        <LightSeg<Injected> label="Fund-side exception" value={injected} options={[["none", "None"], ["register", "Register"], ["gate", "Gate"]]} onChange={setInjected} disabled={!!active} />
      </div>
    </div>
  );

  const bankHeader = (
    <>
      <div className={cn("mb-3 rounded-lg border px-3 py-2", view.route === "queued" ? "border-amber-500/60 bg-amber-500/10" : "border-blue-500/60 bg-blue-500/10")}>
        <p className="text-[12px] font-semibold text-paper-0">
          HSBC settlement-routing service: {routeInfo[view.route].label}
          <span className="ml-1.5 font-normal text-ink-400">
            · {viewFund.short} · fund cash at {viewFund.hsbcServiced ? "HSBC" : viewFund.servicer}
          </span>
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-paper-200">{routeReason(view.route, inputs)}</p>
        {viewFund.hsbcPartner && <p className="mt-1 text-[11px] leading-relaxed text-brand-300">Demo scenario: {viewFund.hsbcPartner} — same fund, two licensed stablecoins.</p>}
      </div>
      <ReserveCheck outstanding={bookView.coinOutstanding + coinDelta} moving={view.route === "coin" && phase === "running"} note="Illustrative issuer totals. Reserve pool held by a licensed custodian; reported to the HKMA as licensee." />
    </>
  );

  return (
    <DemoFrame
      runner={runner}
      scenarios={[{ ...view, title: "", icon: null }]}
      systems={buildSystems(viewFund)}
      groups={buildGroups(viewFund, view.route)}
      channel="Client portal"
      client={client}
      picker={picker}
      bankHeader={bankHeader}
      leftFooter={
        <div className="grid gap-3 sm:grid-cols-[250px_1fr]">
          <div>
            <p className="mb-1.5 text-center text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">Approver&apos;s phone</p>
            {phoneCard}
          </div>
          {presenter}
        </div>
      }
      onReset={resetAll}
    />
  );
}
