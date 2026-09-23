import type { ReversalDef, Scenario, StageDef, SystemDef } from "@/components/demo/useStageRunner";
import { hkd, units } from "@/lib/utils";

export type FundKey = "csop" | "blackrock" | "chinaamc";
export type Side = "subscribe" | "redeem";
export type Route = "coin" | "tds-inhouse" | "tds-crossbank" | "queued";
export type Injected = "none" | "register" | "gate";

export interface Fund {
  key: FundKey;
  name: string;
  short: string;
  manager: string;
  servicer: string;
  service: string;
  status: string;
  hsbcServiced: boolean;
  nav: number;
  cutoff: string;
  yield7d: string;
  /** Demo scenario: HSBC onboarded alongside the fund's existing service bank. */
  hsbcPartner?: string;
}

/** Real funds; service roles and status are from public announcements. NAV, cut-off and yield are illustrative. */
export const funds: Fund[] = [
  {
    key: "csop",
    name: "CSOP HKD Money Market ETF · Tokenised Class",
    short: "CSOP HKD MMF",
    manager: "CSOP Asset Management",
    servicer: "HSBC Securities Services",
    service: "HSBC: tokenisation agent, trustee, registrar",
    status: "Launched Jun 2026",
    hsbcServiced: true,
    nav: 10,
    cutoff: "12:00",
    yield7d: "3.42%",
  },
  {
    key: "blackrock",
    name: "BlackRock HKD Digital Liquidity Fund",
    short: "BlackRock HKD DLF",
    manager: "BlackRock",
    servicer: "Standard Chartered",
    service: "Standard Chartered: trustee, custodian, administrator",
    status: "Authorised Sep 2026",
    hsbcServiced: false,
    nav: 1,
    cutoff: "13:00",
    yield7d: "3.48%",
    hsbcPartner: "HSBC onboarded as distributor; HSBC HKD stablecoin enabled alongside HKDAP",
  },
  {
    key: "chinaamc",
    name: "ChinaAMC HKD Digital Money Market Fund",
    short: "ChinaAMC HKD DMMF",
    manager: "China Asset Management (HK)",
    servicer: "Standard Chartered",
    service: "Standard Chartered: tokenisation agent, administrator, custodian",
    status: "Live since Feb 2025",
    hsbcServiced: false,
    nav: 10,
    cutoff: "12:30",
    yield7d: "3.39%",
  },
];

export const fundBy = (k: FundKey) => funds.find((f) => f.key === k)!;

export const MANDATE = 100_000_000;
export const ACCOUNT = "HKD ••4410";

export interface RouteInputs {
  coinEnabled: boolean;
  windowOpen: boolean;
  /** Stablecoin-issuer operational incident: issuance paused, so the stablecoin can't be used for new orders. */
  coinPaused?: boolean;
}

/** Bank-side settlement-routing service. The stablecoin is the product; tokenised deposits are the internal fallback. */
export function pickRoute(fund: Fund, inputs: RouteInputs): Route {
  if (inputs.coinEnabled && !inputs.coinPaused) return "coin";
  if (fund.hsbcServiced) return "tds-inhouse";
  if (inputs.windowOpen) return "tds-crossbank";
  return "queued";
}

export const routeInfo: Record<Route, { label: string; reason: string; asset: string }> = {
  coin: {
    label: "HSBC HKD stablecoin",
    reason: "The fund accepts HSBC's HKD stablecoin for settlement: one settlement asset for every investor, HSBC client or not. It reaches the fund's wallet at any bank, at any hour, with no bank-to-bank step, and the reserve behind it stays with HSBC.",
    asset: "HSBC HKD stablecoin",
  },
  "tds-inhouse": {
    label: "Fallback · HSBC tokenised deposits (TDS)",
    reason: "The fund does not accept the stablecoin yet, but its cash sits at HSBC — so the order settles inside HSBC using tokenised deposits. The client sees no difference.",
    asset: "HSBC tokenised deposits",
  },
  "tds-crossbank": {
    label: "Fallback · tokenised deposits (TDS) via EnsembleTX",
    reason: "The fund banks elsewhere and does not accept the stablecoin yet. EnsembleTX's bank-to-bank window is open, so tokenised deposits move between the banks (settled through RTGS during the pilot).",
    asset: "HSBC tokenised deposits via EnsembleTX",
  },
  queued: {
    label: "No digital route — queue",
    reason: "The fund does not accept the stablecoin and the bank-to-bank window is closed. The order waits for the next CHATS payment window; nothing is debited meanwhile.",
    asset: "CHATS (next window)",
  },
};

