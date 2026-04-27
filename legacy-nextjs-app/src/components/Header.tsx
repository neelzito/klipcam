import { getSupabaseServiceClient } from "@/lib/supabaseServer";
import { TopNavigation } from "./TopNavigation";
import { AuthButtons } from "./AuthButtons";
import { headers } from 'next/headers';

// Check if we're in demo mode
const isDemoMode = () => {
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_APP_ENV === 'demo';
};

export default async function Header() {
  const demoMode = isDemoMode();
  let credits: number | null = null;
  let userId: string | null = null;

  if (demoMode) {
    // Demo mode: use mock data
    credits = 50;
    userId = 'demo-user-id';
  } else {
    // Production mode: use Clerk auth
    try {
      // Dynamically import Clerk only in production mode to avoid build issues
      const { auth } = await import("@clerk/nextjs/server");
      const authResult = auth();
      userId = authResult.userId;
      
      if (userId) {
        const supabase = getSupabaseServiceClient();
        const { data: user } = await supabase
          .from("users")
          .select("credit_balance")
          .eq("clerk_id", userId)
          .single();
        credits = user?.credit_balance ?? null;
      }
    } catch (error) {
      console.error('Header auth error:', error);
      // In case of auth error, fall back to demo mode behavior
      credits = null;
      userId = null;
    }
  }

  const low = typeof credits === "number" && credits < 10;

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="KlipCam Logo" className="w-8 h-8" />
          <span className="text-lg font-bold">KlipCam</span>
        </a>
        
        {/* Desktop Navigation */}
        <TopNavigation />
        
        {/* Credit Badge & Auth */}
        <div className="flex items-center gap-4">
          <div className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700">
            <span className="text-xs text-gray-400 mr-1">Credits:</span>
            <span className={`text-sm font-bold ${low ? "text-orange-400" : "text-white"}`}>
              {credits ?? "—"}
            </span>
          </div>
          <AuthButtons />
        </div>
      </div>
      
      {/* Low credits warning */}
      {low && (
        <div className="bg-orange-500/10 border-t border-orange-500/20 text-sm text-orange-400 px-4 py-3 text-center">
          <span className="font-medium">Running low on credits</span> — 
          <a href="/pricing" className="ml-1 underline hover:no-underline">
            subscribe to continue creating
          </a>
        </div>
      )}
    </header>
  );
}




