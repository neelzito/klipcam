// Performance monitoring and analytics utilities
import React from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface UserEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
}

class Analytics {
  private metrics: PerformanceMetric[] = [];
  private events: UserEvent[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // Performance monitoring
  trackPerformance(name: string, value: number, metadata?: Record<string, unknown>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    
    // In production, send to analytics service
    this.sendMetric(metric);
  }

  // Track page load times
  trackPageLoad(pageName: string) {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Use Performance API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.startTime;
      this.trackPerformance('page_load', loadTime, { page: pageName });
    }
  }

  // Track API response times
  async trackApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.trackPerformance('api_call', duration, {
        endpoint,
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.trackPerformance('api_call', duration, {
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  // User event tracking
  trackEvent(event: string, properties?: Record<string, unknown>, userId?: string) {
    if (!this.isEnabled) return;

    const userEvent: UserEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId,
    };

    this.events.push(userEvent);
    this.sendEvent(userEvent);
  }

  // Common events
  trackImageGeneration(tier: string, userId?: string) {
    this.trackEvent('image_generation_started', { tier }, userId);
  }

  trackVideoGeneration(type: string, userId?: string) {
    this.trackEvent('video_generation_started', { type }, userId);
  }

  trackPresetSelection(presetId: string, category: string, userId?: string) {
    this.trackEvent('preset_selected', { presetId, category }, userId);
  }

  trackUpload(fileType: string, fileSize: number, userId?: string) {
    this.trackEvent('file_uploaded', { fileType, fileSize }, userId);
  }

  trackError(errorType: string, errorMessage: string, userId?: string) {
    this.trackEvent('error_occurred', { errorType, errorMessage }, userId);
  }

  // Web Vitals tracking
  trackWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Track Core Web Vitals when available
    if ('web-vitals' in window) {
      // This would require installing web-vitals package
      // For now, we'll use Performance Observer
      this.observePerformanceEntries();
    }
  }

  private observePerformanceEntries() {
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.trackPerformance('lcp', lastEntry.startTime);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        const eventEntry = entry as any; // First Input Delay entries have processingStart
        if (eventEntry.processingStart) {
          this.trackPerformance('fid', eventEntry.processingStart - entry.startTime);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let cumulativeLayoutShift = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cumulativeLayoutShift += entry.value;
        }
      });
      this.trackPerformance('cls', cumulativeLayoutShift);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  private sendMetric(metric: PerformanceMetric) {
    // In production, send to analytics service
    // Example: send to DataDog, New Relic, or custom endpoint
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }
  }

  private sendEvent(event: UserEvent) {
    // In production, send to analytics service
    // Example: send to Mixpanel, Amplitude, or custom endpoint
    if (process.env.NODE_ENV === 'development') {
      console.log('User Event:', event);
    }
  }

  // Batch operations for efficiency
  flush() {
    if (!this.isEnabled) return;

    if (this.metrics.length > 0) {
      // Send batch of metrics
      console.log('Flushing metrics:', this.metrics.length);
      this.metrics = [];
    }

    if (this.events.length > 0) {
      // Send batch of events
      console.log('Flushing events:', this.events.length);
      this.events = [];
    }
  }
}

// Singleton instance
export const analytics = new Analytics();

// React hook for tracking component performance
export function usePerformanceTracking(componentName: string) {
  const trackRender = () => {
    analytics.trackPerformance('component_render', performance.now(), {
      component: componentName,
    });
  };

  return { trackRender };
}

// Higher-order component for performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      analytics.trackPerformance('component_mount', renderTime, {
        component: componentName,
      });
    }, []);

    return <Component {...props} />;
  };
}

// Utility for measuring function execution time
export function measureExecution<T>(
  fn: () => T,
  operationName: string,
  metadata?: Record<string, unknown>
): T {
  const startTime = performance.now();
  const result = fn();
  const duration = performance.now() - startTime;
  
  analytics.trackPerformance(operationName, duration, metadata);
  
  return result;
}

// Async version
export async function measureAsyncExecution<T>(
  fn: () => Promise<T>,
  operationName: string,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;
  
  analytics.trackPerformance(operationName, duration, metadata);
  
  return result;
}

// Initialize analytics on app start
if (typeof window !== 'undefined') {
  analytics.trackWebVitals();
  
  // Flush analytics before page unload
  window.addEventListener('beforeunload', () => {
    analytics.flush();
  });
}