/** Why this route, given the conditions — the paused case reads differently from the not-enabled one. */
export function routeReason(route: Route, inputs: RouteInputs): string {
  if (route !== "coin" && inputs.coinPaused) {
    const tail =
      route === "tds-inhouse"
        ? "the fund's cash is at HSBC, so the order settles internally in tokenised deposits."
        : route === "tds-crossbank"
          ? "the fund banks elsewhere, so deposits move bank to bank through EnsembleTX while the window is open."
          : "no deposit route is open either, so the order waits for the next CHATS window.";
    return `Stablecoin issuance is paused (a stablecoin-issuer operational incident, or a reserve check). New orders do not use the stablecoin; ${tail} Stablecoin already set aside for a live order still settles or unwinds normally.`;
  }
  return routeInfo[route].reason;
}

export function buildSystems(fund: Fund): SystemDef[] {
  return [
    { id: "portal", name: "HSBCnet portal", owner: "Client channel", role: "Orders, approvals, order dashboard, contract notes" },
    { id: "auth", name: "Entitlements & signature rules", owner: "Client channel", role: "Enforces the rules Party A's System Administrators set: signature groups, limits, sole control" },
    { id: "erp", name: "API / host-to-host", owner: "Client channel", role: "Orders in from the client's treasury system; status and confirmations back" },
    { id: "screen", name: "Screening & travel rule", owner: "Controls", role: "Sanctions and AML on parties and wallets; originator/beneficiary data" },
    { id: "router", name: "HSBC settlement-routing service", owner: "HSBC digital money", role: "Chooses how each order settles — the client never does" },
    { id: "mint", name: "Stablecoin issuance and redemption", owner: "HSBC digital money", role: "Licensed issuer: stablecoin issued only against HKD received, and removed from circulation on redemption" },
    { id: "wallet", name: "HSBC-held client wallets", owner: "HSBC digital money", role: "Holds the client's stablecoin and fund units; HSBC manages the keys" },
    { id: "reserve", name: "Reserve management", owner: "HSBC digital money", role: "Segregated reserve pool; cash and HQLA; custodian-held" },
    { id: "tds", name: "Tokenised Deposit Service", owner: "HSBC digital money", role: "Internal fallback: HSBC deposits as tokens, 24/7" },
    { id: "routing", name: "Fund order routing", owner: "HSBC fund services", role: "Sends ISO 20022 setr orders to the transfer agent; receives confirmations" },
    { id: "ta", name: fund.hsbcServiced ? "Transfer agent & register" : "Transfer / tokenisation agent", owner: fund.servicer, role: fund.hsbcServiced ? "HSBC runs the register — issues and cancels units" : "Another bank runs the register" },
    { id: "nav", name: "Fund administration · NAV", owner: fund.servicer, role: "Strikes NAV at the valuation point" },
    { id: "dvp", name: "Settlement lock — cash and units move together", owner: "Settlement", role: "Sets aside cash and fund units, then transfers both in one step — or neither" },
    { id: "ensemble", name: "EnsembleTX", owner: "HKMA market infrastructure", role: "HKMA settlement and interoperability layer between institutions' platforms: delivery-versus-payment across banks, tokenised deposits settled through RTGS in the pilot, moving to central bank money — and, per the 2026 Policy Address, regulated stablecoins as an accepted settlement asset for tokenised funds" },
    { id: "chats", name: "HKD CHATS (RTGS)", owner: "HKMA market infrastructure", role: "Interbank HKD settlement; business days" },
    { id: "core", name: "Core banking & general ledger", owner: "Books & reporting", role: "HKD accounts, holds, postings" },
    { id: "recon", name: "Reconciliation & regulatory reporting", owner: "Books & reporting", role: "Checks stablecoins in circulation match reserves; returns to the HKMA as licensee" },
  ];
}

