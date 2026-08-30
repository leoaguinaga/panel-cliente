export default function ClientDashboardPage() {
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
