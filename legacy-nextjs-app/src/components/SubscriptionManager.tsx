'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { 
  CreditCard, 
  Calendar, 
  Crown, 
  ExternalLink,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

export function SubscriptionManager() {
  const { user, refetch } = useUser();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);

  const handleManageBilling = async () => {
    if (!user?.customer_id) {
      alert('No subscription found. Please subscribe first.');
      return;
    }

    setIsPortalLoading(true);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Error opening customer portal: ' + error);
        return;
      }

      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open customer portal');
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgradeLoading(true);

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
      setIsUpgradeLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const isTrialUser = user.plan === 'trial';
  const isProUser = user.plan === 'pro';
  const isCancelled = user.plan === 'cancelled';

  const trialEndDate = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const subscriptionEndDate = user.subscription_current_period_end 
    ? new Date(user.subscription_current_period_end) 
    : null;

  const isTrialExpiringSoon = trialEndDate && trialEndDate.getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000; // 2 days

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className={`rounded-2xl border p-6 ${
        isProUser 
          ? 'bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-primary-500/50' 
          : isTrialUser
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isProUser 
                ? 'bg-primary-500/20' 
                : isTrialUser 
                ? 'bg-yellow-500/20'
                : 'bg-red-500/20'
            }`}>
              {isProUser ? (
                <Crown className="w-6 h-6 text-primary-400" />
              ) : isTrialUser ? (
                <CreditCard className="w-6 h-6 text-yellow-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white capitalize">
                {user.plan} Plan
              </h3>
              <p className="text-sm text-gray-400">
                {isProUser && 'Unlimited creation with premium features'}
                {isTrialUser && `${user.credit_balance} credits remaining`}
                {isCancelled && 'Subscription cancelled'}
              </p>
            </div>
          </div>

          <div className="text-right">
            {isProUser && subscriptionEndDate && (
              <div>
                <p className="text-sm text-gray-400">Next billing</p>
                <p className="font-medium text-white">
                  {subscriptionEndDate.toLocaleDateString()}
                </p>
              </div>
            )}
            {isTrialUser && trialEndDate && (
              <div>
                <p className="text-sm text-gray-400">Trial expires</p>
                <p className={`font-medium ${isTrialExpiringSoon ? 'text-yellow-400' : 'text-white'}`}>
                  {trialEndDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trial Warning */}
        {isTrialUser && isTrialExpiringSoon && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-100 font-medium">Trial ending soon!</p>
            </div>
            <p className="text-yellow-200 text-sm mt-1">
              Upgrade to Pro to continue creating amazing content without interruption.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upgrade/Manage Button */}
        {isTrialUser || isCancelled ? (
          <button
            onClick={handleUpgrade}
            disabled={isUpgradeLoading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgradeLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Crown className="w-5 h-5" />
                <span>Upgrade to Pro</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleManageBilling}
            disabled={isPortalLoading}
            className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-700 hover:border-gray-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPortalLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Manage Billing</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {/* View Pricing */}
        <a
          href="/pricing"
          className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium rounded-lg transition-all"
        >
          <Calendar className="w-5 h-5" />
          <span>View All Plans</span>
        </a>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan Features */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h4 className="font-semibold text-white mb-4">Your Plan Includes</h4>
          <ul className="space-y-3">
            {isTrialUser && (
              <>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">10 trial credits</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">6 preset styles</span>
                </li>
                <li className="flex items-center space-x-3">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-gray-500">Premium features</span>
                </li>
                <li className="flex items-center space-x-3">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-gray-500">Video generation</span>
                </li>
              </>
            )}
            {isProUser && (
              <>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">900 monthly credits</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">20+ premium preset styles</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">Video generation</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">Priority support</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Usage Stats */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h4 className="font-semibold text-white mb-4">Usage This Month</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Credits Used</span>
              <span className="font-medium text-white">{user.total_credits_used}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Credits Remaining</span>
              <span className="font-medium text-primary-400">{user.credit_balance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Plan Status</span>
              <span className={`font-medium capitalize ${
                isProUser ? 'text-green-400' : 
                isTrialUser ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {user.plan}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}