export function buildGroups(fund: Fund, route: Route) {
  return [
    { owner: "Client channel", ids: ["portal", "auth", "erp"] },
    { owner: "Controls", ids: ["screen"] },
    { owner: "HSBC digital money", ids: route === "coin" ? ["router", "mint", "wallet", "reserve"] : ["router", "tds"] },
    { owner: "HSBC fund services", ids: ["routing"] },
    { owner: fund.servicer, ids: ["ta", "nav"] },
    { owner: "Settlement", ids: ["dvp"] },
    // Always shown, so the panel keeps the same shape in every scenario. Which of the
    // two lights up says how the order reached the other institution: EnsembleTX when
    // the register sits at another bank, CHATS when nothing digital is open, and
    // neither when both legs are HSBC's own.
    { owner: "HKMA market infrastructure", ids: ["ensemble", "chats"] },
    { owner: "Books & reporting", ids: ["core", "recon"] },
  ];
}

/** Client-facing status for each backend stage — what the order dashboard shows. Never names a control. */
export const clientStatus: Record<string, string> = {
  authcheck: "Approved",
  screen: "Processing",
  route: "Processing",
  fundin: "Funds reserved",
  lock: "Funds reserved",
  sendta: "Sent to fund",
  accept: "Accepted by fund",
  unitlock: "Accepted by fund",
  valuation: "Awaiting valuation point",
  price: "Priced",
  fundcash: "Priced",
  interbank: "Settling",
  commit: "Settling",
  fundout: "Settled",
  post: "Settled",
  confirm: "Confirmed",
};

export type Channel = "portal" | "api";

export interface OrderSpec {
  ref: string;
  fund: FundKey;
  side: Side;
  amount: number;
  approvers: string[];
  channel: Channel;
}

export interface RailScenario extends Scenario {
  order: OrderSpec;
  route: Route;
  u: number;
  queued: boolean;
}

