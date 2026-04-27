'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useDemoAwareUser } from "@/hooks/useDemoAwareUser";

export function AuthButtons() {
  const { isDemoMode, isLoaded } = useDemoAwareUser();

  // Show loading state while checking demo mode
  if (!isLoaded) {
    return (
      <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse" />
    );
  }

  // In demo mode, show a demo indicator instead of auth buttons
  if (isDemoMode) {
    return (
      <div className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
        Demo Mode
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#7c3aed',
              colorText: '#ffffff',
              colorBackground: '#1f2937',
            },
            elements: {
              avatarBox: 'w-8 h-8',
              userButtonPopoverCard: 'bg-gray-900 border border-gray-800',
              userButtonPopoverActionButton: 'text-gray-300 hover:text-white hover:bg-gray-800',
            },
          }}
        />
      </SignedIn>
    </div>
  );
}