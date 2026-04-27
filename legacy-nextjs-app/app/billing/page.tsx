"use client";
import { useEffect } from "react";

export default function BillingPage() {
  useEffect(() => {
    // Redirect to pricing page
    window.location.replace('/pricing');
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting to pricing...</p>
      </div>
    </div>
  );
}