export function buildScenario(o: OrderSpec, inputs: RouteInputs, injected: Injected): RailScenario {
  const fund = fundBy(o.fund);
  const route = pickRoute(fund, inputs);
  const coin = route === "coin";
  // Both legs on HSBC's own platform only when HSBC also runs the fund's register.
  const crossInstitution = coin && !fund.hsbcServiced;
  const u = o.amount / fund.nav;
  const asset = routeInfo[route].asset;
  const setrOut = o.side === "subscribe" ? "setr.010 SubscriptionOrder" : "setr.004 RedemptionOrder";
  const setrIn = o.side === "subscribe" ? "setr.012 SubscriptionOrderConfirmation" : "setr.006 RedemptionOrderConfirmation";
  const wallet = "W-A01";

  const head: StageDef[] = [
    o.channel === "api"
      ? { id: "authcheck", label: "Instruction from treasury system verified", systemIds: ["erp", "auth"], milestone: 0, detail: `Order received from Party A's treasury system over HSBC's API; message signature and client certificate verified; already approved inside Party A's own system (${o.approvers.join(", ")})`, clientSays: "Received from your treasury system — processing." }
      : { id: "authcheck", label: "Approvals verified", systemIds: ["auth", "portal"], milestone: 0, detail: `HSBCnet approvals verified against Party A's own rules: ${o.approvers.join(", ")}${o.approvers.length === 1 ? " (sole transaction control, as Party A configured)" : ""}${o.amount > MANDATE ? "; group A signature required above the HK$100m signature limit" : ""}`, clientSays: "Approved — processing your order." },
    { id: "screen", shape: "decision", label: "Screening & travel rule", systemIds: ["screen"], milestone: 0, detail: `Party A and ${fund.short}'s dealing wallet screened — clear; originator and beneficiary data attached to the transfer`, clientSays: "Processing your order." },
    { id: "route", shape: "decision", label: "Settlement route chosen", systemIds: ["router"], milestone: 0, detail: `${routeInfo[route].label}. ${routeReason(route, inputs)}`, clientSays: "Processing your order." },
  ];

  const interbank: StageDef = {
    id: "interbank",
    label: "Interbank leg via EnsembleTX",
    systemIds: ["ensemble"],
    milestone: 3,
    ms: 1400,
    detail: `HSBC and ${fund.servicer} settle the tokenised-deposit leg on EnsembleTX; interbank settlement through RTGS in the pilot`,
    clientSays: "Settling with the fund's bank.",
  };

  let stages: StageDef[];
  if (o.side === "subscribe") {
    stages = [
      ...head,
      coin
        ? { id: "fundin", label: "Stablecoin issued to the client's HSBC-held wallet", systemIds: ["mint", "reserve", "core", "wallet"], milestone: 1, detail: `${hkd(o.amount)} debited from ${ACCOUNT} into the segregated reserve pool; ${hkd(o.amount)} of stablecoin issued to Party A's custodial wallet ${wallet}`, clientSays: `${hkd(o.amount)} reserved from ${ACCOUNT}.` }
        : { id: "fundin", label: "Deposits tokenised", systemIds: ["tds", "core"], milestone: 1, detail: `${hkd(o.amount)} held from ${ACCOUNT} as tokenised deposits`, clientSays: `${hkd(o.amount)} reserved from ${ACCOUNT}.` },
      { id: "lock", label: "Cash set aside for settlement", systemIds: ["dvp"], milestone: 1, detail: `${hkd(o.amount)} of ${asset} set aside for order ${o.ref} — still Party A's money until the fund delivers the units`, clientSays: `${hkd(o.amount)} reserved from ${ACCOUNT}.` },
      { id: "sendta", label: "Order sent to transfer agent", systemIds: ["routing"], milestone: 2, detail: `${fund.hsbcPartner ? "HSBC, as onboarded distributor, sends " : ""}ISO 20022 ${setrOut} to ${fund.servicer} for ${fund.short}; settlement instruction: DvP, ${asset}`, clientSays: "Sent to the fund." },
      { id: "accept", shape: "decision", label: "Order accepted by fund", systemIds: ["ta"], milestone: 2, detail: `Investor on register; class open; received before the ${fund.cutoff} cut-off; ${units(u)} units to be issued to unit wallet ${wallet}-U`, clientSays: "Accepted by the fund." },
      { id: "valuation", label: "Waiting for valuation point", systemIds: ["nav"], milestone: 2, ms: 1600, detail: "Included in today's dealing; NAV struck at the valuation point (demo fast-forwards)", clientSays: "Awaiting today's valuation point." },
      { id: "price", label: "NAV struck", systemIds: ["nav"], milestone: 2, detail: `NAV HK$${fund.nav.toFixed(4)} (illustrative) → ${units(u)} units`, clientSays: "Priced." },
      ...(route === "tds-crossbank" ? [interbank] : []),
      { id: "commit", shape: "commit", joinsFrom: ["lock"], label: "Cash and fund units transfer together (DvP)", systemIds: crossInstitution ? ["dvp", "ta", "wallet", "ensemble"] : ["dvp", "ta", "wallet"], milestone: 3, ms: 1300, detail: coin ? `One transaction: coin to ${fund.short}'s wallet at ${fund.servicer}, ${units(u)} units to ${wallet}-U${crossInstitution ? ", co-ordinated across the two banks' platforms on EnsembleTX" : " — both sides on HSBC's own platform"} · tx 0x7f3a…c21e` : `One transaction: ${asset} to ${fund.short}, ${units(u)} units to ${wallet}-U`, clientSays: "Settling — cash and units move together." },
      { id: "post", label: "Posting & reserve check", systemIds: ["core", "recon"], milestone: 4, detail: coin ? "GL posted; stablecoins in circulation = reserve pool; included in today's reserve return to the HKMA" : "GL posted; deposit ledger and register agree", clientSays: "Confirmed." },
      { id: "confirm", label: "Confirmation received", systemIds: ["routing", "portal", "erp"], milestone: 4, detail: `${setrIn} received; contract note issued in HSBCnet; ERP notified`, clientSays: "Confirmed." },
    ];
  } else {
    stages = [
      ...head,
      { id: "sendta", label: "Order sent to transfer agent", systemIds: ["routing"], milestone: 2, detail: `${fund.hsbcPartner ? "HSBC, as onboarded distributor, sends " : ""}ISO 20022 ${setrOut} to ${fund.servicer} for ${fund.short}; proceeds by DvP in ${asset}`, clientSays: "Sent to the fund." },
      { id: "accept", shape: "decision", label: "Order accepted by fund", systemIds: ["ta"], milestone: 2, detail: `Within the fund's daily liquidity limits; before the ${fund.cutoff} cut-off; no gate or fee`, clientSays: "Accepted by the fund." },
      { id: "unitlock", label: "Fund units set aside for settlement", systemIds: ["dvp", "wallet"], milestone: 2, detail: `${units(u)} units set aside for order ${o.ref}`, clientSays: "Accepted by the fund." },
      { id: "valuation", label: "Waiting for valuation point", systemIds: ["nav"], milestone: 2, ms: 1600, detail: "Included in today's dealing; NAV struck at the valuation point (demo fast-forwards)", clientSays: "Awaiting today's valuation point." },
      { id: "price", label: "NAV struck", systemIds: ["nav"], milestone: 2, detail: `NAV HK$${fund.nav.toFixed(4)} (illustrative) → ${units(u)} units for ${hkd(o.amount)}`, clientSays: "Priced." },
      { id: "fundcash", label: "Fund's cash locked", systemIds: ["dvp"], milestone: 3, detail: `${hkd(o.amount)} of ${asset} from the fund locked for payment`, clientSays: "Settling." },
      ...(route === "tds-crossbank" ? [interbank] : []),
      { id: "commit", shape: "commit", joinsFrom: ["unitlock"], label: "Cash and fund units transfer together (DvP)", systemIds: crossInstitution ? ["dvp", "ta", "wallet", "ensemble"] : ["dvp", "ta", "wallet"], milestone: 3, ms: 1300, detail: `One transaction: units cancelled, ${asset} to Party A's custodial wallet ${wallet}${crossInstitution ? ", co-ordinated with " + fund.servicer + " on EnsembleTX" : ""}`, clientSays: "Settling — units and cash move together." },
      coin
        ? { id: "fundout", label: "Stablecoin redeemed and removed from circulation; HKD credited", systemIds: ["mint", "reserve", "core"], milestone: 3, detail: `${hkd(o.amount)} of coin burned; the same amount released from the reserve pool to ${ACCOUNT} at par`, clientSays: `Crediting ${hkd(o.amount)} to ${ACCOUNT}.` }
        : { id: "fundout", label: "Deposits credited", systemIds: ["tds", "core"], milestone: 3, detail: `${hkd(o.amount)} credited to ${ACCOUNT}`, clientSays: `Crediting ${hkd(o.amount)} to ${ACCOUNT}.` },
      { id: "post", label: "Posting & reserve check", systemIds: ["core", "recon"], milestone: 4, detail: coin ? "GL posted; stablecoins in circulation = reserve pool; included in today's reserve return to the HKMA" : "GL posted; deposit ledger and register agree", clientSays: "Confirmed." },
      { id: "confirm", label: "Confirmation received", systemIds: ["routing", "portal", "erp"], milestone: 4, detail: `${setrIn} received; contract note issued in HSBCnet; ERP notified`, clientSays: "Confirmed." },
    ];
  }

  let failAt: string | undefined;
  let failDetail: string | undefined;
  let reversal: ReversalDef[] | undefined;
  if (route === "queued") {
    failAt = "route";
    failDetail = "No digital route: the fund does not accept the stablecoin and EnsembleTX's bank-to-bank window is closed";
    reversal = [
      { label: "Order queued for next CHATS window", systemIds: ["chats"], detail: "Settles by conventional payment when CHATS opens; nothing debited meanwhile" },
      { label: "Client told expected settlement", systemIds: ["portal", "erp"], detail: "Status and expected time in HSBCnet and the ERP" },
    ];
  } else if (injected === "register" && o.side === "subscribe") {
    failAt = "accept";
    failDetail = `${fund.servicer} rejects: Party A's unit wallet has not completed register onboarding`;
    reversal = [
      { label: "Set-aside cash released", systemIds: ["dvp"], detail: `${hkd(o.amount)} of ${asset} returned to ${wallet}` },
      coin
        ? { label: "Stablecoin redeemed and removed from circulation; hold released", systemIds: ["mint", "reserve", "core"], detail: `Unused stablecoin removed from circulation automatically; ${hkd(o.amount)} back in ${ACCOUNT}` }
        : { label: "Hold released", systemIds: ["tds", "core"], detail: `${hkd(o.amount)} back in ${ACCOUNT}` },
    ];
  } else if (injected === "gate" && o.side === "redeem") {
    failAt = "accept";
    failDetail = "Fund manager has applied a liquidity gate for today; redemption not accepted";
    reversal = [
      { label: "Order closed", systemIds: ["routing"], detail: "No units locked; holding unchanged" },
      { label: "Client offered next dealing day", systemIds: ["portal"], detail: "Relationship team notified" },
    ];
  }

  return {
    key: `${o.ref}-${route}-${injected}`,
    stages,
    failAt,
    failDetail,
    reversal,
    clockStart: { h: 10, m: 32, label: "Tue 22 Sep" },
    order: o,
    route,
    u,
    queued: route === "queued",
  };
}
