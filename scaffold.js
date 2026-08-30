import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = {
  "src/modules/auth/server/permissions.ts": `export const ROLES = {
  ADMIN: 'ADMIN',
  WORKER: 'WORKER',
  CLIENT: 'CLIENT',
} as const;

export type Role = keyof typeof ROLES;

// Base functions to be implemented later
export const hasPermission = (userRole: Role, requiredRole: Role) => {
  if (userRole === ROLES.ADMIN) return true;
  if (requiredRole === ROLES.CLIENT && userRole === ROLES.CLIENT) return true;
  if (requiredRole === ROLES.WORKER && (userRole === ROLES.WORKER || userRole === ROLES.ADMIN)) return true;
  return false;
};
`,
  "lib/constants.ts": `export const ROUTES = {
  auth: {
    login: '/login',
  },
  internal: {
    dashboard: '/internal/dashboard',
    leads: '/internal/leads',
    clients: '/internal/clients',
    projects: '/internal/projects',
    documents: '/internal/documents',
    workers: '/internal/workers',
  },
  client: {
    dashboard: '/client/dashboard',
    projects: '/client/projects',
    documents: '/client/documents',
    payments: '/client/payments',
    profile: '/client/profile',
  }
} as const;
`,
  "components/layout/InternalSidebar.tsx": `import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export function InternalSidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col p-4">
      <div className="font-bold text-xl mb-8 tracking-tight text-gray-900">Foxcode Internal</div>
      <nav className="flex flex-col gap-2">
        <Link href={ROUTES.internal.dashboard} className="px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium text-gray-700">Dashboard</Link>
        <Link href={ROUTES.internal.leads} className="px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium text-gray-700">Leads</Link>
        <Link href={ROUTES.internal.clients} className="px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium text-gray-700">Clients</Link>
        <Link href={ROUTES.internal.projects} className="px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium text-gray-700">Projects</Link>
        <Link href={ROUTES.internal.documents} className="px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium text-gray-700">Documents</Link>
      </nav>
    </aside>
  );
}
`,
  "components/layout/ClientNavbar.tsx": `import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export function ClientNavbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="font-bold tracking-tight text-lg">Foxcode Portal</div>
        <nav className="flex gap-6">
          <Link href={ROUTES.client.dashboard} className="text-sm font-medium text-gray-600 hover:text-black">Dashboard</Link>
          <Link href={ROUTES.client.projects} className="text-sm font-medium text-gray-600 hover:text-black">My Projects</Link>
          <Link href={ROUTES.client.documents} className="text-sm font-medium text-gray-600 hover:text-black">Documents</Link>
          <Link href={ROUTES.client.payments} className="text-sm font-medium text-gray-600 hover:text-black">Payments</Link>
        </nav>
      </div>
    </header>
  );
}
`,
  "app/(auth)/layout.tsx": `export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center font-bold text-2xl mb-8">Foxcode</div>
        {children}
      </div>
    </div>
  );
}
`,
  "app/(auth)/login/page.tsx": `import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center text-sm text-gray-500 mb-4">
        Log in to access your portal.
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-10 bg-gray-100 rounded border border-gray-200 flex items-center px-3 text-sm text-gray-400">Email</div>
        <div className="h-10 bg-gray-100 rounded border border-gray-200 flex items-center px-3 text-sm text-gray-400">Password</div>
      </div>
      <button className="h-10 bg-black text-white font-medium rounded text-sm hover:bg-gray-800 transition-colors mt-2">
        Sign In
      </button>
      
      {/* Dev links for navigation purposes only */}
      <div className="mt-8 border-t border-gray-100 pt-4 flex justify-between text-xs text-blue-500">
        <Link href={ROUTES.internal.dashboard}>Go to Internal</Link>
        <Link href={ROUTES.client.dashboard}>Go to Client</Link>
      </div>
    </div>
  );
}
`,
  "app/(internal)/internal/layout.tsx": `import { InternalSidebar } from '@/components/layout/InternalSidebar';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <InternalSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
`,
  "app/(internal)/internal/dashboard/page.tsx": `export default function InternalDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Active Leads</div>
          <div className="text-3xl font-semibold">12</div>
        </div>
        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Active Projects</div>
          <div className="text-3xl font-semibold">8</div>
        </div>
        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Pending Demos</div>
          <div className="text-3xl font-semibold">3</div>
        </div>
      </div>
    </div>
  );
}
`,
  "app/(client)/client/layout.tsx": `import { ClientNavbar } from '@/components/layout/ClientNavbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientNavbar />
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
`,
  "app/(client)/client/dashboard/page.tsx": `export default function ClientDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Welcome Back</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-4">Active Project</h2>
          <div className="text-sm text-gray-500">You have 1 project currently in progress.</div>
        </div>
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-4">Recent Documents</h2>
          <div className="text-sm text-gray-500">No new documents available.</div>
        </div>
      </div>
    </div>
  );
}
`,
  "src/modules/users/index.ts": "// Users module placeholder\n",
  "src/modules/leads/index.ts": "// Leads module placeholder\n",
  "src/modules/clients/index.ts": "// Clients module placeholder\n",
  "src/modules/projects/index.ts": "// Projects module placeholder\n",
  "src/modules/documents/index.ts": "// Documents module placeholder\n",
  "src/modules/payments/index.ts": "// Payments module placeholder\n",
  "src/modules/products/index.ts": "// Products module placeholder\n",
  "src/modules/dashboard/index.ts": "// Dashboard module placeholder\n",
};

for (const [filePath, content] of Object.entries(files)) {
  const absolutePath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

console.log("Scaffolding complete.");
