'use client';

import { useDemoAwareUser } from '@/hooks/useDemoAwareUser';
import { useDemoMode } from '@/components/DemoModeProvider';
import { DemoAwareUserButton } from '@/components/DemoAwareUserButton';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Bell,
  Shield,
  User,
  Palette
} from 'lucide-react';

export default function SettingsPage() {
  const { user, clerkUser, isLoading, error } = useDemoAwareUser();
  const { isDemoMode } = useDemoMode();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

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

  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400">You need to sign in to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-400 mt-2">
              Manage your account, subscription, and preferences
            </p>
          </div>
          <DemoAwareUserButton 
            appearance={{
              elements: {
                avatarBox: "w-12 h-12",
              }
            }}
          />
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-800 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Profile</h2>
                <p className="text-sm text-gray-400">Your account information</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <div className="p-3 bg-gray-800 rounded-lg text-white">
                    {user.first_name || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <div className="p-3 bg-gray-800 rounded-lg text-white">
                    {user.last_name || 'Not set'}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="p-3 bg-gray-800 rounded-lg text-white">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-sm text-gray-400">
                  To update your profile information, use the profile button in the top right corner.
                </p>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Subscription & Billing</h2>
                <p className="text-sm text-gray-400">Manage your subscription and payment methods</p>
              </div>
            </div>

            <SubscriptionManager />
          </section>

          {/* Preferences Section */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Palette className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Preferences</h2>
                <p className="text-sm text-gray-400">Customize your KlipCam experience</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Default Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-3 bg-primary-500/20 border border-primary-500/50 rounded-lg text-center text-white">
                      <div className="text-sm font-medium">1:1</div>
                      <div className="text-xs text-gray-400">Square</div>
                    </button>
                    <button className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-center text-gray-300 hover:border-gray-600">
                      <div className="text-sm font-medium">9:16</div>
                      <div className="text-xs text-gray-400">Portrait</div>
                    </button>
                    <button className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-center text-gray-300 hover:border-gray-600">
                      <div className="text-sm font-medium">16:9</div>
                      <div className="text-xs text-gray-400">Landscape</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                      Auto-upscale images
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                      />
                      <div className="block bg-gray-700 w-14 h-8 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                    </div>
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Automatically upscale images to IG-ready formats (costs 4 additional credits)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Bell className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
                <p className="text-sm text-gray-400">Control what notifications you receive</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">
                        Generation completed
                      </span>
                      <p className="text-xs text-gray-400">Get notified when your images/videos are ready</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked
                      />
                      <div className="block bg-primary-600 w-14 h-8 rounded-full"></div>
                      <div className="dot absolute right-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">
                        Credits low warning
                      </span>
                      <p className="text-xs text-gray-400">Alert when you have less than 10 credits remaining</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked
                      />
                      <div className="block bg-primary-600 w-14 h-8 rounded-full"></div>
                      <div className="dot absolute right-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">
                        Marketing emails
                      </span>
                      <p className="text-xs text-gray-400">Tips, new features, and promotional content</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                      />
                      <div className="block bg-gray-700 w-14 h-8 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Account Stats */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <SettingsIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Account Statistics</h2>
                <p className="text-sm text-gray-400">Your KlipCam usage overview</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-400 mb-2">
                    {user.total_credits_used}
                  </div>
                  <div className="text-sm text-gray-400">Total Credits Used</div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-400 mb-2">
                    {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-400">Days Active</div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {user.credit_balance}
                  </div>
                  <div className="text-sm text-gray-400">Credits Remaining</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}