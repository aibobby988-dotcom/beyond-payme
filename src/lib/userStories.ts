export type Pkg = "Stablecoin platform" | "Fund investing";

export interface Persona {
  id: string;
  name: string;
  role: string;
  needs: string;
}

export interface Epic {
  id: string;
  name: string;
  pkg: Pkg;
  release: string;
  goal: string;
}

/** One named acceptance scenario, written Given / When / Then / And. */
export interface Criterion {
  name: string;
  gwt: string[][];
}

export interface Story {
  id: string;
  epic: string;
  persona: string;
  want: string;
  so: string;
  priority: "Must" | "Should" | "Could";
  points: number;
  trace: string;
  /** Why this story exists: today's behaviour and the problem with it. */
  context: string;
  criteria: Criterion[];
  /** Rules that always hold, whatever the scenario. */
  rules?: string[];
  /** Edge cases and negative paths the squad must handle. */
  edge?: string[];
  /** Fields, values and messages this story needs. */
  data?: string[];
  /** Performance, security, audit and accessibility expectations. */
  nfr?: string[];
  /** What must exist before this can be built or shipped. */
  deps?: string[];
  /** Open questions to settle before the sprint starts. */
  questions?: string[];
  notes?: string;
}

export const personas: Persona[] = [
  { id: "treasurer", name: "Alice Chan — treasury dealer", role: "Party A Holdings · creates orders", needs: "Put surplus HKD to work and get it back, without opening new accounts or waiting days for settlement." },
  { id: "authoriser", name: "Brian Lau — treasury manager", role: "Party A Holdings · approves up to HK$100m", needs: "See exactly what he is approving, in one place, wherever he is; nothing moves until he signs." },
  { id: "sysadmin", name: "Client system administrator", role: "Party A Holdings · HSBCnet administration", needs: "Set who may create and approve orders, and up to what amount — and trust the bank to enforce it." },
  { id: "issuerops", name: "Issuer operations analyst", role: "HSBC · stablecoin issuing team", needs: "Stablecoins in circulation always match reserves; any break is visible and contained within a minute." },
  { id: "fcc", name: "Financial-crime compliance officer", role: "HSBC Compliance", needs: "Every holder identified, every transfer screened, and nothing said to a client that reveals a control." },
  { id: "ta", name: "Transfer-agent operations", role: "HSBC Securities Services", needs: "Units issued and cancelled only against settled cash, with the register always right." },
];

export const epics: Epic[] = [
  { id: "E1", name: "Issuing core — issue, redeem and reserves", pkg: "Stablecoin platform", release: "R0", goal: "Stablecoin exists only against HKD held in the segregated reserve, and is removed from circulation when redeemed." },
  { id: "E2", name: "Wallet onboarding and the approved-wallet list", pkg: "Stablecoin platform", release: "R0", goal: "Only identified, checked parties can hold or receive the stablecoin." },
  { id: "E3", name: "Subscribing to fund units with the stablecoin", pkg: "Fund investing", release: "R1", goal: "A treasurer subscribes to tokenised fund units in one instruction, paid from an HKD account." },
  { id: "E4", name: "Redeeming fund units and returning to cash", pkg: "Fund investing", release: "R1", goal: "Units become stablecoin, and stablecoin becomes HKD at par, in one flow." },
  { id: "E5", name: "Reserve checks, reporting and audit", pkg: "Stablecoin platform", release: "R0–R1", goal: "Every movement checked, reported to the client's systems and auditable afterwards." },
  { id: "E6", name: "Client channels and approvals", pkg: "Stablecoin platform", release: "R1–R2", goal: "Orders arrive through HSBCnet or the client's own systems, and are approved exactly as the client configured." },
];

const ACCOUNT = "HKD ••4410";

