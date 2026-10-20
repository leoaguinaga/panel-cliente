export const demoStatuses = {
  DEMO_REQUESTED: 'Demo solicitada', DEMO_GIVEN: 'Demo realizada', FOLLOW_UP: 'En seguimiento',
  BETA_USER: 'Usuario beta', PAYING_CUSTOMER: 'Cliente de pago', LOST: 'Perdido',
} as const;
export type Demo = {
  id: string; companyName: string; contactName: string | null; contactEmail: string | null;
  contactPhone: string | null; status: keyof typeof demoStatuses; assignedToId: string | null;
  leadId: string | null; clientId: string | null; demoDate: string | null; nextActionAt: string | null;
  notes: string | null; assignedTo: { id: string; name: string } | null;
};
