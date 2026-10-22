export type ProposalStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type ProposalTaxMode = 'PLUS_IGV' | 'IGV_INCLUDED';
export type ProposalMode = 'DOCUMENT' | 'INTERACTIVE';
export type ProposalLayer = 'WEB' | 'BACKEND' | 'MOBILE';

type Money = string | number;

export type ProposalItem = { id?: string; layer: ProposalLayer; module: string; description: string | null; amount: Money };
export type ProposalStage = { id?: string; order: number; title: string; weeks: number; paymentPct: number };
export type ProposalAddon = { id?: string; name: string; price: Money | null; chosen: boolean };
export type ProposalThirdParty = { id?: string; name: string; provider: string | null; approxCost: string | null };

export type Proposal = {
  id: string;
  leadId: string;
  clientId: string | null;
  projectId: string | null;
  code: string;
  version: number;
  parentId: string | null;
  status: ProposalStatus;
  title: string;
  currency: 'PEN' | 'USD';
  taxMode: ProposalTaxMode;
  showBreakdown: boolean;
  total: Money;
  validUntil: string | null;
  meetingDate: string | null;
  understandingToday: string | null;
  understandingCost: string | null;
  understandingSuccess: string | null;
  solutionSummary: string | null;
  layers: ProposalLayer[];
  exclusions: string | null;
  assumptions: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  pdfDocumentId: string | null;
  /** INTERACTIVE: HTML hecho en Claude Code (foxcode/propuestas); sus datos salen del manifiesto. */
  mode: ProposalMode;
  htmlBytes: number | null;
  htmlUploadedAt: string | null;
  manifest: ProposalManifest | null;
  createdAt: string;
  updatedAt: string;
  preparedBy: { id: string; name: string; email: string; jobTitle: string | null } | null;
  acceptedBy: { id: string; name: string } | null;
  items: ProposalItem[];
  stages: ProposalStage[];
  addons: ProposalAddon[];
  thirdParties: ProposalThirdParty[];
};

/** Lo que el panel lee del manifiesto `#foxcode-proposal` del HTML subido. */
export type ProposalManifest = {
  client: string;
  title: string;
  validDays: number;
  items: { module: string; weeks?: number; bullets?: string[] }[];
  addons?: { id: string; name: string; description?: string; price: number }[];
  sections: { id: string; label: string }[];
};

export type ProposalDetail = Proposal & {
  lead: { id: string; name: string; companyName: string | null; email: string | null; phone: string | null; status: string; product: { id: string; name: string } | null };
  children: { id: string; version: number }[];
};

export type ProposalPatch = Partial<
  Pick<
    Proposal,
    | 'title'
    | 'currency'
    | 'taxMode'
    | 'showBreakdown'
    | 'validUntil'
    | 'meetingDate'
    | 'understandingToday'
    | 'understandingCost'
    | 'understandingSuccess'
    | 'solutionSummary'
    | 'layers'
    | 'exclusions'
    | 'assumptions'
  >
> & {
  items?: Array<Omit<ProposalItem, 'id' | 'amount'> & { amount: number }>;
  stages?: Array<Pick<ProposalStage, 'order' | 'weeks' | 'paymentPct'>>;
  addons?: Array<Omit<ProposalAddon, 'id' | 'price'> & { price: number | null }>;
  thirdParties?: Array<Omit<ProposalThirdParty, 'id'>>;
};