export const stories: Story[] = [
  // ---------------------------------------------------------------- E1
  {
    id: "S-101",
    epic: "E1",
    persona: "issuerops",
    want: "every issuance to move the same HKD into the segregated reserve in the same transaction",
    so: "stablecoins in circulation can never exceed the reserves behind them",
    priority: "Must",
    points: 8,
    trace: "Demo · bank step “Stablecoin issued to the client's HSBC-held wallet”",
    context:
      "Under the Stablecoins Ordinance the reserve must fully back what is in circulation at all times. If issuing and funding are two separate steps, a failure between them leaves stablecoin outstanding with no cash behind it — the one break a supervisor will not accept.",
    criteria: [
      {
        name: "Issuance funded and recorded as one transaction",
        gwt: [
          ["Given", `Party A holds HK$200,000,000 in ${ACCOUNT} and its wallet is on the approved-wallet list`],
          ["When", "an approved order needs HK$50,000,000 of stablecoin"],
          ["Then", `HK$50,000,000 is debited from ${ACCOUNT} and credited to the segregated reserve account`],
          ["And", "HK$50,000,000 of stablecoin is issued to Party A's HSBC-held wallet"],
          ["And", "both postings carry the same order reference and commit together, or neither commits"],
          ["And", "stablecoins in circulation equal reserves held when the posting completes"],
        ],
      },
      {
        name: "Funding fails",
        gwt: [
          ["Given", "the HKD debit is rejected (insufficient available balance, account blocked, or a posting error)"],
          ["When", "issuance is attempted"],
          ["Then", "no stablecoin is issued and no reserve entry is made"],
          ["And", "the order is rejected with a reason code, and the client sees only that the order could not be completed"],
        ],
      },
      {
        name: "Issuance is paused",
        gwt: [
          ["Given", "issuance is paused after a reserve break or an operational incident"],
          ["When", "a new order reaches this step"],
          ["Then", "no stablecoin is issued, and the order is routed to tokenised deposits or queued (see S-606)"],
        ],
      },
    ],
    rules: [
      "Stablecoin is only ever issued against cash already received into the reserve — never on credit, never in advance.",
      "The reserve is segregated from HSBC's own assets and held by an acceptable custodian.",
      "Issuance above a set amount needs more than one person inside the bank.",
    ],
    edge: [
      "The same order is sent twice: the second must not issue a second amount.",
      "A partial posting failure rolls back both legs rather than leaving a half-funded issuance.",
      "Rounding: HKD to two decimal places, and issuance must match the debit exactly.",
    ],
    data: [
      "orderRef · amount (HKD 2dp) · clientWalletId · reserveAccountId · valueTimestamp",
      "reasonCode on rejection: INSUFFICIENT_FUNDS · ACCOUNT_BLOCKED · ISSUANCE_PAUSED · POSTING_FAILED",
    ],
    nfr: [
      "Issuance visible in the reserve check within one second of the posting.",
      "Immutable audit record: what triggered it, the order, the amounts, the outcome.",
      "Issuing keys held in tamper-resistant hardware; no single operator can issue alone.",
    ],
    deps: ["Reserve account opened and custodian appointed", "Issuing platform connected to core banking postings"],
    questions: ["What is the internal approval threshold for a single issuance?", "Does treasury pre-fund the reserve intraday, or does each order fund itself?"],
  },
  {
    id: "S-102",
    epic: "E1",
    persona: "treasurer",
    want: "to convert stablecoin back to HKD in my account at par, at any hour",
    so: "holding it briefly during settlement carries no price or timing risk",
    priority: "Must",
    points: 5,
    trace: "Demo · sell order, bank step “Stablecoin redeemed and removed from circulation; HKD credited”",
    context:
      "The HKMA expects valid redemption requests to be processed within one business day. In this service the client should not wait at all: the stablecoin exists only around a trade, so it converts back as part of the same flow.",
    criteria: [
      {
        name: "Redemption at par",
        gwt: [
          ["Given", "Party A's wallet holds HK$20,000,000 of stablecoin from a completed redemption"],
          ["When", "it is redeemed under the client's standing instruction"],
          ["Then", "the stablecoin is removed from circulation and HK$20,000,000 is released from the reserve"],
          ["And", `${ACCOUNT} is credited with exactly HK$20,000,000 — no spread, and no fee taken from principal`],
          ["And", "stablecoins in circulation fall by the same amount as the reserve"],
        ],
      },
      {
        name: "More requested than held",
        gwt: [
          ["Given", "the wallet holds HK$20,000,000"],
          ["When", "a redemption of HK$25,000,000 is requested"],
          ["Then", "it is rejected, nothing is removed from circulation, and the balance is unchanged"],
        ],
      },
      {
        name: "Redemption during an issuance pause",
        gwt: [
          ["Given", "new issuance is paused"],
          ["When", "a holder redeems"],
          ["Then", "the redemption still completes — holders can always get cash back"],
        ],
      },
    ],
    rules: [
      "Redemption is always at par: one stablecoin returns one Hong Kong dollar.",
      "Fees, if any, are billed separately and never netted off the redemption.",
      "Redemption is never blocked by an issuance pause.",
    ],
    edge: ["Redemption while the reserve check is in a break state", "Partial redemption of a balance", "Redemption after the client's account closes — proceeds held, not lost"],
    data: ["walletId · amount · destinationAccount · standingInstruction (RETURN_TO_CASH | HOLD)"],
    nfr: ["Immediate in this flow, and within one business day in every case.", "Audit record links the redemption to the originating order."],
    deps: ["S-101"],
  },
  {
    id: "S-103",
    epic: "E1",
    persona: "issuerops",
    want: "new issuance to pause automatically if circulation and reserves ever differ",
    so: "a break is contained in a minute rather than compounding all day",
    priority: "Must",
    points: 5,
    trace: "Demo · bank step “Posting & reserve check”",
    context: "Reconciling at day end is normal for deposits but not enough for an issuer: every minute of drift is a minute of unbacked circulation. So the check runs after every movement.",
    criteria: [
      {
        name: "Break detected",
        gwt: [
          ["Given", "the reserve check runs after every issuance, redemption and transfer"],
          ["When", "stablecoins in circulation differ from reserves held by any amount"],
          ["Then", "new issuance is paused within one minute"],
          ["And", "a priority-one alert reaches the 24/7 rota with the difference and the last movements"],
          ["And", "redemptions continue so holders can still get cash back"],
        ],
      },
      {
        name: "Break cleared",
        gwt: [
          ["Given", "an operator has investigated and corrected the cause"],
          ["When", "two named people confirm the figures match"],
          ["Then", "issuance resumes, and the pause, cause and approvals are recorded"],
        ],
      },
    ],
    rules: ["Tolerance is zero: any difference is a break.", "Resuming issuance always needs two people.", "The daily return to the HKMA reports any break and how long it lasted."],
    edge: ["A movement in flight when the check runs must not read as a break", "Repeated small breaks escalate rather than alert repeatedly"],
    data: ["circulationTotal · reserveTotal · difference · lastMovements[] · alertId · pausedAt · resumedBy[]"],
    nfr: ["Check completes within one second of a movement.", "Alert reaches the rota within one minute."],
    deps: ["S-101", "24/7 rota and alerting"],
    notes: "Keeping redemptions open during a pause is deliberate, and is the first thing a supervisor asks about.",
  },

  // ---------------------------------------------------------------- E2
  {
    id: "S-201",
    epic: "E2",
    persona: "fcc",
    want: "only wallets belonging to parties we have checked to hold or receive the stablecoin",
    so: "every holder is identified, as the licence requires",
    priority: "Must",
    points: 8,
    trace: "Demo · every order, bank step “Screening & travel rule”",
    context: "A licensed stablecoin is not an open bearer instrument. Holding is restricted to approved wallets, which is what lets HSBC know every holder and answer for the flows.",
    criteria: [
      {
        name: "Adding a wallet",
        gwt: [
          ["Given", "Party A has completed due diligence and registered a wallet"],
          ["When", "one person adds it to the approved-wallet list and a different person approves"],
          ["Then", "the wallet can hold stablecoin and settle fund orders"],
          ["And", "the approval, both names and the evidence are recorded"],
        ],
      },
      {
        name: "Transfer to a wallet that is not approved",
        gwt: [
          ["Given", "a transfer targets a wallet that is not on the list"],
          ["When", "it is submitted"],
          ["Then", "it is rejected before execution and nothing moves"],
          ["And", "the client is told the recipient is not eligible, and never which control stopped it"],
        ],
      },
      {
        name: "Wallet suspended mid-order",
        gwt: [
          ["Given", "a wallet is suspended after a review"],
          ["When", "an order involving it is in flight"],
          ["Then", "the order stops at the next control and a case is raised for an investigator"],
          ["And", "any balance already held is frozen pending that review, not seized"],
        ],
      },
    ],
    rules: [
      "Both sides must be on the list at the moment of transfer, not only when the order was raised.",
      "Adding or changing a wallet always needs two people.",
      "Client messages never name the control, the list or the reason.",
    ],
    edge: ["A wallet approved for one entity used by another", "Suspension between order and settlement", "Re-approval after remediation"],
    data: ["walletId · legalEntity · dueDiligenceRef · status (ACTIVE | SUSPENDED | REMOVED) · approvedBy[] · approvedAt"],
    nfr: ["List checks add no more than 100ms to an order.", "Every change is audit-logged and retained per record-keeping rules."],
    deps: ["Client due-diligence process", "Case management"],
  },
  {
    id: "S-202",
    epic: "E2",
    persona: "fcc",
    want: "sender and beneficiary details carried with every transfer",
    so: "travel-rule obligations are met without anyone assembling them by hand",
    priority: "Must",
    points: 3,
    trace: "Demo · every order, bank step “Screening & travel rule”",
    context: "Transfer information must travel with the payment. Taking it from the wallet record keeps it consistent and removes manual entry.",
    criteria: [
      {
        name: "Details attached automatically",
        gwt: [
          ["Given", "a transfer between two approved wallets"],
          ["When", "it is submitted"],
          ["Then", "sender and beneficiary details are attached from the wallet records"],
          ["And", "the transfer and its details are screened before anything moves"],
        ],
      },
      {
        name: "Required details missing",
        gwt: [
          ["Given", "a wallet record is missing a required detail"],
          ["When", "a transfer is submitted"],
          ["Then", "it is held rather than executed, and an operations task is raised"],
        ],
      },
    ],
    rules: ["Details come from the wallet record, never typed per order.", "A screening hit stops the order and raises a case; the client sees only that the order could not be completed."],
    edge: ["Threshold changes to the required detail set", "Screening service unavailable — orders queue rather than pass unscreened"],
    data: ["originator: name, account or wallet, address as required · beneficiary: name, wallet · screeningResult · caseId"],
    nfr: ["Screening completes in under two seconds for 95 of 100 orders.", "No client-facing text reveals a screening outcome."],
    deps: ["S-201", "Sanctions and AML screening service"],
  },

  // ---------------------------------------------------------------- E3
  {
    id: "S-301",
    epic: "E3",
    persona: "treasurer",
    want: "to subscribe to tokenised money-market fund units in one instruction from HSBCnet",
    so: "I need no exchange account, no separate payment and no second system",
    priority: "Must",
    points: 13,
    trace: "Demo · scenario “Subscribe HK$50m · CSOP”",
    context:
      "Today a treasurer subscribing to a tokenised fund deals through a licensed exchange account and funds it separately: a new relationship, new controls, and a gap between paying and owning. HSBC can do the whole thing in one instruction.",
    criteria: [
      {
        name: "Order placed, approved and settled",
        gwt: [
          ["Given", "Party A's rules need one approver up to HK$100m, and the fund accepts the HSBC stablecoin"],
          ["When", "Alice creates a HK$50,000,000 subscription before the cut-off and Brian approves it"],
          ["Then", `HK$50,000,000 is reserved from ${ACCOUNT} and set aside for settlement`],
          ["And", "the order goes to the fund's transfer agent with a delivery-versus-payment instruction"],
          ["And", "at the valuation point the units and the cash transfer in one step, or neither does"],
          ["And", "a contract note reaches HSBCnet and the client's systems within 60 seconds of settlement"],
        ],
      },
      {
        name: "Placed after the cut-off",
        gwt: [
          ["Given", "today's cut-off for that fund has passed"],
          ["When", "Alice reviews the order"],
          ["Then", "she is shown the next dealing day and the price it will use, before she submits"],
        ],
      },
      {
        name: "Not enough available cash",
        gwt: [
          ["Given", `${ACCOUNT} has HK$40,000,000 available after other holds`],
          ["When", "Alice tries to subscribe for HK$50,000,000"],
          ["Then", "the order cannot be submitted and the shortfall is shown on the ticket"],
        ],
      },
    ],
    rules: [
      "Cash is reserved when the order is approved, and remains the client's until units are delivered.",
      "The fund's cut-off and pricing always apply: the stablecoin changes settlement, not pricing.",
      "The client is never asked which settlement asset to use.",
    ],
    edge: [
      "Fund rejects after cash is reserved (S-303)",
      "Price moves between review and the valuation point — units are calculated at the struck price",
      "Client's account blocked between approval and settlement",
    ],
    data: ["orderId · fundId · side · amount · settlementAccount · dealingDate · approvers[] · channel"],
    nfr: ["Ticket to submitted in no more than three clicks.", "Each status change visible to the client within two seconds."],
    deps: ["S-101", "S-201", "The fund agrees to accept the stablecoin"],
    notes: "Split candidate: the callback to the client's systems can ship after the on-screen contract note.",
  },
  {
    id: "S-302",
    epic: "E3",
    persona: "treasurer",
    want: "to pay from my HKD account without choosing or handling any settlement asset",
    so: "investing feels like any other HSBCnet instruction",
    priority: "Must",
    points: 5,
    trace: "Demo · Invest tab, review screen",
    context: "Early tokenised-fund journeys make the client hold a token and pay with it. That pushes bank plumbing onto the treasurer and creates a balance they must manage and explain to auditors.",
    criteria: [
      {
        name: "One settlement account, no asset choice",
        gwt: [
          ["Given", "Party A agreed at onboarding that HSBC may settle its fund trades with the stablecoin"],
          ["When", "Alice reviews a subscription"],
          ["Then", `the ticket shows ${ACCOUNT} and “settles in HSBC HKD stablecoin, delivery versus payment”`],
          ["And", "no control anywhere in the journey asks the client to choose a settlement asset"],
          ["And", "the contract note records which asset actually settled it"],
        ],
      },
      {
        name: "Nothing held between orders",
        gwt: [
          ["Given", "a completed subscription or redemption"],
          ["When", "Alice opens Positions"],
          ["Then", "she sees cash and fund holdings only, and no stablecoin is held in her name between orders"],
        ],
      },
    ],
    rules: ["Consent is captured once at onboarding and shown on the review screen.", "The settlement asset is recorded on every contract note for the client's auditors."],
    edge: ["Client withdraws consent — orders fall back to tokenised deposits or conventional payment", "An order unwinds: stablecoin issued for it is removed from circulation the same day"],
    data: ["settlementConsent (captured at onboarding) · settlementAssetUsed on the contract note"],
    nfr: ["Plain-language labels only: no token, wallet or ledger terms on client screens."],
    deps: ["Onboarding consent wording agreed with Legal"],
  },
  {
    id: "S-303",
    epic: "E3",
    persona: "ta",
    want: "an order to unwind automatically if the fund cannot issue the units",
    so: "a client's money is never stranded when something fails at the fund's end",
    priority: "Must",
    points: 5,
    trace: "Demo · scenario “Fund rejects · auto-unwind”",
    context: "Register problems are ordinary: an investor not yet onboarded to the fund, or a closed class. What must not be ordinary is a client with cash gone and no units.",
    criteria: [
      {
        name: "Fund rejects after cash is set aside",
        gwt: [
          ["Given", "HK$50,000,000 is set aside for settlement"],
          ["When", "the transfer agent rejects the order"],
          ["Then", "the set-aside cash returns to the client's wallet within one minute"],
          ["And", "any stablecoin issued for the order is removed from circulation and the hold released"],
          ["And", `Positions and available cash return to exactly what they were, and ${ACCOUNT} shows the full balance again`],
          ["And", "the client is told what is needed next, with a reference, and not which check failed"],
        ],
      },
      {
        name: "Reason recorded internally",
        gwt: [
          ["Given", "the rejection carries a reason from the transfer agent"],
          ["When", "the unwind completes"],
          ["Then", "a case is opened for the owning team with the reason and the order attached"],
        ],
      },
    ],
    rules: ["An unwind always restores the client to their pre-order position.", "Client messages describe the next step, never the failing control."],
    edge: ["Rejection arrives after the valuation point", "Rejection arrives twice", "The unwind itself fails — alert, never silently leave cash set aside"],
    data: ["rejectionReason · caseId · clientRef shown to the client"],
    nfr: ["Unwind completes within one minute of the rejection.", "Position and cash figures stay consistent at every point."],
    deps: ["S-101", "Case management"],
  },
  {
    id: "S-304",
    epic: "E3",
    persona: "treasurer",
    want: "to use the same HSBC stablecoin in funds serviced by other banks",
    so: "one settlement asset works across the funds I actually hold",
    priority: "Should",
    points: 8,
    trace: "Demo · scenario “Subscribe HK$50m · BlackRock”",
    context: "Most tokenised funds in Hong Kong are serviced by another bank. A settlement asset that only works where HSBC is the servicer serves one shelf, not the market.",
    criteria: [
      {
        name: "Fund at another bank accepts it",
        gwt: [
          ["Given", "a fund whose custodian is another bank has agreed to accept the HSBC stablecoin"],
          ["When", "Alice subscribes HK$50,000,000 to it"],
          ["Then", "the stablecoin reaches the fund's wallet at its custodian and the units reach Party A in one step"],
          ["And", "no bank-to-bank settlement step is needed"],
        ],
      },
      {
        name: "Fund has not agreed",
        gwt: [
          ["Given", "the fund does not accept the HSBC stablecoin"],
          ["When", "an order is placed"],
          ["Then", "the settlement-routing service falls back without involving the client (see S-305)"],
        ],
      },
    ],
    rules: ["Acceptance is recorded per fund and share class, with the date agreed.", "Acceptance can be withdrawn, and routing must respect that immediately."],
    edge: ["Accepted for one class but not another", "The custodian's wallet changes"],
    data: ["fundId · shareClassId · acceptsStablecoin (agreedAt) · custodianWalletId"],
    deps: ["Commercial agreement with the fund and its trustee"],
  },
  {
    id: "S-305",
    epic: "E3",
    persona: "issuerops",
    want: "settlement to fall back to tokenised deposits when a fund does not accept the stablecoin",
    so: "orders still settle digitally while funds are being onboarded",
    priority: "Should",
    points: 8,
    trace: "Demo · scenario “Fund won’t take stablecoin · deposits inside HSBC”",
    context: "No fund accepts an HSBC stablecoin today. The service has to work during the period when some do and some do not, without the client noticing the difference.",
    criteria: [
      {
        name: "Fund's cash is at HSBC",
        gwt: [
          ["Given", "the fund does not accept the stablecoin and its cash sits at HSBC"],
          ["When", "an order is approved"],
          ["Then", "it settles inside HSBC using tokenised deposits, with no change for the client"],
        ],
      },
      {
        name: "Fund banks elsewhere, window open",
        gwt: [
          ["Given", "the fund banks elsewhere and EnsembleTX's bank-to-bank window is open"],
          ["When", "an order is approved"],
          ["Then", "tokenised deposits move between the banks and the order settles"],
        ],
      },
      {
        name: "No route available",
        gwt: [
          ["Given", "the fund does not accept the stablecoin and the window is closed"],
          ["When", "an order is approved"],
          ["Then", "it is queued for the next conventional payment window with nothing debited"],
        ],
      },
    ],
    rules: ["The route and the reason are recorded on every order.", "The client is told the settlement asset on the contract note but never asked to choose it."],
    edge: ["Window closes between approval and settlement", "Fund enables the stablecoin mid-day — orders already in flight keep their route"],
    data: ["routeChosen · routeReason · windowStatus"],
    deps: ["Tokenised deposit service", "EnsembleTX participation"],
  },

  // ---------------------------------------------------------------- E4
  {
    id: "S-401",
    epic: "E4",
    persona: "treasurer",
    want: "to redeem fund units and have the money land in my HKD account in one flow",
    so: "I never have to manage a token balance in between",
    priority: "Must",
    points: 8,
    trace: "Demo · scenario “Redeem HK$20m · ChinaAMC”",
    context: "Getting cash out is the half treasurers care about most: it is what lets them hold less idle cash in the first place.",
    criteria: [
      {
        name: "Redemption settles and converts back to cash",
        gwt: [
          ["Given", "Party A holds HK$80,000,000 in the fund and has a standing instruction to return proceeds to cash"],
          ["When", "Alice redeems HK$20,000,000 of units within the fund's limits"],
          ["Then", "the units are set aside, and at the valuation point units and cash transfer in one step"],
          ["And", "the stablecoin received is removed from circulation and HK$20,000,000 credited to the account"],
          ["And", "Positions show the reduced holding and the increased cash, and the totals still add up"],
        ],
      },
      {
        name: "Fund applies a limit or fee",
        gwt: [
          ["Given", "the redemption would trigger a gate, a fee or a notice period"],
          ["When", "Alice reviews the order"],
          ["Then", "she is shown the consequence before submitting, and can reduce the amount instead"],
        ],
      },
      {
        name: "More units requested than held",
        gwt: [["Given", "the holding is HK$80,000,000"], ["When", "a redemption of HK$100,000,000 is attempted"], ["Then", "the order cannot be submitted, and the available holding is shown"]],
      },
    ],
    rules: ["Proceeds go to the account named on the order, which must belong to the client.", "The standing instruction decides whether proceeds convert back to cash or stay put."],
    edge: ["Sale on a day a fee or gate changes", "Sale while another order is in flight — holdings must not be double-counted"],
    data: ["unitsToSell or amount · standingInstruction · expectedProceeds · feeOrGateWarning"],
    deps: ["S-102", "Fund dealing rules available to the ticket"],
  },
  {
    id: "S-402",
    epic: "E4",
    persona: "treasurer",
    want: "to be told at once if the fund will not accept a redemption today",
    so: "I can raise cash elsewhere before anything is locked up",
    priority: "Should",
    points: 3,
    trace: "Demo · presenter control “Fund-side exception: Gate”, on a redemption",
    context: "Money-market funds can gate redemptions. A treasurer who finds out late has a payment problem; one who finds out immediately has a choice.",
    criteria: [
      {
        name: "Fund gates redemptions",
        gwt: [
          ["Given", "the fund has applied a liquidity gate for the day"],
          ["When", "a redemption is submitted"],
          ["Then", "no units are set aside and the holding is unchanged"],
          ["And", "the client is offered the next dealing day or a smaller amount, and the relationship team is notified"],
        ],
      },
    ],
    rules: ["A gated order is closed rather than left pending overnight, unless the client asks to keep it for the next day."],
    edge: ["Gate applied after acceptance but before the valuation point"],
    data: ["gateFlag · nextDealingDate · maximumAcceptableAmount"],
    deps: ["Fund status feed"],
  },

  // ---------------------------------------------------------------- E5
  {
    id: "S-501",
    epic: "E5",
    persona: "treasurer",
    want: "every movement to appear in my statement and my own systems with the order reference",
    so: "my team reconciles nothing by hand",
    priority: "Should",
    points: 5,
    trace: "Demo · bank step “Confirmation received”",
    context: "Tokenised settlement only helps if it lands in the client's books automatically; otherwise it creates a new manual reconciliation.",
    criteria: [
      {
        name: "Confirmation reaches the client's systems",
        gwt: [
          ["Given", "any subscription, redemption or issuance on Party A's wallets"],
          ["When", "it settles"],
          ["Then", "a message reaches the client's treasury system with the order reference and the settlement asset"],
          ["And", "the same entry appears in the HSBCnet statement with that reference"],
        ],
      },
      {
        name: "Client system unavailable",
        gwt: [
          ["Given", "the client's endpoint is unreachable"],
          ["When", "delivery is attempted"],
          ["Then", "it retries with back-off and raises an operations task after the agreed window, without duplicating the entry"],
        ],
      },
    ],
    rules: ["Every client-facing record carries the order reference.", "A resent confirmation must not create a second booking."],
    data: ["orderRef · settlementAsset · units · price · valueDate · statementLine"],
    nfr: ["Delivered within 60 seconds of settlement for 95 of 100 orders.", "At-least-once delivery, with duplicate protection."],
    deps: ["Client connectivity (API or host-to-host)"],
  },
  {
    id: "S-502",
    epic: "E5",
    persona: "issuerops",
    want: "a daily reserve return that assembles itself from the day's movements",
    so: "reporting to the HKMA is a check, not a spreadsheet exercise",
    priority: "Must",
    points: 5,
    trace: "Demo · bank step “Posting & reserve check”",
    context: "Licensee reporting is routine but unforgiving. Building it from the same records that drive the live check means the report cannot disagree with the system.",
    criteria: [
      {
        name: "Return produced and signed off",
        gwt: [
          ["Given", "a day of issuances, redemptions and transfers"],
          ["When", "the daily cut is taken"],
          ["Then", "the return shows opening and closing circulation, reserves held and their composition, and any break with its duration"],
          ["And", "it is reviewed and signed by a named person before submission"],
        ],
      },
    ],
    rules: ["The return is generated from live records, never re-keyed.", "Breaks are reported even when corrected the same day."],
    data: ["openingCirculation · closingCirculation · reserveComposition[] · breaks[] · preparedBy · approvedBy"],
    nfr: ["Reproducible: re-running it for a past date gives the same figures.", "Retained per regulatory record-keeping requirements."],
    deps: ["S-103"],
  },

  // ---------------------------------------------------------------- E6
  {
    id: "S-601",
    epic: "E6",
    persona: "sysadmin",
    want: "orders above our HK$100m limit to need a second, more senior approver",
    so: "no single team can commit more than the board allowed",
    priority: "Must",
    points: 5,
    trace: "Demo · scenario “HK$150m · two approvers”",
    context: "Approval limits are the client's own control. The bank's job is to enforce exactly what they configured, not to impose its own.",
    criteria: [
      {
        name: "Two approvals required above the limit",
        gwt: [
          ["Given", "Party A's limit for a standard approver is HK$100,000,000"],
          ["When", "a HK$150,000,000 order is created and Brian approves it"],
          ["Then", "the order shows “Pending approval 1/2” and nothing is reserved"],
          ["And", "processing starts only when Carmen, a senior approver, also approves"],
          ["And", "both approvals, with names and times, appear on the order"],
        ],
      },
      {
        name: "An approver rejects",
        gwt: [["Given", "an order waiting for approval"], ["When", "any approver rejects it"], ["Then", "the order closes, nothing is reserved, and the rejection is recorded with the name"]],
      },
      {
        name: "Limits change mid-flight",
        gwt: [["Given", "an order waiting for approval"], ["When", "the administrator changes the limits"], ["Then", "the order keeps the rules that applied when it was created, and the change is logged"]],
      },
    ],
    rules: ["Approval rules are set by the client's administrators, and changing them needs two administrators.", "The creator can never approve their own order unless single-person approval is switched on."],
    edge: ["An approver's own limit is below the amount", "An approver leaves the company mid-order", "Two approvers act at once — one approval recorded per person"],
    data: ["approvalGroup · approvalLimit · approvals[] {name, group, time} · rulesVersion"],
    nfr: ["Approval status visible to all parties within two seconds."],
    deps: ["HSBCnet entitlements"],
  },
  {
    id: "S-602",
    epic: "E6",
    persona: "sysadmin",
    want: "HSBC to enforce the approval setting we chose — two people by default, one only if we opted in",
    so: "our own internal controls apply to fund dealing, not the bank's assumptions",
    priority: "Must",
    points: 5,
    trace: "Demo · presenter control “Single-person approval”",
    context: "HSBCnet's default is that the approver must be a different person from the creator, and clients can opt into single-person approval for named users. The service must respect either choice.",
    criteria: [
      {
        name: "Default: two people",
        gwt: [["Given", "Party A uses the default setting"], ["When", "Alice submits an order"], ["Then", "she cannot approve it, and another entitled user must"]],
      },
      {
        name: "Single-person approval switched on",
        gwt: [
          ["Given", "Party A has opted into single-person approval for Alice"],
          ["When", "she submits an order within her limit"],
          ["Then", "she can submit and approve in one step, and the record shows the rule that applied"],
        ],
      },
    ],
    rules: ["Single-person approval is arranged through the relationship manager, per user, and never assumed.", "Whatever the setting, the record shows who approved and under which rule."],
    edge: ["Single-person approval on, but the amount exceeds that user's limit — a second approver is still required"],
    data: ["soleControlEnabled (per user) · appliedRule on each order"],
    deps: ["HSBCnet entitlements"],
  },
  {
    id: "S-603",
    epic: "E6",
    persona: "treasurer",
    want: "to send orders from our treasury system, already approved in our own workflow",
    so: "our dealers never re-key an order into a second system",
    priority: "Should",
    points: 8,
    trace: "Demo · scenario “From treasury system (API)”",
    context: "Large treasuries live in their own system and use the bank portal for oversight. An order that arrives already approved must still be provably genuine.",
    criteria: [
      {
        name: "Signed instruction accepted",
        gwt: [
          ["Given", "Party A's treasury system is connected with a registered certificate"],
          ["When", "it sends a signed subscription order approved in its own workflow"],
          ["Then", "HSBC verifies the signature and certificate and processes it without a separate approval in the portal"],
          ["And", "the order appears in HSBCnet marked API with the same status, timeline and contract note"],
        ],
      },
      {
        name: "Verification fails",
        gwt: [["Given", "the signature or certificate does not verify"], ["When", "the order arrives"], ["Then", "it is rejected before anything is reserved, and both sides are alerted"]],
      },
      {
        name: "Duplicate instruction",
        gwt: [["Given", "the same order reference arrives twice"], ["When", "it is processed"], ["Then", "the second is acknowledged but creates no second order"]],
      },
    ],
    rules: ["Certificates are registered in advance and expire, with warnings before they do.", "API orders face the same screening and reserve rules as portal orders."],
    edge: ["Clock skew on the client's signature", "Certificate rotated mid-day", "Connectivity lost after acceptance"],
    data: ["clientOrderRef (unique) · signature · certificateId · payloadHash · receivedAt"],
    nfr: ["Acknowledgement within two seconds.", "Replay protection through the unique order reference."],
    deps: ["Client onboarding to the API channel"],
  },
  {
    id: "S-604",
    epic: "E6",
    persona: "authoriser",
    want: "one dashboard showing every order's status and history",
    so: "I know where our money is without phoning anyone",
    priority: "Should",
    points: 3,
    trace: "Demo · Orders tab, status tracker and “Show settlement detail”",
    context: "Corporate portals show a handful of statuses. Settlement on a shared ledger makes a live step-by-step view possible — but it should be opt-in, not noise.",
    criteria: [
      {
        name: "Four clear statuses",
        gwt: [
          ["Given", "an order in progress"],
          ["Then", "the list shows one of: Pending approval, Submitted, Confirmed, Settled"],
          ["And", "a failed or queued order shows that instead, with what happens next"],
        ],
      },
      {
        name: "Detail on request",
        gwt: [
          ["Given", "an order is open"],
          ["When", "the user chooses “Show settlement detail”"],
          ["Then", "the timestamped step-by-step timeline appears, marked as a proposed experience"],
          ["And", "no step names the control that stopped an order"],
        ],
      },
    ],
    rules: ["The status vocabulary is fixed and shared across screens, statements and notifications.", "History stays available after settlement, including for unwound orders."],
    data: ["status · statusHistory[] {status, time} · settlementAsset · contractNote"],
    nfr: ["Status updates appear within two seconds of the underlying event."],
    deps: ["S-301"],
  },
  {
    id: "S-605",
    epic: "E6",
    persona: "authoriser",
    want: "to be notified on my phone and approve with a security code",
    so: "orders do not wait for me to be at my desk",
    priority: "Should",
    points: 5,
    trace: "Demo · the approver's phone, in every portal scenario",
    context: "Approvers are rarely sitting in the portal. Mobile approval with a security device is how corporate payments are already approved.",
    criteria: [
      {
        name: "Notified and approved on mobile",
        gwt: [
          ["Given", "an order needs Brian's approval"],
          ["When", "it is submitted"],
          ["Then", "his phone shows “1 order waiting for your approval” with the fund, amount, account and settlement method"],
          ["And", "approving requires his security code, and the record shows it was approved on mobile"],
        ],
      },
      {
        name: "Rejected on mobile",
        gwt: [["Given", "the same notification"], ["When", "Brian rejects"], ["Then", "the order closes with nothing reserved, and the portal shows it immediately"]],
      },
    ],
    rules: ["Mobile and portal show the same queue; acting in one clears the other within seconds.", "Approval always needs the security device, never the notification alone."],
    edge: ["Two approvers open the same order — the second sees it is already actioned", "Notification delayed or lost: the portal queue remains the source of truth"],
    data: ["notificationId · deviceId · approvalChannel (PORTAL | MOBILE)"],
    nfr: ["Notification within five seconds of submission.", "No order details in the lock-screen preview beyond the reference."],
    deps: ["HSBCnet Mobile and security device"],
  },
  {
    id: "S-606",
    epic: "E6",
    persona: "issuerops",
    want: "client orders to keep settling when stablecoin issuance is paused",
    so: "an issuer incident degrades the service instead of stopping it",
    priority: "Must",
    points: 5,
    trace: "Demo · scenario “Stablecoin paused · deposits across banks”",
    context: "Issuance can stop for good reasons: a reserve break, or an operational incident. Clients should not carry that — tokenised deposits stand by, with conventional payment behind them.",
    criteria: [
      {
        name: "Fallback to tokenised deposits",
        gwt: [
          ["Given", "issuance is paused"],
          ["When", "a new order is approved"],
          ["Then", "it settles in tokenised deposits, inside HSBC or through EnsembleTX, and the client sees no difference"],
          ["And", "the contract note records the asset that actually settled it"],
        ],
      },
      {
        name: "Orders already in flight",
        gwt: [
          ["Given", "stablecoin is already set aside for a live order"],
          ["When", "issuance is paused"],
          ["Then", "that order still settles or unwinds normally, and redemptions of existing stablecoin continue"],
        ],
      },
      {
        name: "No route available",
        gwt: [
          ["Given", "the fund does not accept tokenised deposits and the bank-to-bank window is closed"],
          ["When", "an order is approved"],
          ["Then", "it is queued for the next conventional payment window with nothing debited, and the client is told when it will settle"],
        ],
      },
    ],
    rules: [
      "Who may pause issuance, on what evidence, and what is told to clients and the HKMA, is agreed in advance and recorded.",
      "A fallback only counts if the two options do not share a failure domain; otherwise the standby is conventional payment.",
    ],
    edge: ["Pause during the valuation point", "Pause lifted mid-order — the order keeps the route it started on"],
    data: ["issuanceStatus (LIVE | PAUSED) · pausedBy · reason · routeChosen · routeReason"],
    nfr: ["The route decision is recorded on every order and visible to operations."],
    deps: ["S-103", "Tokenised deposit service"],
    notes: "Rehearsing this end to end is on the go-live readiness list.",
  },
];

