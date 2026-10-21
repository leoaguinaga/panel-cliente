export const ROUTES = {
  auth: {
    login: '/login',
  },
  internal: {
    dashboard: '/internal/dashboard',
    leads: '/internal/leads',
    clients: '/internal/clients',
    projects: '/internal/projects',
    products: '/internal/products',
    services: '/internal/services',
    foxroomsDemos: '/internal/products/foxrooms/demos',
    documents: '/internal/documents',
    payments: '/internal/payments',
    workers: '/internal/workers',
    settings: '/internal/settings',
    profile: '/internal/profile',
    guides: '/internal/guides',
  },
  client: {
    dashboard: '/client/dashboard',
    projects: '/client/projects',
    documents: '/client/documents',
    calendar: '/client/calendar',
    payments: '/client/payments',
    profile: '/client/profile',
    help: '/client/help',
  }
} as const;
