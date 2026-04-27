'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const { user, clerkUser, isLoading } = useUser();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user || !clerkUser) {
      // Redirect to sign-up if not authenticated
      window.location.href = '/sign-up';
      return;
    }

    setIsCheckoutLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1234567890',
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Error creating checkout session: ' + error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout process');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const features = {
    trial: [
      '10 trial credits',
      '6 preset styles',
      'Base quality images',
      'Text-to-image generation',
      'Watermarked outputs',
      '7-day trial period',
    ],
    pro: [
      '900 monthly credits',
      '20+ premium preset styles',
      'Ultra high-quality images',
      'Text-to-image generation',
      'Image-to-image generation',
      'Video generation',
      'Spider effects',
      'No watermarks',
      'Priority processing',
      'Customer support',
      'Early access to features',
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Choose the plan that fits your creative needs. Start with a free trial, upgrade anytime.
            </p>
            
            {user && user.plan === 'trial' && (
              <div className="inline-flex items-center space-x-2 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-sm mb-8">
                <Sparkles className="w-4 h-4" />
                <span>You're currently on the trial plan ({user.credit_balance} credits remaining)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Trial Plan */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-700/50 rounded-lg">
                <Sparkles className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Trial</h3>
                <p className="text-gray-400">Perfect for trying out KlipCam</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-white">Free</span>
                <span className="text-gray-400">for 7 days</span>
              </div>
              <p className="text-gray-400 mt-2">Then $9/month</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.trial.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={user?.plan === 'trial'}
              className="w-full py-4 px-6 rounded-xl border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user?.plan === 'trial' ? 'Current Plan' : 'Start Free Trial'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-primary-500/20 to-secondary-500/20 border border-primary-500/50 rounded-3xl p-8 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Most Popular
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <Crown className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Pro</h3>
                <p className="text-gray-300">For serious content creators</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-gray-400">per month</span>
              </div>
              <p className="text-gray-300 mt-2">900 credits monthly (~150-225 images)</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.pro.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isCheckoutLoading || user?.plan === 'pro'}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isCheckoutLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : user?.plan === 'pro' ? (
                'Current Plan'
              ) : (
                <>
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Credits Breakdown */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Credit Costs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Base Images</h3>
              <p className="text-2xl font-bold text-primary-400 mb-1">1 credit</p>
              <p className="text-sm text-gray-400">Standard quality, fast generation</p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-secondary-500/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Premium Images</h3>
              <p className="text-2xl font-bold text-secondary-400 mb-1">4 credits</p>
              <p className="text-sm text-gray-400">Ultra high quality, detailed</p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Base Videos</h3>
              <p className="text-2xl font-bold text-green-400 mb-1">18 credits</p>
              <p className="text-sm text-gray-400">3-second clips, 480p</p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🕷️</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Spider Effects</h3>
              <p className="text-2xl font-bold text-orange-400 mb-1">25 credits</p>
              <p className="text-sm text-gray-400">Viral crawling effects</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-l-4 border-primary-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">What happens when my trial ends?</h3>
              <p className="text-gray-400">
                After your 7-day trial, you can upgrade to Pro for $9/month to continue creating. 
                Your generated content will remain accessible, but you'll need credits to create new content.
              </p>
            </div>

            <div className="border-l-4 border-primary-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time. You'll keep access to Pro features 
                until the end of your billing period.
              </p>
            </div>

            <div className="border-l-4 border-primary-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">Do unused credits roll over?</h3>
              <p className="text-gray-400">
                Currently, credits reset each month and don't roll over. We're working on credit banking 
                for future updates.
              </p>
            </div>

            <div className="border-l-4 border-primary-500 pl-6">
              <h3 className="text-xl font-semibold text-white mb-2">Is there a refund policy?</h3>
              <p className="text-gray-400">
                We offer a 14-day money-back guarantee if you're not satisfied with KlipCam Pro. 
                Contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}