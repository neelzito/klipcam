"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Zap, Heart, Download } from "lucide-react";

type ToastType = 'success' | 'error' | 'warning' | 'info';
type Toast = {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  emoji?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Toast) => {
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove toast
    setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const handler = (e: MessageEvent | CustomEvent) => {
      // Handle MessageEvent (from WebSocket or similar)
      if ('data' in e && typeof e.data === "object" && e.data?.type === "job-status") {
        const { status } = e.data;
        const toastId = Date.now().toString();
        
        if (status === "succeeded" || status === "completed") {
          addToast({
            id: toastId,
            type: 'success',
            message: "Your creation is ready!",
            description: "Another masterpiece added to your collection",
            emoji: "🎉",
            action: {
              label: "View it",
              onClick: () => window.location.href = '/library'
            }
          });
        }
        
        if (status === "failed") {
          addToast({
            id: toastId,
            type: 'error', 
            message: "Oops! The AI had a hiccup",
            description: "Don't worry, we've refunded your credits",
            emoji: "😅",
            action: {
              label: "Try again",
              onClick: () => window.location.href = '/dashboard'
            }
          });
        }
      }
      
      // Handle custom job status events from JobList component
      if ('detail' in e && e.detail) {
        const { status, job } = e.detail;
        const toastId = Date.now().toString();
        
        if (status === "completed") {
          addToast({
            id: toastId,
            type: 'success',
            message: "Content generated!",
            description: job?.prompt ? `"${job.prompt.slice(0, 30)}..." is ready` : "Your creation is complete",
            emoji: "✨",
            duration: 5000
          });
        }
        
        if (status === "failed") {
          addToast({
            id: toastId,
            type: 'error',
            message: "Generation failed", 
            description: "Credits refunded automatically",
            emoji: "🔄",
            duration: 4000
          });
        }
      }
    };
    
    // Handle custom toast events
    const customToastHandler = (e: CustomEvent) => {
      if (e.detail) {
        const toastId = Date.now().toString();
        addToast({
          id: toastId,
          type: e.detail.type,
          message: e.detail.message,
          description: e.detail.description,
          emoji: e.detail.emoji,
          duration: e.detail.duration,
          action: e.detail.action
        });
      }
    };
    
    window.addEventListener("message", handler);
    window.addEventListener("job-status-change", handler as EventListener);
    window.addEventListener('custom-toast', customToastHandler as EventListener);
    
    return () => {
      window.removeEventListener("message", handler);
      window.removeEventListener("job-status-change", handler as EventListener);
      window.removeEventListener('custom-toast', customToastHandler as EventListener);
    };
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400';
      case 'error':
        return 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20 text-red-400';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 text-yellow-400';
      case 'info':
        return 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-900/90 border-gray-700 text-white';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return XCircle;
      case 'warning':
        return AlertCircle;
      case 'info':
        return Zap;
      default:
        return AlertCircle;
    }
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => {
        const Icon = getToastIcon(toast.type);
        
        return (
          <div
            key={toast.id}
            className={`
              backdrop-blur-lg border rounded-xl p-4 shadow-2xl
              transform transition-all duration-300 ease-out
              animate-in slide-in-from-right-full
              ${getToastStyles(toast.type)}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 flex items-center space-x-2">
                {toast.emoji && (
                  <span className="text-xl animate-bounce">{toast.emoji}</span>
                )}
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{toast.message}</p>
                {toast.description && (
                  <p className="text-sm opacity-80 mt-1">{toast.description}</p>
                )}
                
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-2 text-xs font-medium px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur"
                  >
                    {toast.action.label} →
                  </button>
                )}
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white/60 hover:text-white/80 transition-colors p-1"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to trigger custom toasts from anywhere in the app
export const showToast = {
  success: (message: string, description?: string, action?: Toast['action']) => {
    const event = new CustomEvent('custom-toast', {
      detail: {
        type: 'success',
        message,
        description,
        action,
        emoji: '🎉'
      }
    });
    window.dispatchEvent(event);
  },
  
  error: (message: string, description?: string, action?: Toast['action']) => {
    const event = new CustomEvent('custom-toast', {
      detail: {
        type: 'error',
        message,
        description, 
        action,
        emoji: '😅'
      }
    });
    window.dispatchEvent(event);
  },
  
  viral: (message: string, description?: string) => {
    const event = new CustomEvent('custom-toast', {
      detail: {
        type: 'success',
        message,
        description,
        emoji: '🔥',
        duration: 6000
      }
    });
    window.dispatchEvent(event);
  },

  magic: (message: string, description?: string) => {
    const event = new CustomEvent('custom-toast', {
      detail: {
        type: 'info',
        message,
        description,
        emoji: '✨',
        duration: 5000
      }
    });
    window.dispatchEvent(event);
  }
};

