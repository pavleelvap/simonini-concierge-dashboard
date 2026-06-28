import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CreditCard,
  Download,
  FileInput,
  FileText,
  Gauge,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Upload,
  UserPlus,
  Users
} from "lucide-react";

type View = "overview" | "members" | "leads" | "billing" | "plans" | "member-detail";
type TierId = "founding" | "executive" | "plus";
type LeadStage =
  | "Identified"
  | "Contacted"
  | "Interested"
  | "Consult Scheduled"
  | "Verbal Yes"
  | "Contract Sent"
  | "Converted"
  | "Lost";
type DocumentCategory = "Consent Form" | "Membership Agreement" | "Payment Authorization" | "Other";
type ProviderSpecialty =
  | "Primary Care"
  | "Cardiology"
  | "Dermatology"
  | "Endocrinology"
  | "Gastroenterology"
  | "Mental Health"
  | "Nutrition"
  | "Physical Therapy"
  | "Specialist Other";

type MembershipTier = {
  id: TierId;
  name: string;
  annualPrice: number;
  cap: number | null;
  description: string;
  serviceIntensity: number;
  color: string;
};

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  source: string;
  referredBy: string;
  targetTier: TierId;
  stage: LeadStage;
  probability: number;
  expectedCloseMonth: string;
  notes: string;
  owner: string;
  lastContactDate: string;
};

type ActivityEntry = {
  id: string;
  date: string;
  type: string;
  note: string;
  owner: string;
};

type DocumentEntry = {
  id: string;
  category: DocumentCategory;
  fileName: string;
  uploadedAt: string;
  sizeKb: number;
  status: "Received" | "Needs Review" | "Signed";
};

type PaymentProfile = {
  processor: string;
  tokenReference: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expiration: string;
  billingZip: string;
  status: "Not Collected" | "On File" | "Expired" | "Needs Update";
};

type EnrollmentStatus = "Invite Sent" | "Agreement Pending" | "Payment Pending" | "Complete" | "Needs Attention";

type InvoiceStatus = "Draft" | "Open" | "Paid" | "Failed" | "Overdue" | "Void";

type Invoice = {
  id: string;
  description: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  type: "Membership" | "One-Time" | "Adjustment";
};

type PlanChange = {
  id: string;
  fromTier: TierId;
  toTier: TierId;
  effectiveDate: string;
  reason: string;
};

type PointOfContact = {
  name: string;
  phone: string;
  email: string;
};

type CareTeamProvider = {
  id: string;
  specialty: ProviderSpecialty;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
};

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  pointOfContact: PointOfContact;
  referredBy: string;
  tier: TierId;
  startDate: string;
  renewalDate: string;
  annualFee: number;
  active: boolean;
  enrollmentStatus: EnrollmentStatus;
  invoices: Invoice[];
  scheduledPlanChange: PlanChange | null;
  activityHistory: ActivityEntry[];
  documents: DocumentEntry[];
  paymentProfile: PaymentProfile;
  careTeam: CareTeamProvider[];
};

type ScenarioAssumptions = {
  launchTarget: number;
  monthlyConversionRate: number;
  churnRate: number;
  rampPacing: number;
  foundingMix: number;
  executiveMix: number;
  plusMix: number;
};

type DashboardState = {
  leads: Lead[];
  members: Member[];
  assumptions: ScenarioAssumptions;
};

type MemberForm = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  referredBy: string;
  tier: TierId;
  startDate: string;
  active: boolean;
};

type LeadForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  source: string;
  referredBy: string;
  targetTier: TierId;
  stage: LeadStage;
  expectedCloseMonth: string;
  notes: string;
  owner: string;
};

type ProviderForm = {
  specialty: ProviderSpecialty;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
};

const tiers: MembershipTier[] = [
  {
    id: "founding",
    name: "Founding Concierge",
    annualPrice: 15000,
    cap: 20,
    description: "Limited founding cohort to validate conversion and operational fit.",
    serviceIntensity: 1,
    color: "#b8874f"
  },
  {
    id: "executive",
    name: "Executive Concierge",
    annualPrice: 20000,
    cap: null,
    description: "Core concierge access, coordination, continuity, and executive patient experience.",
    serviceIntensity: 1.35,
    color: "#0b2239"
  },
  {
    id: "plus",
    name: "Executive Plus",
    annualPrice: 30000,
    cap: 15,
    description: "Maximum-touch access for patients requiring the most coordination and physician attention.",
    serviceIntensity: 2.2,
    color: "#4f718f"
  }
];

const stageProbabilities: Record<LeadStage, number> = {
  Identified: 0.1,
  Contacted: 0.2,
  Interested: 0.35,
  "Consult Scheduled": 0.55,
  "Verbal Yes": 0.75,
  "Contract Sent": 0.9,
  Converted: 1,
  Lost: 0
};

const stageOrder = Object.keys(stageProbabilities) as LeadStage[];
const documentCategories: DocumentCategory[] = ["Consent Form", "Membership Agreement", "Payment Authorization", "Other"];
const specialties: ProviderSpecialty[] = [
  "Primary Care",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Mental Health",
  "Nutrition",
  "Physical Therapy",
  "Specialist Other"
];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US");

const blankPaymentProfile: PaymentProfile = {
  processor: "",
  tokenReference: "",
  cardholderName: "",
  brand: "",
  last4: "",
  expiration: "",
  billingZip: "",
  status: "Not Collected"
};

const blankLead: LeadForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  source: "Existing patient panel",
  referredBy: "",
  targetTier: "executive",
  stage: "Identified",
  expectedCloseMonth: "2026-09",
  notes: "",
  owner: "Consultant"
};

const blankMember: MemberForm = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  phone: "",
  pocName: "",
  pocPhone: "",
  pocEmail: "",
  referredBy: "",
  tier: "executive",
  startDate: "2026-08-01",
  active: true
};

const blankProvider: ProviderForm = {
  specialty: "Primary Care",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: ""
};

const demoState: DashboardState = {
  assumptions: {
    launchTarget: 50,
    monthlyConversionRate: 8,
    churnRate: 3,
    rampPacing: 12,
    foundingMix: 30,
    executiveMix: 55,
    plusMix: 15
  },
  members: [
    makeMember("M-001", "Avery", "Stone", "avery.stone@example.com", "100 Ocean Ave, Newport Beach, CA", "(949) 555-0101", "Kelsey Stone", "(949) 555-1101", "kelsey.stone@example.com", "Dr. Simonini", "founding", "2026-08-01", true),
    makeMember("M-002", "Morgan", "Vale", "morgan.vale@example.com", "18 Harbor Way, Irvine, CA", "(949) 555-0102", "Dana Vale", "(949) 555-1102", "dana.vale@example.com", "Existing patient panel", "founding", "2026-08-01", true),
    makeMember("M-003", "Jordan", "Lane", "jordan.lane@example.com", "42 Mesa Drive, Costa Mesa, CA", "(949) 555-0103", "Robin Lane", "(949) 555-1103", "robin.lane@example.com", "Physician referral", "executive", "2026-08-15", true),
    makeMember("M-004", "Taylor", "Reed", "taylor.reed@example.com", "7 Palm Court, Laguna Beach, CA", "(949) 555-0104", "Alex Reed", "(949) 555-1104", "alex.reed@example.com", "Family office", "plus", "2026-09-01", false)
  ],
  leads: [
    makeLead("L-014", "Casey", "North", "(949) 555-0201", "casey.north@example.com", "Physician referral", "Dr. Allen", "plus", "Contract Sent", "2026-08", "High-touch candidate"),
    makeLead("L-022", "Riley", "Brooks", "(949) 555-0202", "riley.brooks@example.com", "Existing patient panel", "Practice", "executive", "Verbal Yes", "2026-08", "Needs renewal language"),
    makeLead("L-031", "Quinn", "Hayes", "(949) 555-0203", "quinn.hayes@example.com", "Existing patient panel", "Dr. Simonini", "founding", "Consult Scheduled", "2026-09", "Founding cohort fit"),
    makeLead("L-047", "Parker", "Moore", "(949) 555-0204", "parker.moore@example.com", "Community relationship", "Board member", "executive", "Interested", "2026-10", "Compare tiers")
  ]
};

