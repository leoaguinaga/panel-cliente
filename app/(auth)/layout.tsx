export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center font-bold text-2xl mb-8">
          <img src="/logos/logo-full.webp" alt="Foxcode" className="h-20 place-self-center" />
        </div>
        {children}
      </div>
    </div>
  );
}
