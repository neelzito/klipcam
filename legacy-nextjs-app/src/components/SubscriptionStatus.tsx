import { Crown, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { User } from '@/types/database';
import Link from 'next/link';

interface SubscriptionStatusProps {
  user: User;
  showDetails?: boolean;
  className?: string;
}

export function SubscriptionStatus({ user, showDetails = false, className = '' }: SubscriptionStatusProps) {
  const isPro = user.plan === 'pro';
  const isTrial = user.plan === 'trial';
  
  const getStatusColor = () => {
    if (isPro) return 'text-green-400';
    if (isTrial) return 'text-yellow-400';
    return 'text-gray-400';
  };
  
  const getStatusIcon = () => {
    if (isPro) return <Crown className="w-5 h-5 text-green-400" />;
    if (isTrial) return <Clock className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };
  
  const getStatusText = () => {
    if (isPro) return 'Pro';
    if (isTrial) return 'Trial';
    return 'Free';
  };
  
  const getBgColor = () => {
    if (isPro) return 'bg-green-500/20 border-green-500/20';
    if (isTrial) return 'bg-yellow-500/20 border-yellow-500/20';
    return 'bg-gray-500/20 border-gray-500/20';
  };
  
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isPro ? 'bg-green-500/20' : 
            isTrial ? 'bg-yellow-500/20' : 'bg-gray-500/20'
          }`}>
            {getStatusIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${getStatusColor()}`}>
                {getStatusText()} Plan
              </span>
              {isPro && <CheckCircle className="w-4 h-4 text-green-400" />}
            </div>
            {showDetails && (
              <div className="text-xs text-gray-400 mt-1">
                {isPro && user.subscription_current_period_end && (
                  <>Renews {new Date(user.subscription_current_period_end).toLocaleDateString()}</>
                )}
                {isTrial && user.trial_ends_at && (
                  <>Expires {new Date(user.trial_ends_at).toLocaleDateString()}</>
                )}
              </div>
            )}
          </div>
        </div>
        
        {!isPro && (
          <Link 
            href="/pricing" 
            className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>
      
      {showDetails && (
        <div className="mt-4 space-y-3">
          {isPro && (
            <div className={`p-3 rounded-lg ${getBgColor()}`}>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Pro Benefits Active</span>
              </div>
              <ul className="text-xs text-green-200/80 space-y-1">
                <li>• 900 credits per month</li>
                <li>• Premium AI models</li>
                <li>• Priority support</li>
                <li>• No watermarks</li>
              </ul>
            </div>
          )}
          
          {isTrial && user.trial_ends_at && (
            <div className={`p-3 rounded-lg ${getBgColor()}`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Trial Active</span>
              </div>
              <p className="text-xs text-yellow-200/80 mb-3">
                Your trial ends on {new Date(user.trial_ends_at).toLocaleDateString()}. 
                Don't lose access to your creations!
              </p>
              <Link 
                href="/pricing" 
                className="inline-block text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded font-medium transition-colors"
              >
                Upgrade Before Trial Ends
              </Link>
            </div>
          )}
          
          {user.subscription_id && (
            <div className="text-xs text-gray-500">
              Subscription ID: {user.subscription_id.substring(0, 16)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}