function makeLead(
  id: string,
  firstName: string,
  lastName: string,
  phone: string,
  email: string,
  source: string,
  referredBy: string,
  targetTier: TierId,
  stage: LeadStage,
  expectedCloseMonth: string,
  notes: string
): Lead {
  return {
    id,
    firstName,
    lastName,
    phone,
    email,
    address: "",
    source,
    referredBy,
    targetTier,
    stage,
    probability: stageProbabilities[stage],
    expectedCloseMonth,
    notes,
    owner: "Consultant",
    lastContactDate: "2026-06-28"
  };
}

function makeMember(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  address: string,
  phone: string,
  pocName: string,
  pocPhone: string,
  pocEmail: string,
  referredBy: string,
  tier: TierId,
  startDate: string,
  active: boolean
): Member {
  const selectedTier = getTier(tier);
  return {
    id,
    firstName,
    lastName,
    email,
    address,
    phone,
    pointOfContact: { name: pocName, phone: pocPhone, email: pocEmail },
    referredBy,
    tier,
    startDate,
    renewalDate: addYear(startDate),
    annualFee: selectedTier.annualPrice,
    active,
    enrollmentStatus: active ? "Complete" : "Agreement Pending",
    invoices: [
      {
        id: `${id}-INV1`,
        description: `${selectedTier.name} annual membership`,
        dueDate: startDate,
        amount: selectedTier.annualPrice,
        status: active ? "Paid" : "Open",
        type: "Membership"
      }
    ],
    scheduledPlanChange: null,
    activityHistory: [
      {
        id: `${id}-A1`,
        date: "2026-06-28",
        type: "Launch note",
        note: active ? "Member profile created for launch planning." : "Candidate record staged as inactive pending agreement.",
        owner: "Consultant"
      }
    ],
    documents: [],
    paymentProfile: { ...blankPaymentProfile },
    careTeam: [
      {
        id: `${id}-P1`,
        specialty: "Primary Care",
        firstName: "Rico",
        lastName: "Simonini",
        phone: "(949) 555-0001",
        email: "office@example.com",
        address: "Practice address pending"
      }
    ]
  };
}

function getTier(id: TierId) {
  return tiers.find((tier) => tier.id === id)!;
}

