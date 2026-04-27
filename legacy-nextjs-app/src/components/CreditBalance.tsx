import { CreditCard, Zap, AlertTriangle } from 'lucide-react';
import { User } from '@/types/database';
import Link from 'next/link';

interface CreditBalanceProps {
  user: User;
  showDetails?: boolean;
  className?: string;
}

export function CreditBalance({ user, showDetails = false, className = '' }: CreditBalanceProps) {
  const isLowBalance = user.credit_balance < 10;
  const isVeryLowBalance = user.credit_balance < 5;
  
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isVeryLowBalance ? 'bg-red-500/20' : 
            isLowBalance ? 'bg-yellow-500/20' : 'bg-violet-500/20'
          }`}>
            {isVeryLowBalance ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <Zap className={`w-5 h-5 ${
                isLowBalance ? 'text-yellow-400' : 'text-violet-400'
              }`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${
                isVeryLowBalance ? 'text-red-400' : 
                isLowBalance ? 'text-yellow-400' : 'text-white'
              }`}>
                {user.credit_balance.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400">credits</span>
            </div>
            {showDetails && (
              <div className="text-xs text-gray-500 mt-1">
                Used: {user.total_credits_used || 0} • Purchased: {user.total_credits_purchased || 0}
              </div>
            )}
          </div>
        </div>
        
        {(isLowBalance && user.plan === 'trial') && (
          <Link 
            href="/pricing" 
            className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Get More
          </Link>
        )}
      </div>
      
      {showDetails && isVeryLowBalance && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">Low Credit Balance</span>
          </div>
          <p className="text-xs text-red-200/80 mb-3">
            You're running low on credits. Upgrade to Pro or purchase more credits to continue creating.
          </p>
          <div className="flex gap-2">
            <Link 
              href="/pricing" 
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-medium transition-colors"
            >
              Upgrade to Pro
            </Link>
            <Link 
              href="/billing" 
              className="text-xs border border-red-500/30 text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded font-medium transition-colors"
            >
              Buy Credits
            </Link>
          </div>
        </div>
      )}
      
      {showDetails && user.plan === 'trial' && user.trial_ends_at && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">Trial Account</span>
          </div>
          <p className="text-xs text-yellow-200/80">
            Trial ends {new Date(user.trial_ends_at).toLocaleDateString()}. 
            Upgrade to Pro for 900 monthly credits!
          </p>
        </div>
      )}
    </div>
  );
}