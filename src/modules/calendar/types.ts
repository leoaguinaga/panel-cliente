export type Entry = {
  meetingType: string;
  googleEventId?: string | null;
  id: string;
  kind: "reminder" | "meeting";
  title: string;
  date: string;
  time: string | null;
  duration: number;
  ownerId: string;
  creatorId: string;
  visibility: string;
  projectId: string | null;
  leadId?: string | null;
  productId?: string | null;
  leadName?: string | null;
  notes: string;
  attendees: string[];
  useMeet: boolean;
  sendInvites: boolean;
  status: string;
  version: number;
  meetUrl: string | null;
  syncStatus: string;
  syncError: string | null;
};
export type Event = {
  id: string;
  kind: string;
  title: string;
  date: string;
  time: string | null;
  ownerId: string | null;
  owner: string;
  projectId: string | null;
  productId: string | null;
  context: string;
  href?: string;
  entry?: Entry;
  canEdit?: boolean;
};
export type Options = {
  userId: string;
  isAdmin: boolean;
  workers: { id: string; name: string; email: string }[];
  leads: { id: string; name: string; companyName: string | null }[];
  products: { id: string; name: string }[];
  projects: {
    id: string;
    name: string;
    productId: string | null;
    product: { name: string } | null;
  }[];
};
export type Connection = {
  configured: boolean;
  connected: boolean;
  email: string | null;
};
export type Results = {
  items: Event[];
  total: number;
  nextOffset: number | null;
  today: string;
};
