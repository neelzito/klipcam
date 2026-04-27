import "../styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { Toaster } from "@/components/Toaster";
import Header from "@/components/Header";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DemoModeProvider } from "@/components/DemoModeProvider";

// Check if we're in demo mode
const isDemoMode = () => {
  return process.env.NEXT_PUBLIC_APP_ENV === 'demo' || process.env.DEMO_MODE === 'true';
};

export const metadata = {
  title: "KlipCam - AI Creator Platform",
  description: "Create 10 IG-ready images in under 5 minutes from 10 selfies",
  keywords: ["AI", "content creation", "Instagram", "social media", "images", "videos"],
  authors: [{ name: "KlipCam Team" }],
  creator: "KlipCam",
  publisher: "KlipCam",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://klipcam.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://klipcam.com',
    siteName: 'KlipCam',
    title: 'KlipCam - AI Creator Platform',
    description: 'Create 10 IG-ready images in under 5 minutes from 10 selfies',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@klipcam',
    creator: '@klipcam',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const demoMode = isDemoMode();
  
  const LayoutContent = ({ children }: { children: ReactNode }) => (
    <html lang="en" data-theme="dark">
      <head>
        {demoMode && <meta name="X-Demo-Mode" content="true" />}
      </head>
      <body className="bg-black text-white antialiased">
        <ErrorBoundary>
          <DemoModeProvider>
            <Header />
            <main className="pb-16 lg:pb-0">{children}</main>
            <BottomNavigation />
            <Toaster />
          </DemoModeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );

  // Always render ClerkProvider to avoid React hook issues
  // In demo mode, Clerk hooks will be available but not used for authentication
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#7c3aed',
          colorText: '#ffffff',
          colorBackground: '#000000',
          colorInputBackground: '#1f2937',
          colorInputText: '#ffffff',
        },
        elements: {
          formButtonPrimary: 'bg-primary-600 hover:bg-primary-700 text-white',
          card: 'bg-gray-900 border border-gray-800',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700',
          dividerLine: 'bg-gray-700',
          dividerText: 'text-gray-400',
          formFieldLabel: 'text-gray-300',
          formFieldInput: 'bg-gray-800 border-gray-700 text-white',
          footerActionText: 'text-gray-400',
          footerActionLink: 'text-primary-400 hover:text-primary-300',
        },
      }}
    >
      <LayoutContent>{children}</LayoutContent>
    </ClerkProvider>
  );
}