export const orderFields = [
  ["orderId", "string", "Yes", "FND-2609-0001", "Unique; resending the same order never creates a second one"],
  ["fundId", "string", "Yes", "CSOP-HKD-MMF-T", "Fund and share class must accept the settlement asset"],
  ["side", "enum", "Yes", "SUBSCRIBE", "SUBSCRIBE · REDEEM"],
  ["amount", "HKD, 2 dp", "Yes", "50,000,000.00", "> 0; above the HK$100m approval limit a senior approver must also sign"],
  ["settlementAccount", "account", "Yes", "HKD ••4410", "Must belong to the ordering entity"],
  ["settlement", "enum", "No", "AUTO", "Always AUTO — HSBC chooses the settlement asset; the client never selects one"],
  ["investorWallet", "wallet id", "Yes", "held by HSBC", "On the approved-wallet list; due diligence complete"],
  ["dealingDate", "date", "Yes", "23 Sep 2026", "After the cut-off it rolls to the next dealing day, shown before the client confirms"],
  ["onRedeem", "enum", "No", "RETURN_TO_CASH", "RETURN_TO_CASH (convert back to HKD) · HOLD"],
  ["channel", "enum", "Yes", "PORTAL", "PORTAL · API (approved in the client's own system; signature verified)"],
  ["approvers", "user ids", "Yes", "a.chan, b.lau", "Per the client's approval rules; the approver must differ from the creator unless single-person approval is switched on"],
];

export const businessRules = [
  "Stablecoin is issued only against HKD received into the segregated reserve, and removed from circulation on redemption at par.",
  "Cash and fund units transfer together, or not at all.",
  "A fund accepts only the settlement assets its trustee has agreed to.",
  "Approvals follow the client's own HSBCnet rules: the approver must be a different person from the creator by default, single-person approval only by opt-in, and a more senior approver above each limit. Nothing is reserved until an order is fully approved.",
  "Tokenised deposits settle between banks only within EnsembleTX's operating hours during the pilot; the stablecoin has no such dependency.",
  "Client messages never name the control that stopped an order.",
  "Stablecoins in circulation must equal reserves held after every movement; otherwise new issuance pauses.",
];