function addYear(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function nextId(prefix: string, existing: Array<{ id: string }>) {
  const max = existing.reduce((highest, item) => {
    const numeric = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function tierCounts(members: Member[]) {
  return tiers.map((tier) => ({
    ...tier,
    members: members.filter((member) => member.active && member.tier === tier.id).length
  }));
}

function clampMembership(tierId: TierId, count: number, current: Record<TierId, number>) {
  const tier = getTier(tierId);
  const totalNow = current.founding + current.executive + current.plus;
  const capacityLeft = Math.max(0, 200 - totalNow);
  const tierLeft = tier.cap === null ? capacityLeft : Math.max(0, tier.cap - current[tierId]);
  return Math.max(0, Math.min(count, capacityLeft, tierLeft));
}

function buildForecast(state: DashboardState, scenario: "downside" | "base" | "upside") {
  const scenarioFactor = scenario === "downside" ? 0.72 : scenario === "upside" ? 1.25 : 1;
  const activeCounts = tierCounts(state.members).reduce(
    (acc, item) => ({ ...acc, [item.id]: item.members }),
    { founding: 0, executive: 0, plus: 0 } as Record<TierId, number>
  );
  const rows = [];
  let counts = { ...activeCounts };
  const mix = {
    founding: state.assumptions.foundingMix / 100,
    executive: state.assumptions.executiveMix / 100,
    plus: state.assumptions.plusMix / 100
  };

  for (let month = 1; month <= 24; month += 1) {
    const remaining = Math.max(0, 200 - counts.founding - counts.executive - counts.plus);
    const paceBoost = month <= state.assumptions.rampPacing ? 1.12 : 0.74;
    const plannedNew = Math.min(remaining, Math.round(state.assumptions.monthlyConversionRate * scenarioFactor * paceBoost));
    const plusNew = clampMembership("plus", Math.round(plannedNew * mix.plus), counts);
    counts.plus += plusNew;
    const foundingNew = clampMembership("founding", Math.round(plannedNew * mix.founding), counts);
    counts.founding += foundingNew;
    const executiveNew = clampMembership("executive", plannedNew - plusNew - foundingNew, counts);
    counts.executive += executiveNew;
    const churned = month % 12 === 0 ? Math.round((counts.founding + counts.executive + counts.plus) * (state.assumptions.churnRate / 100)) : 0;

    if (churned > 0) {
      const executiveChurn = Math.min(counts.executive, Math.round(churned * 0.7));
      const foundingChurn = Math.min(counts.founding, Math.round(churned * 0.2));
      const plusChurn = Math.min(counts.plus, churned - executiveChurn - foundingChurn);
      counts.executive -= executiveChurn;
      counts.founding -= foundingChurn;
      counts.plus -= plusChurn;
    }

    rows.push({
      month: `M${month}`,
      newMembers: plannedNew,
      churned,
      cumulativeMembers: counts.founding + counts.executive + counts.plus,
      totalRevenue: counts.founding * 15000 + counts.executive * 20000 + counts.plus * 30000
    });
  }

  return rows;
}

function exportBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [state, setState] = useState<DashboardState>(demoState);
  const [view, setView] = useState<View>("overview");
  const [scenario, setScenario] = useState<"downside" | "base" | "upside">("base");
  const [leadForm, setLeadForm] = useState<LeadForm>(blankLead);
  const [memberForm, setMemberForm] = useState<MemberForm>(blankMember);
  const [selectedMemberId, setSelectedMemberId] = useState(demoState.members[0]?.id ?? "");
  const [activityDraft, setActivityDraft] = useState({ type: "Follow-up", note: "", owner: "Consultant" });
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>("Consent Form");
  const [providerForm, setProviderForm] = useState<ProviderForm>(blankProvider);
  const [chargeDraft, setChargeDraft] = useState({ memberId: demoState.members[0]?.id ?? "", description: "Administrative fee", amount: "250", dueDate: "2026-08-01" });
  const [planChangeDraft, setPlanChangeDraft] = useState({ memberId: demoState.members[0]?.id ?? "", toTier: "executive" as TierId, effectiveDate: "2026-09-01", reason: "Tier optimization" });
  const jsonInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);

  const activeMembers = state.members.filter((member) => member.active);
  const totalRevenue = activeMembers.reduce((sum, member) => sum + member.annualFee, 0);
  const counts = tierCounts(state.members);
  const weightedAverage = activeMembers.length ? totalRevenue / activeMembers.length : 0;
  const expectedPipeline = state.leads.reduce((sum, lead) => sum + getTier(lead.targetTier).annualPrice * lead.probability, 0);
  const convertedLeads = state.leads.filter((lead) => lead.stage === "Converted").length;
  const forecast = useMemo(() => buildForecast(state, scenario), [state, scenario]);
  const capacityUsed = Math.round((activeMembers.length / 200) * 100);
  const serviceLoad = counts.reduce((sum, tier) => sum + tier.members * tier.serviceIntensity, 0);
  const launchProgress = Math.min(100, Math.round(((activeMembers.length + convertedLeads) / state.assumptions.launchTarget) * 100));
  const selectedMember = state.members.find((member) => member.id === selectedMemberId) ?? state.members[0];
  const today = new Date().toISOString().slice(0, 10);
  const allInvoices = state.members.flatMap((member) =>
    member.invoices.map((invoice) => ({
      ...invoice,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      tier: member.tier
    }))
  );
  const openInvoices = allInvoices.filter((invoice) => !["Paid", "Void"].includes(invoice.status));
  const overdueInvoices = openInvoices.filter((invoice) => invoice.status === "Overdue" || invoice.dueDate < today);
  const outstandingBalance = openInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const failedInvoices = allInvoices.filter((invoice) => invoice.status === "Failed");
  const incompleteEnrollments = state.members.filter((member) => member.enrollmentStatus !== "Complete");
  const paymentAttention = state.members.filter((member) => ["Expired", "Needs Update", "Not Collected"].includes(member.paymentProfile.status));
  const scheduledChanges = state.members.filter((member) => member.scheduledPlanChange);

  const funnelData = stageOrder.map((stage) => {
    const leads = state.leads.filter((lead) => lead.stage === stage);
    return {
      stage,
      leads: leads.length,
      expectedRevenue: leads.reduce((sum, lead) => sum + getTier(lead.targetTier).annualPrice * lead.probability, 0)
    };
  });

  function navigate(nextView: View, memberId?: string) {
    if (memberId) setSelectedMemberId(memberId);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDemo() {
    setState(demoState);
    setSelectedMemberId(demoState.members[0]?.id ?? "");
    setView("overview");
  }

  function addLead() {
    const lead: Lead = {
      id: nextId("L", state.leads),
      ...leadForm,
      probability: stageProbabilities[leadForm.stage],
      lastContactDate: new Date().toISOString().slice(0, 10)
    };
    setState((current) => ({ ...current, leads: [lead, ...current.leads] }));
    setLeadForm(blankLead);
  }

  function addMember() {
    const tier = getTier(memberForm.tier);
    const member: Member = {
      id: nextId("M", state.members),
      firstName: memberForm.firstName,
      lastName: memberForm.lastName,
      email: memberForm.email,
      address: memberForm.address,
      phone: memberForm.phone,
      pointOfContact: { name: memberForm.pocName, phone: memberForm.pocPhone, email: memberForm.pocEmail },
      referredBy: memberForm.referredBy,
      tier: memberForm.tier,
      startDate: memberForm.startDate,
      renewalDate: addYear(memberForm.startDate),
      annualFee: tier.annualPrice,
      active: memberForm.active,
      enrollmentStatus: memberForm.active ? "Complete" : "Agreement Pending",
      invoices: [
        {
          id: crypto.randomUUID(),
          description: `${tier.name} annual membership`,
          dueDate: memberForm.startDate,
          amount: tier.annualPrice,
          status: memberForm.active ? "Paid" : "Open",
          type: "Membership"
        }
      ],
      scheduledPlanChange: null,
      activityHistory: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().slice(0, 10),
          type: "Member created",
          note: "Manual sandbox member record created.",
          owner: "Consultant"
        }
      ],
      documents: [],
      paymentProfile: { ...blankPaymentProfile },
      careTeam: []
    };
    setState((current) => ({ ...current, members: [member, ...current.members] }));
    setSelectedMemberId(member.id);
    setMemberForm(blankMember);
    setView("member-detail");
  }

  function convertLeadToMember(lead: Lead) {
    const tier = getTier(lead.targetTier);
    const member: Member = {
      id: nextId("M", state.members),
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      address: lead.address,
      phone: lead.phone,
      pointOfContact: { name: "", phone: "", email: "" },
      referredBy: lead.referredBy,
      tier: lead.targetTier,
      startDate: new Date().toISOString().slice(0, 10),
      renewalDate: addYear(new Date().toISOString().slice(0, 10)),
      annualFee: tier.annualPrice,
      active: true,
      enrollmentStatus: "Payment Pending",
      invoices: [
        {
          id: crypto.randomUUID(),
          description: `${tier.name} annual membership`,
          dueDate: new Date().toISOString().slice(0, 10),
          amount: tier.annualPrice,
          status: "Open",
          type: "Membership"
        }
      ],
      scheduledPlanChange: null,
      activityHistory: [{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), type: "Converted from lead", note: `${lead.id} converted from ${lead.stage}.`, owner: "Consultant" }],
      documents: [],
      paymentProfile: { ...blankPaymentProfile },
      careTeam: []
    };
    setState((current) => ({
      ...current,
      members: [member, ...current.members],
      leads: current.leads.map((item) => (item.id === lead.id ? { ...item, stage: "Converted", probability: 1 } : item))
    }));
    setSelectedMemberId(member.id);
    setView("member-detail");
  }

  function updateAssumption(key: keyof ScenarioAssumptions, value: number) {
    setState((current) => ({ ...current, assumptions: { ...current.assumptions, [key]: value } }));
  }

  function updateLead(id: string, key: keyof Lead, value: string | number) {
    setState((current) => ({
      ...current,
      leads: current.leads.map((lead) => {
        if (lead.id !== id) return lead;
        const next = { ...lead, [key]: value } as Lead;
        if (key === "stage") next.probability = stageProbabilities[value as LeadStage];
        return next;
      })
    }));
  }

  function updateMember(id: string, key: keyof Member, value: string | boolean) {
    setState((current) => ({
      ...current,
      members: current.members.map((member) => {
        if (member.id !== id) return member;
        const updated = { ...member, [key]: value };
        if (key === "tier") updated.annualFee = getTier(value as TierId).annualPrice;
        if (key === "startDate") updated.renewalDate = addYear(String(value));
        return updated as Member;
      })
    }));
  }

  function updatePoc(memberId: string, key: keyof PointOfContact, value: string) {
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === memberId ? { ...member, pointOfContact: { ...member.pointOfContact, [key]: value } } : member
      )
    }));
  }

  function updatePayment(memberId: string, key: keyof PaymentProfile, value: string) {
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === memberId ? { ...member, paymentProfile: { ...member.paymentProfile, [key]: value } } : member
      )
    }));
  }

  function updateInvoiceStatus(memberId: string, invoiceId: string, status: InvoiceStatus) {
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === memberId
          ? { ...member, invoices: member.invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status } : invoice)) }
          : member
      )
    }));
  }

  function addOneTimeCharge() {
    const amount = Number(chargeDraft.amount);
    if (!chargeDraft.memberId || !chargeDraft.description.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === chargeDraft.memberId
          ? {
              ...member,
              invoices: [
                {
                  id: crypto.randomUUID(),
                  description: chargeDraft.description,
                  dueDate: chargeDraft.dueDate,
                  amount,
                  status: "Open",
                  type: "One-Time"
                },
                ...member.invoices
              ]
            }
          : member
      )
    }));
    setChargeDraft({ ...chargeDraft, description: "Administrative fee", amount: "250" });
  }

  function schedulePlanChange() {
    const member = state.members.find((item) => item.id === planChangeDraft.memberId);
    if (!member) return;
    const change: PlanChange = {
      id: crypto.randomUUID(),
      fromTier: member.tier,
      toTier: planChangeDraft.toTier,
      effectiveDate: planChangeDraft.effectiveDate,
      reason: planChangeDraft.reason
    };
    setState((current) => ({
      ...current,
      members: current.members.map((item) => (item.id === member.id ? { ...item, scheduledPlanChange: change } : item))
    }));
  }

  function addActivity(memberId: string) {
    if (!activityDraft.note.trim()) return;
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              activityHistory: [{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...activityDraft }, ...member.activityHistory]
            }
          : member
      )
    }));
    setActivityDraft({ type: "Follow-up", note: "", owner: "Consultant" });
  }

  function addDocuments(memberId: string, files: FileList | null) {
    if (!files?.length) return;
    const documents: DocumentEntry[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      category: documentCategory,
      fileName: file.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      status: "Needs Review"
    }));
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === memberId ? { ...member, documents: [...documents, ...member.documents] } : member
      )
    }));
  }

  function addProvider(memberId: string) {
    if (!providerForm.firstName.trim() || !providerForm.lastName.trim()) return;
    const provider: CareTeamProvider = { id: crypto.randomUUID(), ...providerForm };
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === memberId ? { ...member, careTeam: [provider, ...member.careTeam] } : member
      )
    }));
    setProviderForm(blankProvider);
  }

  function handleJsonImport(file: File) {
    file.text().then((text) => {
      const imported = JSON.parse(text) as DashboardState;
      setState(imported);
      setSelectedMemberId(imported.members[0]?.id ?? "");
    });
  }

  function handleCsvImport(file: File) {
    file.text().then((text) => {
      const [headerLine, ...lines] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(",").map((item) => item.trim());
      const leads = lines.filter(Boolean).map((line, index) => {
        const values = line.split(",").map((item) => item.replace(/^"|"$/g, "").trim());
        const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
        const stage = stageOrder.includes(row.stage as LeadStage) ? (row.stage as LeadStage) : "Identified";
        const targetTier = tiers.some((tier) => tier.id === row.targetTier) ? (row.targetTier as TierId) : "executive";
        return {
          id: row.id || `L-${String(index + 1).padStart(3, "0")}`,
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          phone: row.phone || "",
          email: row.email || "",
          address: row.address || "",
          source: row.source || "Manual import",
          referredBy: row.referredBy || "",
          targetTier,
          stage,
          probability: Number(row.probability) || stageProbabilities[stage],
          expectedCloseMonth: row.expectedCloseMonth || "2026-09",
          notes: row.notes || "",
          owner: row.owner || "Consultant",
          lastContactDate: row.lastContactDate || "2026-06-28"
        };
      });
      setState((current) => ({ ...current, leads }));
    });
  }

  function exportLeadsCsv() {
    const header = "id,firstName,lastName,phone,email,address,source,referredBy,targetTier,stage,probability,expectedCloseMonth,notes,owner,lastContactDate";
    const rows = state.leads.map((lead) =>
      [lead.id, lead.firstName, lead.lastName, lead.phone, lead.email, lead.address, lead.source, lead.referredBy, lead.targetTier, lead.stage, lead.probability, lead.expectedCloseMonth, lead.notes, lead.owner, lead.lastContactDate]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    );
    exportBlob("simonini-leads.csv", [header, ...rows].join("\n"), "text/csv");
  }

  return (
    <main>
      <header className="app-header crm-header">
        <section>
          <p className="eyebrow">Concierge CRM Sandbox</p>
          <h1>Dr. Simonini CFO Dashboard</h1>
          <p className="subhead">
            Hint Core and Salesforce-inspired workspace for executive financials, members, care teams, documents, and launch pipeline.
          </p>
        </section>
        <nav className="toolbar" aria-label="Dashboard actions">
          <button type="button" onClick={resetDemo} title="Reset demo data"><RefreshCcw size={17} /></button>
          <button type="button" onClick={() => exportBlob("simonini-dashboard.json", JSON.stringify(state, null, 2), "application/json")} title="Export sandbox JSON"><Download size={17} /></button>
          <button type="button" onClick={() => jsonInput.current?.click()} title="Import sandbox JSON"><Upload size={17} /></button>
          <button type="button" onClick={exportLeadsCsv} title="Export leads CSV"><FileInput size={17} /></button>
          <button type="button" onClick={() => csvInput.current?.click()} title="Import leads CSV"><Upload size={17} />CSV</button>
          <input ref={jsonInput} hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && handleJsonImport(event.target.files[0])} />
          <input ref={csvInput} hidden type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && handleCsvImport(event.target.files[0])} />
        </nav>
      </header>

      <nav className="crm-nav" aria-label="Primary navigation">
        <button className={view === "overview" ? "active" : ""} type="button" onClick={() => navigate("overview")}><BarChart3 size={17} /> Overview</button>
        <button className={view === "members" || view === "member-detail" ? "active" : ""} type="button" onClick={() => navigate("members")}><Users size={17} /> Members</button>
        <button className={view === "leads" ? "active" : ""} type="button" onClick={() => navigate("leads")}><UserPlus size={17} /> Leads</button>
        <button className={view === "billing" ? "active" : ""} type="button" onClick={() => navigate("billing")}><CreditCard size={17} /> Billing</button>
        <button className={view === "plans" ? "active" : ""} type="button" onClick={() => navigate("plans")}><FileText size={17} /> Plans</button>
      </nav>

      <section className="warning sticky-warning">
        <AlertTriangle size={18} />
        Sandbox only. Track processor token/reference and last four digits only; do not store full credit card numbers or clinical details in this version.
      </section>

      {view === "overview" && (
        <>
          <section className="kpi-grid" aria-label="Executive overview">
            <Kpi title="Active Members" value={`${activeMembers.length}/200`} detail={`${capacityUsed}% of practice cap`} icon={<Gauge size={18} />} />
            <Kpi title="Annual Run-Rate" value={money.format(totalRevenue)} detail={`${money.format(totalRevenue / 12)} monthly equivalent`} icon={<BarChart3 size={18} />} />
            <Kpi title="Expected Pipeline" value={money.format(expectedPipeline)} detail={`${state.leads.length} leads tracked`} icon={<Activity size={18} />} />
            <Kpi title="Launch Progress" value={`${launchProgress}%`} detail={`Target ${state.assumptions.launchTarget} launch members`} icon={<CalendarClock size={18} />} />
            <Kpi title="Open A/R" value={money.format(outstandingBalance)} detail={`${overdueInvoices.length} overdue or aging invoices`} icon={<CreditCard size={18} />} />
            <Kpi title="Enrollment Queue" value={`${incompleteEnrollments.length}`} detail={`${paymentAttention.length} payment sources need attention`} icon={<FileText size={18} />} />
          </section>

          <section className="quick-actions">
            <button type="button" onClick={() => navigate("members")}><Users size={19} /> Members</button>
            <button type="button" onClick={() => navigate("leads")}><UserPlus size={19} /> Leads</button>
            <button type="button" onClick={() => navigate("billing")}><CreditCard size={19} /> Billing</button>
            <button type="button" onClick={() => navigate("plans")}><FileText size={19} /> Plans</button>
            <button type="button" onClick={() => selectedMember && navigate("member-detail", selectedMember.id)}><HeartPulse size={19} /> Care Team</button>
          </section>

          <section className="control-band">
            <div className="section-title"><p>Scenario Controls</p><h2>Launch assumptions</h2></div>
            <NumberInput label="Launch target" value={state.assumptions.launchTarget} min={20} max={50} onChange={(value) => updateAssumption("launchTarget", value)} />
            <NumberInput label="Monthly conversions" value={state.assumptions.monthlyConversionRate} min={1} max={25} onChange={(value) => updateAssumption("monthlyConversionRate", value)} />
            <NumberInput label="Annual churn %" value={state.assumptions.churnRate} min={0} max={20} onChange={(value) => updateAssumption("churnRate", value)} />
            <NumberInput label="Ramp months" value={state.assumptions.rampPacing} min={3} max={24} onChange={(value) => updateAssumption("rampPacing", value)} />
            <div className="segmented" aria-label="Forecast scenario">
              {(["downside", "base", "upside"] as const).map((item) => (
                <button key={item} className={scenario === item ? "active" : ""} type="button" onClick={() => setScenario(item)}>{item}</button>
              ))}
            </div>
          </section>

          <section className="grid two">
            <Panel title="24-Month Forecast" kicker="Base, upside, and downside scenario modeling">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9d3ca" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => money.format(Number(value))} />
                  <Area type="monotone" dataKey="totalRevenue" name="Annual run-rate" stroke="#0b2239" fill="#d8e3ea" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Tier Economics" kicker={`Weighted average fee ${money.format(weightedAverage)}`}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={counts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9d3ca" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value / 1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value, name) => (name === "annualPrice" ? money.format(Number(value)) : number.format(Number(value)))} />
                  <Bar yAxisId="left" dataKey="members" name="Members" radius={[5, 5, 0, 0]}>
                    {counts.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="annualPrice" name="Annual price" stroke="#a66f3d" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>
          </section>

          <section className="grid two uneven">
            <Panel title="Pipeline by Stage" kicker="Expected value by funnel stage">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9d3ca" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="stage" width={115} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "expectedRevenue" ? money.format(Number(value)) : number.format(Number(value)))} />
                  <Legend />
                  <Bar dataKey="leads" name="Leads" fill="#0b2239" radius={[0, 5, 5, 0]} />
                  <Bar dataKey="expectedRevenue" name="Expected $" fill="#b8874f" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Capacity & Service Load" kicker="Membership cap and physician intensity">
              <div className="capacity-stack">
                <Progress label="Practice cap" value={activeMembers.length} max={200} />
                <Progress label="Executive Plus cap" value={counts.find((tier) => tier.id === "plus")?.members ?? 0} max={15} />
                <Progress label="Founding cohort" value={counts.find((tier) => tier.id === "founding")?.members ?? 0} max={20} />
                <Progress label="Service load index" value={Math.round(serviceLoad)} max={260} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={counts} dataKey="members" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {counts.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </section>
        </>
      )}

      {view === "members" && (
        <>
          <section className="grid two">
            <Panel title="Add New Member" kicker="Manual member record">
              <MemberFormFields memberForm={memberForm} setMemberForm={setMemberForm} />
              <button className="primary-action" type="button" onClick={addMember}><UserPlus size={17} /> Add member</button>
            </Panel>
            <Panel title="Member Directory" kicker="Click a member to open their page">
              <div className="member-card-grid">
                {state.members.map((member) => (
                  <button key={member.id} className="crm-member-card" type="button" onClick={() => navigate("member-detail", member.id)}>
                    <span className={member.active ? "status-dot active" : "status-dot inactive"} />
                    <strong>{member.firstName} {member.lastName}</strong>
                    <small>{getTier(member.tier).name}</small>
                    <span>{member.phone}</span>
                    <span>{member.email}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </section>
        </>
      )}

      {view === "member-detail" && selectedMember && (
        <MemberDetail
          member={selectedMember}
          documentCategory={documentCategory}
          setDocumentCategory={setDocumentCategory}
          documentInput={documentInput}
          updateMember={updateMember}
          updatePoc={updatePoc}
          updatePayment={updatePayment}
          addDocuments={addDocuments}
          activityDraft={activityDraft}
          setActivityDraft={setActivityDraft}
          addActivity={addActivity}
          providerForm={providerForm}
          setProviderForm={setProviderForm}
          addProvider={addProvider}
          navigate={navigate}
        />
      )}

      {view === "billing" && (
        <>
          <section className="kpi-grid">
            <Kpi title="Open Balance" value={money.format(outstandingBalance)} detail={`${openInvoices.length} open invoices`} icon={<CreditCard size={18} />} />
            <Kpi title="Overdue" value={money.format(overdueInvoices.reduce((sum, invoice) => sum + invoice.amount, 0))} detail={`${overdueInvoices.length} invoices need follow-up`} icon={<AlertTriangle size={18} />} />
            <Kpi title="Failed Charges" value={`${failedInvoices.length}`} detail="Retry or update payment source" icon={<RefreshCcw size={18} />} />
            <Kpi title="Payment Health" value={`${paymentAttention.length}`} detail="Members missing or needing card update" icon={<Gauge size={18} />} />
          </section>

          <section className="grid two">
            <Panel title="Create One-Time Charge" kicker="Ancillary fees, setup charges, and adjustments">
              <div className="form-grid">
                <SelectInput label="Member" value={chargeDraft.memberId} onChange={(value) => setChargeDraft({ ...chargeDraft, memberId: value })} options={state.members.map((member) => ({ value: member.id, label: `${member.firstName} ${member.lastName}` }))} />
                <TextInput label="Description" value={chargeDraft.description} onChange={(value) => setChargeDraft({ ...chargeDraft, description: value })} />
                <TextInput label="Amount" value={chargeDraft.amount} onChange={(value) => setChargeDraft({ ...chargeDraft, amount: value.replace(/[^\d.]/g, "") })} />
                <TextInput label="Due date" type="date" value={chargeDraft.dueDate} onChange={(value) => setChargeDraft({ ...chargeDraft, dueDate: value })} />
              </div>
              <button className="primary-action" type="button" onClick={addOneTimeCharge}><Plus size={17} /> Add charge</button>
            </Panel>

            <Panel title="Practice Pulse" kicker="Hint-style operating alerts for launch discipline">
              <div className="pulse-list">
                <PulseItem label="Incomplete enrollments" value={incompleteEnrollments.length} detail="Send agreement/payment reminders before launch." />
                <PulseItem label="Payment sources needing attention" value={paymentAttention.length} detail="Collect processor token or refresh expired card metadata." />
                <PulseItem label="Scheduled plan changes" value={scheduledChanges.length} detail="Review future tier upgrades/downgrades before the effective date." />
                <PulseItem label="Overdue invoices" value={overdueInvoices.length} detail="Trigger collection follow-up and document the outreach." />
              </div>
            </Panel>
          </section>

          <section className="grid two">
            <Panel title="Invoice Worklist" kicker="Membership charges, failed payments, and collections">
              <div className="invoice-list">
                {allInvoices.map((invoice) => (
                  <article key={`${invoice.memberId}-${invoice.id}`} className="invoice-row">
                    <div>
                      <strong>{invoice.memberName}</strong>
                      <span>{invoice.description}</span>
                      <small>{invoice.type} - due {invoice.dueDate}</small>
                    </div>
                    <b>{money.format(invoice.amount)}</b>
                    <select value={invoice.status} onChange={(event) => updateInvoiceStatus(invoice.memberId, invoice.id, event.target.value as InvoiceStatus)}>
                      {["Draft", "Open", "Paid", "Failed", "Overdue", "Void"].map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Payment Source Health" kicker="Card-on-file status without storing full card numbers">
              <div className="invoice-list">
                {state.members.map((member) => (
                  <article key={member.id} className="invoice-row">
                    <div>
                      <strong>{member.firstName} {member.lastName}</strong>
                      <span>{member.paymentProfile.status}</span>
                      <small>{member.paymentProfile.processor || "No processor"} {member.paymentProfile.last4 ? `- **** ${member.paymentProfile.last4}` : ""}</small>
                    </div>
                    <b>{getTier(member.tier).name}</b>
                    <button className="text-button" type="button" onClick={() => navigate("member-detail", member.id)}>Open</button>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        </>
      )}

      {view === "plans" && (
        <>
          <section className="grid three">
            {tiers.map((tier) => {
              const enrolled = state.members.filter((member) => member.active && member.tier === tier.id).length;
              const cap = tier.cap ?? 200;
              return (
                <article className="tier-card" key={tier.id}>
                  <div className="tier-rule" style={{ background: tier.color }} />
                  <h3>{tier.name}</h3>
                  <strong>{money.format(tier.annualPrice)}/year</strong>
                  <p>{tier.description}</p>
                  <div className="meter"><span style={{ width: `${Math.min(100, Math.round((enrolled / cap) * 100))}%`, background: tier.color }} /></div>
                  <footer><span>{enrolled} enrolled</span><span>{tier.cap ? `${tier.cap - enrolled} seats left` : "Shared 200 cap"}</span><span>{money.format(enrolled * tier.annualPrice)}</span></footer>
                </article>
              );
            })}
          </section>

          <section className="grid two">
            <Panel title="Schedule Future Plan Change" kicker="Plan upgrades/downgrades with effective dates">
              <div className="form-grid">
                <SelectInput label="Member" value={planChangeDraft.memberId} onChange={(value) => setPlanChangeDraft({ ...planChangeDraft, memberId: value })} options={state.members.map((member) => ({ value: member.id, label: `${member.firstName} ${member.lastName}` }))} />
                <SelectInput label="New tier" value={planChangeDraft.toTier} onChange={(value) => setPlanChangeDraft({ ...planChangeDraft, toTier: value as TierId })} options={tiers.map((tier) => ({ value: tier.id, label: tier.name }))} />
                <TextInput label="Effective date" type="date" value={planChangeDraft.effectiveDate} onChange={(value) => setPlanChangeDraft({ ...planChangeDraft, effectiveDate: value })} />
                <TextInput label="Reason" value={planChangeDraft.reason} onChange={(value) => setPlanChangeDraft({ ...planChangeDraft, reason: value })} />
              </div>
              <button className="primary-action" type="button" onClick={schedulePlanChange}><CalendarClock size={17} /> Schedule change</button>
            </Panel>

            <Panel title="Enrollment & Eligibility Queue" kicker="Agreement/payment completion and access readiness">
              <div className="invoice-list">
                {state.members.map((member) => (
                  <article key={member.id} className="invoice-row">
                    <div>
                      <strong>{member.firstName} {member.lastName}</strong>
                      <span>{member.enrollmentStatus}</span>
                      <small>{member.documents.length} documents - payment {member.paymentProfile.status}</small>
                    </div>
                    <b className={member.enrollmentStatus === "Complete" ? "status active" : "status inactive"}>{member.enrollmentStatus === "Complete" ? "Ready" : "Open"}</b>
                    <button className="text-button" type="button" onClick={() => navigate("member-detail", member.id)}>Open</button>
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid two">
            <Panel title="Scheduled Changes" kicker="Future tier changes requiring review">
              <div className="invoice-list">
                {scheduledChanges.length === 0 ? <p>No future plan changes scheduled.</p> : scheduledChanges.map((member) => member.scheduledPlanChange && (
                  <article key={member.scheduledPlanChange.id} className="invoice-row">
                    <div><strong>{member.firstName} {member.lastName}</strong><span>{getTier(member.scheduledPlanChange.fromTier).name} to {getTier(member.scheduledPlanChange.toTier).name}</span><small>{member.scheduledPlanChange.reason}</small></div>
                    <b>{member.scheduledPlanChange.effectiveDate}</b>
                    <button className="text-button" type="button" onClick={() => navigate("member-detail", member.id)}>Open</button>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Access & Admin Placeholders" kicker="Production-ready items to wire later">
              <div className="pulse-list">
                <PulseItem label="Role-based access" value={3} detail="Admin, billing, and care-coordinator roles should gate sensitive tools." />
                <PulseItem label="Member self-service" value={1} detail="Future portal: update payment source, download agreements, request support." />
                <PulseItem label="Exports" value={2} detail="Use JSON export now; add accounting and CRM exports when backend is added." />
                <PulseItem label="Integrations" value={0} detail="Payment processor, e-signature, EHR, and accounting integrations are future production work." />
              </div>
            </Panel>
          </section>
        </>
      )}

      {view === "leads" && (
        <section className="grid two">
          <Panel title="Add New Lead" kicker="Manual lead intake">
            <div className="form-grid">
              <TextInput label="First name" value={leadForm.firstName} onChange={(value) => setLeadForm({ ...leadForm, firstName: value })} />
              <TextInput label="Last name" value={leadForm.lastName} onChange={(value) => setLeadForm({ ...leadForm, lastName: value })} />
              <TextInput label="Phone" value={leadForm.phone} onChange={(value) => setLeadForm({ ...leadForm, phone: value })} />
              <TextInput label="Email" value={leadForm.email} onChange={(value) => setLeadForm({ ...leadForm, email: value })} />
              <TextInput label="Address" value={leadForm.address} onChange={(value) => setLeadForm({ ...leadForm, address: value })} wide />
              <TextInput label="Referred by" value={leadForm.referredBy} onChange={(value) => setLeadForm({ ...leadForm, referredBy: value })} />
              <TextInput label="Source" value={leadForm.source} onChange={(value) => setLeadForm({ ...leadForm, source: value })} />
              <SelectInput label="Target tier" value={leadForm.targetTier} onChange={(value) => setLeadForm({ ...leadForm, targetTier: value as TierId })} options={tiers.map((tier) => ({ value: tier.id, label: tier.name }))} />
              <SelectInput label="Stage" value={leadForm.stage} onChange={(value) => setLeadForm({ ...leadForm, stage: value as LeadStage })} options={stageOrder.map((stage) => ({ value: stage, label: stage }))} />
              <TextInput label="Expected close month" value={leadForm.expectedCloseMonth} onChange={(value) => setLeadForm({ ...leadForm, expectedCloseMonth: value })} />
              <TextInput label="Owner" value={leadForm.owner} onChange={(value) => setLeadForm({ ...leadForm, owner: value })} />
              <TextArea label="Notes" value={leadForm.notes} onChange={(value) => setLeadForm({ ...leadForm, notes: value })} wide />
            </div>
            <button className="primary-action" type="button" onClick={addLead}><Plus size={17} /> Add lead</button>
          </Panel>
          <Panel title="Lead Pipeline" kicker="Editable stages with conversion">
            <div className="lead-table">
              <div className="table-row lead-row header"><span>Name</span><span>Phone</span><span>Stage</span><span>Tier</span><span>EV</span><span>Action</span></div>
              {state.leads.map((lead) => (
                <div className="table-row lead-row" key={lead.id}>
                  <span>{lead.firstName} {lead.lastName}<small>{lead.email}</small></span>
                  <span>{lead.phone}</span>
                  <select value={lead.stage} onChange={(event) => updateLead(lead.id, "stage", event.target.value)}>{stageOrder.map((stage) => <option key={stage}>{stage}</option>)}</select>
                  <select value={lead.targetTier} onChange={(event) => updateLead(lead.id, "targetTier", event.target.value)}>{tiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select>
                  <span>{money.format(getTier(lead.targetTier).annualPrice * lead.probability)}</span>
                  <button className="text-button" type="button" onClick={() => convertLeadToMember(lead)}>Convert</button>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      )}
    </main>
  );
}

function MemberDetail(props: {
  member: Member;
  documentCategory: DocumentCategory;
  setDocumentCategory: (category: DocumentCategory) => void;
  documentInput: React.RefObject<HTMLInputElement | null>;
  updateMember: (id: string, key: keyof Member, value: string | boolean) => void;
  updatePoc: (memberId: string, key: keyof PointOfContact, value: string) => void;
  updatePayment: (memberId: string, key: keyof PaymentProfile, value: string) => void;
  addDocuments: (memberId: string, files: FileList | null) => void;
  activityDraft: { type: string; note: string; owner: string };
  setActivityDraft: (draft: { type: string; note: string; owner: string }) => void;
  addActivity: (memberId: string) => void;
  providerForm: ProviderForm;
  setProviderForm: (form: ProviderForm) => void;
  addProvider: (memberId: string) => void;
  navigate: (view: View, memberId?: string) => void;
}) {
  const { member } = props;

  return (
    <>
      <button className="back-button" type="button" onClick={() => props.navigate("members")}><ArrowLeft size={17} /> Back to members</button>

      <section className="member-page-layout">
        <article className="member-summary-card">
          <div className="member-card-topline">
            <span className={member.active ? "large-status active" : "large-status inactive"}>{member.active ? "Active" : "Inactive"}</span>
            <label className="switch">
              <input type="checkbox" checked={member.active} onChange={(event) => props.updateMember(member.id, "active", event.target.checked)} />
              <span>{member.active ? "Active" : "Inactive"}</span>
            </label>
          </div>
          <h2>{member.firstName} {member.lastName}</h2>
          <div className="member-summary-grid">
            <InfoLine icon={<Phone size={16} />} label="Phone" value={member.phone || "Not entered"} />
            <InfoLine icon={<Mail size={16} />} label="Email" value={member.email || "Not entered"} />
            <InfoLine icon={<MapPin size={16} />} label="Address" value={member.address || "Not entered"} />
            <InfoLine icon={<Users size={16} />} label="Point of contact" value={member.pointOfContact.name || "Not entered"} />
            <InfoLine icon={<Phone size={16} />} label="POC phone" value={member.pointOfContact.phone || "Not entered"} />
            <InfoLine icon={<Mail size={16} />} label="POC email" value={member.pointOfContact.email || "Not entered"} />
          </div>
        </article>

        <Panel title="Member Details" kicker={`${member.id} - ${getTier(member.tier).name}`}>
          <div className="form-grid compact">
            <TextInput label="First name" value={member.firstName} onChange={(value) => props.updateMember(member.id, "firstName", value)} />
            <TextInput label="Last name" value={member.lastName} onChange={(value) => props.updateMember(member.id, "lastName", value)} />
            <TextInput label="Phone" value={member.phone} onChange={(value) => props.updateMember(member.id, "phone", value)} />
            <TextInput label="Email" value={member.email} onChange={(value) => props.updateMember(member.id, "email", value)} />
            <TextInput label="Address" value={member.address} onChange={(value) => props.updateMember(member.id, "address", value)} wide />
            <TextInput label="POC name" value={member.pointOfContact.name} onChange={(value) => props.updatePoc(member.id, "name", value)} />
            <TextInput label="POC phone" value={member.pointOfContact.phone} onChange={(value) => props.updatePoc(member.id, "phone", value)} />
            <TextInput label="POC email" value={member.pointOfContact.email} onChange={(value) => props.updatePoc(member.id, "email", value)} />
            <SelectInput label="Tier" value={member.tier} onChange={(value) => props.updateMember(member.id, "tier", value)} options={tiers.map((tier) => ({ value: tier.id, label: tier.name }))} />
            <SelectInput label="Enrollment status" value={member.enrollmentStatus} onChange={(value) => props.updateMember(member.id, "enrollmentStatus", value)} options={["Invite Sent", "Agreement Pending", "Payment Pending", "Complete", "Needs Attention"].map((status) => ({ value: status, label: status }))} />
            <TextInput label="Start date" type="date" value={member.startDate} onChange={(value) => props.updateMember(member.id, "startDate", value)} />
            <ReadOnly label="Annual fee" value={money.format(member.annualFee)} />
            <ReadOnly label="Renewal date" value={member.renewalDate} />
          </div>
        </Panel>
      </section>

      <section className="grid two">
        <Panel title="Document Hub" kicker="Consent, agreement, payment authorization, and other files">
          <div className="inline-controls">
            <SelectInput label="Document type" value={props.documentCategory} onChange={(value) => props.setDocumentCategory(value as DocumentCategory)} options={documentCategories.map((category) => ({ value: category, label: category }))} />
            <button className="secondary-action" type="button" onClick={() => props.documentInput.current?.click()}><Upload size={17} /> Upload documents</button>
            <input ref={props.documentInput} hidden multiple type="file" onChange={(event) => props.addDocuments(member.id, event.target.files)} />
          </div>
          <div className="document-hub">
            {documentCategories.map((category) => (
              <article key={category}>
                <h3>{category}</h3>
                {member.documents.filter((document) => document.category === category).length === 0 ? (
                  <p>No files uploaded.</p>
                ) : (
                  member.documents.filter((document) => document.category === category).map((document) => (
                    <div key={document.id} className="document-line">
                      <FileText size={16} />
                      <span><strong>{document.fileName}</strong><small>{document.status} - {document.uploadedAt} - {document.sizeKb} KB</small></span>
                    </div>
                  ))
                )}
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Card On File" kicker="Secure payment metadata only">
          <div className="form-grid compact">
            <SelectInput label="Status" value={member.paymentProfile.status} onChange={(value) => props.updatePayment(member.id, "status", value)} options={["Not Collected", "On File", "Expired", "Needs Update"].map((item) => ({ value: item, label: item }))} />
            <TextInput label="Processor" value={member.paymentProfile.processor} onChange={(value) => props.updatePayment(member.id, "processor", value)} />
            <TextInput label="Token/reference" value={member.paymentProfile.tokenReference} onChange={(value) => props.updatePayment(member.id, "tokenReference", value)} />
            <TextInput label="Cardholder" value={member.paymentProfile.cardholderName} onChange={(value) => props.updatePayment(member.id, "cardholderName", value)} />
            <TextInput label="Brand" value={member.paymentProfile.brand} onChange={(value) => props.updatePayment(member.id, "brand", value)} />
            <TextInput label="Last 4 only" value={member.paymentProfile.last4} maxLength={4} onChange={(value) => props.updatePayment(member.id, "last4", value.replace(/\D/g, "").slice(0, 4))} />
            <TextInput label="Expiration" value={member.paymentProfile.expiration} placeholder="MM/YY" onChange={(value) => props.updatePayment(member.id, "expiration", value)} />
            <TextInput label="Billing ZIP" value={member.paymentProfile.billingZip} onChange={(value) => props.updatePayment(member.id, "billingZip", value)} />
          </div>
        </Panel>
      </section>

      <section className="grid two">
        <Panel title="Care Team" kicker="Provider specialty, contact details, and address">
          <div className="form-grid compact">
            <SelectInput label="Specialty" value={props.providerForm.specialty} onChange={(value) => props.setProviderForm({ ...props.providerForm, specialty: value as ProviderSpecialty })} options={specialties.map((specialty) => ({ value: specialty, label: specialty }))} />
            <TextInput label="First name" value={props.providerForm.firstName} onChange={(value) => props.setProviderForm({ ...props.providerForm, firstName: value })} />
            <TextInput label="Last name" value={props.providerForm.lastName} onChange={(value) => props.setProviderForm({ ...props.providerForm, lastName: value })} />
            <TextInput label="Phone" value={props.providerForm.phone} onChange={(value) => props.setProviderForm({ ...props.providerForm, phone: value })} />
            <TextInput label="Email" value={props.providerForm.email} onChange={(value) => props.setProviderForm({ ...props.providerForm, email: value })} />
            <TextInput label="Address" value={props.providerForm.address} onChange={(value) => props.setProviderForm({ ...props.providerForm, address: value })} wide />
          </div>
          <button className="primary-action" type="button" onClick={() => props.addProvider(member.id)}><Plus size={17} /> Add provider</button>
          <div className="provider-grid">
            {member.careTeam.map((provider) => (
              <article key={provider.id} className="provider-card">
                <strong>{provider.specialty}</strong>
                <h3>{provider.firstName} {provider.lastName}</h3>
                <span><Phone size={14} /> {provider.phone || "No phone"}</span>
                <span><Mail size={14} /> {provider.email || "No email"}</span>
                <span><MapPin size={14} /> {provider.address || "No address"}</span>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Activity History" kicker="Internal member timeline">
          <div className="activity-composer">
            <TextInput label="Type" value={props.activityDraft.type} onChange={(value) => props.setActivityDraft({ ...props.activityDraft, type: value })} />
            <TextInput label="Owner" value={props.activityDraft.owner} onChange={(value) => props.setActivityDraft({ ...props.activityDraft, owner: value })} />
            <TextArea label="Activity note" value={props.activityDraft.note} onChange={(value) => props.setActivityDraft({ ...props.activityDraft, note: value })} wide />
            <button className="secondary-action" type="button" onClick={() => props.addActivity(member.id)}><Save size={17} /> Save activity</button>
          </div>
          <div className="timeline">
            {member.activityHistory.map((entry) => (
              <article key={entry.id}><strong>{entry.type}</strong><span>{entry.date} - {entry.owner}</span><p>{entry.note}</p></article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}

function MemberFormFields({ memberForm, setMemberForm }: { memberForm: MemberForm; setMemberForm: (form: MemberForm) => void }) {
  return (
    <div className="form-grid">
      <TextInput label="First name" value={memberForm.firstName} onChange={(value) => setMemberForm({ ...memberForm, firstName: value })} />
      <TextInput label="Last name" value={memberForm.lastName} onChange={(value) => setMemberForm({ ...memberForm, lastName: value })} />
      <TextInput label="Phone" value={memberForm.phone} onChange={(value) => setMemberForm({ ...memberForm, phone: value })} />
      <TextInput label="Email" value={memberForm.email} onChange={(value) => setMemberForm({ ...memberForm, email: value })} />
      <TextInput label="Address" value={memberForm.address} onChange={(value) => setMemberForm({ ...memberForm, address: value })} wide />
      <TextInput label="Point of contact" value={memberForm.pocName} onChange={(value) => setMemberForm({ ...memberForm, pocName: value })} />
      <TextInput label="POC phone" value={memberForm.pocPhone} onChange={(value) => setMemberForm({ ...memberForm, pocPhone: value })} />
      <TextInput label="POC email" value={memberForm.pocEmail} onChange={(value) => setMemberForm({ ...memberForm, pocEmail: value })} />
      <TextInput label="Referred by" value={memberForm.referredBy} onChange={(value) => setMemberForm({ ...memberForm, referredBy: value })} />
      <SelectInput label="Tier" value={memberForm.tier} onChange={(value) => setMemberForm({ ...memberForm, tier: value as TierId })} options={tiers.map((tier) => ({ value: tier.id, label: `${tier.name} - ${money.format(tier.annualPrice)}` }))} />
      <TextInput label="Start date" value={memberForm.startDate} type="date" onChange={(value) => setMemberForm({ ...memberForm, startDate: value })} />
      <label className="toggle-field"><input type="checkbox" checked={memberForm.active} onChange={(event) => setMemberForm({ ...memberForm, active: event.target.checked })} /><span>Active member</span></label>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="info-line">
      {icon}
      <span><small>{label}</small><strong>{value}</strong></span>
    </div>
  );
}

function PulseItem({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="pulse-item">
      <b>{value}</b>
      <span><strong>{label}</strong><small>{detail}</small></span>
    </article>
  );
}

function Kpi({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <article className="kpi"><div>{icon}</div><p>{title}</p><strong>{value}</strong><span>{detail}</span></article>
  );
}

function Panel({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <section className="panel"><div className="panel-title"><p>{kicker}</p><h2>{title}</h2></div>{children}</section>
  );
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="number-input"><span>{label}</span><input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} /></label>
  );
}

function TextInput({ label, value, onChange, wide, type = "text", placeholder, maxLength }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean; type?: string; placeholder?: string; maxLength?: number }) {
  return (
    <label className={wide ? "field wide" : "field"}><span>{label}</span><input type={type} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} /></label>
  );
}

function TextArea({ label, value, onChange, wide }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return (
    <label className={wide ? "field wide" : "field"}><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <label className="field read-only"><span>{label}</span><output>{value}</output></label>
  );
}

function Progress({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress"><div><span>{label}</span><strong>{value}/{max}</strong></div><div className="meter"><span style={{ width: `${pct}%` }} /></div></div>
  );
}

export default App;
