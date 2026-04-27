'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, CreditCard, Palette, Video, Upload } from 'lucide-react';

export default function OnboardingPage() {
  const { user, clerkUser, isLoading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user || !clerkUser) {
    // Use router for client-side navigation, fallback to window for edge cases
    if (typeof window !== 'undefined') {
      router.push('/sign-in' as any);
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const steps = [
    {
      title: "Welcome to KlipCam!",
      subtitle: `Hi ${user.first_name || clerkUser.firstName}! Let's get you started`,
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <p className="text-gray-300 text-lg">
              Create stunning IG-ready content with AI in under 5 minutes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <Palette className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <p className="font-medium">20+ Preset Styles</p>
                <p className="text-gray-400 text-xs">Fashion, Portrait, Artistic & more</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <Video className="w-6 h-6 text-secondary-400 mx-auto mb-2" />
                <p className="font-medium">Video Generation</p>
                <p className="text-gray-400 text-xs">Transform ideas into engaging videos</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <Upload className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="font-medium">Image to Image</p>
                <p className="text-gray-400 text-xs">Transform your existing photos</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Your Trial Credits",
      subtitle: "You've got 10 free credits to get started",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-2">{user.credit_balance} Credits</div>
              <div className="text-gray-400 mb-4">Available in your account</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="font-medium text-white">Base Quality</div>
                  <div className="text-gray-400">1 credit per image</div>
                  <div className="text-primary-400 text-xs">~10 images</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="font-medium text-white">Premium Quality</div>
                  <div className="text-gray-400">4 credits per image</div>
                  <div className="text-secondary-400 text-xs">~2 images</div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-400">
              Your trial lasts 7 days. Upgrade to Pro anytime for unlimited creation!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Create!",
      subtitle: "Everything is set up. Let's make some amazing content",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="space-y-4">
            <p className="text-gray-300 text-lg">
              You&apos;re all set! Here&apos;s what you can do next:
            </p>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-lg p-4 text-left">
                <div className="font-medium text-white mb-1">1. Browse Preset Styles</div>
                <div className="text-gray-400 text-sm">Choose from 20+ professionally crafted styles</div>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4 text-left">
                <div className="font-medium text-white mb-1">2. Generate Your First Image</div>
                <div className="text-gray-400 text-sm">Enter a prompt and watch the magic happen</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 text-left">
                <div className="font-medium text-white mb-1">3. Try Video Generation</div>
                <div className="text-gray-400 text-sm">Create short videos perfect for social media</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  
  if (!currentStepData) {
    return null;
  }

  const handleNext = () => {
    if (isLastStep) {
      router.push('/dashboard');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-primary-500 scale-125'
                    : index < currentStep
                    ? 'bg-primary-400'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-gray-400">
              {currentStepData.subtitle}
            </p>
          </div>

          <div className="mb-8">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
            >
              Skip onboarding
            </button>
            
            <div className="flex space-x-3">
              {!isLastStep && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                >
                  Next
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-medium transition-all"
              >
                {isLastStep ? 'Start Creating' : 'Continue'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}