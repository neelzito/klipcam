import { isProduction } from '@/lib/env';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_LOCKED = 'account_locked',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  API_ABUSE = 'api_abuse',
  WEBHOOK_VERIFICATION_FAILED = 'webhook_verification_failed',
  VALIDATION_ERROR = 'validation_error',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  MALICIOUS_FILE_UPLOAD = 'malicious_file_upload',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  IP_BLOCKED = 'ip_blocked',
  DEMO_MODE_VIOLATION = 'demo_mode_violation',
  CREDIT_MANIPULATION = 'credit_manipulation',
  PAYMENT_FRAUD = 'payment_fraud',
  SUBSCRIPTION_ABUSE = 'subscription_abuse',
}

export const SecurityMonitor = {
  logLoginAttempt: (success: boolean, userId?: string, ip?: string) => {
    console.log(`Login attempt: ${success ? 'SUCCESS' : 'FAILED'} for user ${userId || 'anonymous'} from ${ip || 'unknown'}`);
  },
  
  logUnauthorizedAccess: (resource: string, userId?: string, ip?: string) => {
    console.warn(`Unauthorized access attempt to ${resource} by user ${userId || 'anonymous'} from ${ip || 'unknown'}`);
  },
  
  logRateLimitExceeded: (endpoint: string, limit: number, ip?: string) => {
    console.warn(`Rate limit exceeded for ${endpoint} (limit: ${limit}) from ${ip || 'unknown'}`);
  },
  
  logSuspiciousActivity: (activity: string, details: Record<string, any>, userId?: string, ip?: string) => {
    console.warn(`Suspicious activity: ${activity}`, { details, userId, ip });
  },
};