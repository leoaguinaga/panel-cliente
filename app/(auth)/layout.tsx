import { BrandLogo } from "@/components/shared/BrandLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div className="flex justify-center mb-8">
          <BrandLogo className="text-[26px]" />
        </div>
        {children}
      </div>
    </div>
  );
}
