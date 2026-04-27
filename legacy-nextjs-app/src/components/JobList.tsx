"use client";
import { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle, XCircle, Loader2, Play, Image, Video, Zap } from "lucide-react";

type Job = {
  id: string;
  type: string;
  status: "pending" | "processing" | "completed" | "failed";
  prompt?: string;
  aspect_ratio?: string;
  replicate_model?: string;
  estimated_cost?: number;
  actual_cost?: number;
  output_urls?: string[];
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  generation_params?: any;
};

type JobListProps = {
  limit?: number;
  type?: string;
  status?: string;
};

// Check if we're in demo mode
const isDemoMode = () => {
  return process.env.NEXT_PUBLIC_APP_ENV === 'demo' || 
         (typeof window !== 'undefined' && window?.location?.search?.includes('demo=true'));
};

export function JobList({ limit = 10, type, status }: JobListProps = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const demoMode = isDemoMode();

  const prevStatusesRef = useRef<Record<string, Job["status"]>>({});

  async function fetchJobs() {
    try {
      setError(null);
      
      // In demo mode, return empty jobs immediately
      if (demoMode) {
        setJobs([]);
        return;
      }
      
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
      
      const nextJobs: Job[] = data.jobs ?? [];
      
      // Emit toasts on status transitions
      nextJobs.forEach((j) => {
        const prev = prevStatusesRef.current[j.id];
        if (prev && prev !== j.status && (j.status === "completed" || j.status === "failed")) {
          // Create a custom event for toast notifications
          const event = new CustomEvent('job-status-change', {
            detail: { status: j.status, jobId: j.id, job: j }
          });
          window.dispatchEvent(event);
        }
      });
      
      // Save latest statuses
      const map: Record<string, Job["status"]> = {};
      nextJobs.forEach((j) => (map[j.id] = j.status));
      prevStatusesRef.current = map;
      setJobs(nextJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    }
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  function getJobIcon(job: Job) {
    if (job.type === 'video') return Video;
    if (job.type === 'upscale') return Zap;
    return Image;
  }

  function getJobTitle(job: Job): string {
    if (job.prompt) {
      return job.prompt.length > 50 
        ? job.prompt.substring(0, 50) + '...' 
        : job.prompt;
    }
    
    const typeMap: Record<string, string> = {
      image: 'Image Generation',
      video: 'Video Generation', 
      upscale: 'Image Upscale',
    };
    
    return typeMap[job.type] || job.type;
  }

  useEffect(() => {
    fetchJobs().finally(() => setLoading(false));
    
    // Only set up polling in non-demo mode
    if (!demoMode) {
      const id = setInterval(fetchJobs, 5000); // Poll every 5 seconds for active jobs
      return () => clearInterval(id);
    }
  }, [limit, type, status, demoMode]);

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-700 rounded w-16"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 bg-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">Failed to load jobs</div>
        <div className="text-gray-400 text-sm mb-4">{error}</div>
        <button 
          onClick={() => fetchJobs()}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!jobs.length) {
    const emptyJobMessages = [
      {
        emoji: "🎆",
        title: "Your creative lab is ready",
        subtitle: "Time to make some AI magic happen!"
      },
      {
        emoji: "⚙️",
        title: "The content factory awaits",
        subtitle: "Your next viral hit is just a click away"
      },
      {
        emoji: "🚀",
        title: "Ready for takeoff?",
        subtitle: "Start creating and watch your jobs appear here"
      }
    ];
    const randomIndex = Math.floor(Math.random() * emptyJobMessages.length);
    const randomMessage = emptyJobMessages[randomIndex] || {
      emoji: "🤖",
      title: "Ready to create?",
      subtitle: "Your jobs will appear here"
    };

    return (
      <div className="text-center py-12">
        <div className="relative mb-4">
          <div className="text-6xl animate-bounce">{randomMessage.emoji}</div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-gradient-to-r from-primary-500/40 to-secondary-500/40 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2">{randomMessage.title}</h3>
        <p className="text-gray-400 mb-6">{randomMessage.subtitle}</p>
        
        <div className="space-y-3">
          <a 
            href="/dashboard" 
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-medium rounded-lg transition-all transform hover:scale-105"
          >
            <span>🎨</span>
            <span>Start Creating</span>
            <span>→</span>
          </a>
        </div>
        
        <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <span>⚡</span>
            <span>5-min generations</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span>🎆</span>
            <span>IG-ready results</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const Icon = getJobIcon(job);
        return (
          <div key={job.id} className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {getJobTitle(job)}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                    <span>{job.replicate_model?.split('/')?.[1] || job.type}</span>
                    {job.aspect_ratio && (
                      <>
                        <span>•</span>
                        <span>{job.aspect_ratio}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatTimeAgo(job.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <StatusBadge status={job.status} />
                <div className="text-sm text-gray-400">
                  {job.actual_cost || job.estimated_cost} cr
                </div>
              </div>
            </div>
            
            {/* Progress/Results */}
            {job.status === 'processing' && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-pulse"></div>
                <div className="relative flex items-center space-x-3 text-blue-400 text-sm">
                  <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <div className="absolute inset-0 w-5 h-5 border border-blue-400/30 rounded-full animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Creating magic</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                      </div>
                      <span className="animate-pulse">✨</span>
                    </div>
                    {job.started_at && (
                      <div className="text-blue-300/80 text-xs mt-1">
                        🚀 Started {formatTimeAgo(job.started_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {job.status === 'completed' && job.output_urls && job.output_urls.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-2">
                  {job.output_urls.length} file{job.output_urls.length > 1 ? 's' : ''} generated
                  {job.completed_at && ` • Completed ${formatTimeAgo(job.completed_at)}`}
                </div>
                <div className="flex space-x-2 overflow-x-auto">
                  {job.output_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="flex-shrink-0">
                      {job.type === 'video' ? (
                        <div className="relative w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                          <Play className="w-4 h-4 text-gray-400" />
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          alt={`Output ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ))}
                  {job.output_urls.length > 4 && (
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">
                      +{job.output_urls.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {job.status === 'failed' && job.error_message && (
              <div className="mt-3 p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-lg">😅</div>
                  <div className="flex-1">
                    <div className="text-red-400 text-sm font-medium mb-1">
                      Oops! The AI had a creative block
                    </div>
                    <details className="group cursor-pointer">
                      <summary className="text-red-300/80 text-xs hover:text-red-300 transition-colors">
                        <span className="group-open:rotate-90 inline-block transition-transform">▶</span> What happened?
                      </summary>
                      <div className="mt-2 text-xs text-red-300/70 font-mono bg-red-900/20 p-2 rounded break-all">
                        {job.error_message}
                      </div>
                    </details>
                    {job.completed_at && (
                      <div className="text-red-300/60 text-xs mt-2 flex items-center space-x-1">
                        <span>🕰️</span>
                        <span>Failed {formatTimeAgo(job.completed_at)}</span>
                        <span>•</span>
                        <button className="text-primary-400 hover:text-primary-300 underline" onClick={() => window.location.reload()}>
                          Try again?
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: Job["status"] }) {
  const config = {
    pending: {
      icon: Clock,
      bg: "bg-gray-600",
      text: "text-gray-200",
      label: "Pending"
    },
    processing: {
      icon: Loader2,
      bg: "bg-blue-600",
      text: "text-blue-100", 
      label: "Processing",
      animate: "animate-spin"
    },
    completed: {
      icon: CheckCircle,
      bg: "bg-green-600",
      text: "text-green-100",
      label: "Completed"
    },
    failed: {
      icon: XCircle,
      bg: "bg-red-600",
      text: "text-red-100",
      label: "Failed"
    },
  } as const;
  
  const statusConfig = config[status] || config.pending;
  const { icon: Icon, bg, text, label } = statusConfig;
  const animate = 'animate' in statusConfig ? statusConfig.animate : '';
  
  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${bg} ${text}`}>
      <Icon className={`w-3 h-3 ${animate || ''}`} />
      <span>{label}</span>
    </div>
  );
}


