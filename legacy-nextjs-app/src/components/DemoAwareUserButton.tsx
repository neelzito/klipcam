'use client';

import { useEffect, useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { User } from 'lucide-react';

// Check if we're in demo mode
const isDemoMode = () => {
  // First check server-side environment variable
  if (process.env.NEXT_PUBLIC_APP_ENV === 'demo' || process.env.DEMO_MODE === 'true') {
    return true;
  }
  
  // Only check client-side if we're in a browser environment
  try {
    if (typeof window !== 'undefined' && window?.location?.search?.includes('demo=true')) {
      return true;
    }
  } catch (error) {
    // Ignore errors when window is not available
  }
  
  return false;
};

interface DemoAwareUserButtonProps {
  appearance?: any;
}

export function DemoAwareUserButton({ appearance }: DemoAwareUserButtonProps) {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    setDemoMode(isDemoMode());
  }, []);

  if (demoMode) {
    // Demo mode - render a mock user button
    return (
      <div 
        className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        title="Demo User"
      >
        <User className="w-6 h-6 text-white" />
      </div>
    );
  }

  // Render the actual Clerk UserButton
  return <UserButton appearance={appearance} />;
}