'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  isLoaded: boolean;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  isLoaded: false,
});

export function useDemoMode() {
  return useContext(DemoModeContext);
}

interface DemoModeProviderProps {
  children: ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check demo mode on client-side only to avoid hydration mismatch
    const checkDemoMode = () => {
      // Check environment variable
      if (process.env.NEXT_PUBLIC_APP_ENV === 'demo') {
        return true;
      }
      
      // Check meta tag
      const demoMeta = document.querySelector('meta[name="X-Demo-Mode"]');
      if (demoMeta?.getAttribute('content') === 'true') {
        return true;
      }
      
      // Check URL parameter
      if (window.location.search.includes('demo=true')) {
        return true;
      }
      
      return false;
    };

    setIsDemoMode(checkDemoMode());
    setIsLoaded(true);
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, isLoaded }}>
      {children}
    </DemoModeContext.Provider>
  );
}