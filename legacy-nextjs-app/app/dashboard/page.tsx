"use client";
import { useState, useEffect, Suspense } from "react";
import { useDemoAwareUser } from "@/hooks/useDemoAwareUser";
import { useDemoMode } from "@/components/DemoModeProvider";
import { DemoAwareUserButton } from '@/components/DemoAwareUserButton';
import { JobList } from "@/components/JobList";
import { AssetGrid } from "@/components/AssetGrid";
import { CreditCard, User, TrendingUp, AlertTriangle, Zap, Archive, Calendar, Award } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function DashboardContent() {
  const { user, clerkUser, isLoading, error } = useDemoAwareUser();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Check authentication - in demo mode we need user, in production we need user
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400">You need to sign in to access your dashboard</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <h3 className="text-sm font-bold text-yellow-300">Demo Mode</h3>
                <p className="text-xs text-yellow-200/80">
                  This is a demo version. Features are limited and no real processing occurs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header with User Info */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Welcome back, {user.first_name || clerkUser.firstName}!
            </h1>
            <p className="text-gray-400 mt-2">Here's your account overview and recent activity</p>
          </div>
          <DemoAwareUserButton 
            appearance={{
              elements: {
                avatarBox: "w-12 h-12",
              }
            }}
          />
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{user.credit_balance}</p>
                <p className="text-xs text-gray-400">Credits Available</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-secondary-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-secondary-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{user.total_credits_used}</p>
                <p className="text-xs text-gray-400">Credits Used</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                user.plan === 'trial' 
                  ? 'bg-yellow-500/20' 
                  : 'bg-green-500/20'
              }`}>
                <User className={`w-5 h-5 ${
                  user.plan === 'trial' 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
                }`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white capitalize">{user.plan}</p>
                <p className="text-xs text-gray-400">Plan Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Upgrade Prompt */}
        {user.plan === 'trial' && user.credit_balance < 5 && (
          <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Running low on credits?</h3>
                <p className="text-gray-300 mb-4">
                  You have {user.credit_balance} credits left. Upgrade to Pro for 900 monthly credits and unlimited creation!
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <span>Upgrade to Pro</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/create" className="bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-2xl p-6 hover:from-primary-500/30 hover:to-secondary-500/30 transition-all group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-primary-500/20 rounded-lg group-hover:bg-primary-500/30 transition-all">
                <Zap className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="font-semibold text-white">Create New</h3>
            </div>
            <p className="text-sm text-gray-400">Transform photos with AI styles and viral effects</p>
          </Link>

          <Link href="/library" className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-800/50 transition-all group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50 transition-all">
                <Archive className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-semibold text-white">View Library</h3>
            </div>
            <p className="text-sm text-gray-400">Browse and manage your generated content</p>
          </Link>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">This Month</h3>
            </div>
            <p className="text-lg font-bold text-white">{user.total_credits_used}</p>
            <p className="text-xs text-gray-400">Credits Used</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-white">Achievement</h3>
            </div>
            <p className="text-sm font-medium text-white">Creator</p>
            <p className="text-xs text-gray-400">First generation complete</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Jobs</h2>
              <Link href="/library" className="text-sm text-primary-400 hover:text-primary-300">
                View All
              </Link>
            </div>
            <JobList />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Assets</h2>
              <Link href="/library" className="text-sm text-primary-400 hover:text-primary-300">
                View All
              </Link>
            </div>
            <AssetGrid limit={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

