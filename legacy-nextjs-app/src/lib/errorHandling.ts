export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiException extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function handleApiError(response: Response): Promise<never> {
  let errorData: any = {};
  
  try {
    errorData = await response.json();
  } catch {
    // If response doesn't have JSON, use status text
    errorData = { message: response.statusText || 'Unknown error' };
  }

  const message = errorData.error || errorData.message || 'An unexpected error occurred';
  const status = response.status;
  const code = errorData.code;
  const details = errorData.details;

  throw new ApiException(message, status, code, details);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export function logError(error: unknown, context?: string) {
  const errorMessage = getErrorMessage(error);
  const contextPrefix = context ? `[${context}] ` : '';
  
  console.error(`${contextPrefix}${errorMessage}`, error);
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }
}

export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    logError(error, context);
    return null;
  }
}

export function createApiErrorHandler(context: string) {
  return (error: unknown) => {
    logError(error, context);
    throw error;
  };
}

// Retry logic for failed API calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === retries) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

// Error types for better handling
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export function categorizeError(error: unknown): string {
  if (error instanceof ApiException) {
    switch (error.status) {
      case 400:
        return ErrorTypes.VALIDATION_ERROR;
      case 401:
        return ErrorTypes.AUTHENTICATION_ERROR;
      case 403:
        return ErrorTypes.AUTHORIZATION_ERROR;
      case 404:
        return ErrorTypes.NOT_FOUND_ERROR;
      case 429:
        return ErrorTypes.RATE_LIMIT_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorTypes.SERVER_ERROR;
      default:
        return ErrorTypes.UNKNOWN_ERROR;
    }
  }
  
  if (error instanceof Error && error.message.includes('fetch')) {
    return ErrorTypes.NETWORK_ERROR;
  }
  
  return ErrorTypes.UNKNOWN_ERROR;
}

// User-friendly error messages
export function getUserFriendlyMessage(error: unknown): string {
  const errorType = categorizeError(error);
  
  switch (errorType) {
    case ErrorTypes.NETWORK_ERROR:
      return 'Network error. Please check your connection and try again.';
    case ErrorTypes.VALIDATION_ERROR:
      return 'Invalid input. Please check your data and try again.';
    case ErrorTypes.AUTHENTICATION_ERROR:
      return 'Please sign in to continue.';
    case ErrorTypes.AUTHORIZATION_ERROR:
      return "You don't have permission to perform this action.";
    case ErrorTypes.NOT_FOUND_ERROR:
      return 'The requested resource was not found.';
    case ErrorTypes.RATE_LIMIT_ERROR:
      return 'Too many requests. Please wait a moment and try again.';
    case ErrorTypes.SERVER_ERROR:
      return 'Server error. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}