"use client";
import { useEffect, useState } from "react";
import { Download, Heart, MoreVertical, Play, Calendar, Clock } from "lucide-react";
import { useDemoAwareUser } from "@/hooks/useDemoAwareUser";

type Asset = {
  id: string;
  type: "image" | "video";
  filename: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  duration?: number;
  download_url: string;
  thumbnail_url?: string;
  is_favorite: boolean;
  is_watermarked: boolean;
  download_count: number;
  expires_at?: string;
  created_at: string;
  job?: {
    id: string;
    type: string;
    prompt?: string;
    aspect_ratio?: string;
    replicate_model?: string;
    estimated_cost?: number;
  };
};

type AssetGridProps = {
  type?: 'image' | 'video';
  favorites?: boolean;
  limit?: number;
};

// Check if we're in demo mode
const isDemoMode = () => {
  return process.env.NEXT_PUBLIC_APP_ENV === 'demo' || 
         (typeof window !== 'undefined' && window?.location?.search?.includes('demo=true'));
};

export function AssetGrid({ type, favorites, limit = 20 }: AssetGridProps = {}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user, isLoading: authLoading } = useDemoAwareUser();
  const demoMode = isDemoMode();

  async function fetchAssets(pageNum: number = 1, reset: boolean = true) {
    try {
      setError(null);
      
      // In demo mode, return empty assets immediately
      if (demoMode) {
        setAssets([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      // Don't fetch if still loading auth or user not authenticated
      if (authLoading || !user) {
        console.log('⏳ Waiting for authentication...');
        return;
      }
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });
      
      if (type) params.append('type', type);
      if (favorites) params.append('favorites', 'true');
      
      const res = await fetch(`/api/assets?${params}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch assets');
      }
      
      const newAssets = data.assets || [];
      
      if (reset) {
        setAssets(newAssets);
      } else {
        setAssets(prev => [...prev, ...newAssets]);
      }
      
      setHasMore(data.pagination?.pages > pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(assetId: string) {
    // This would require implementing the favorite API endpoint
    console.log('Toggle favorite for asset:', assetId);
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  useEffect(() => {
    // Only fetch when not loading auth and user is available (or in demo mode)
    if (!authLoading && (user || demoMode)) {
      fetchAssets(1, true);
    }
  }, [type, favorites, limit, demoMode, authLoading, user]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAssets(nextPage, false);
    }
  };

  if ((loading && assets.length === 0) || authLoading) {
    const loadingMessages = authLoading ? [
      "Authenticating your account...",
      "Securing your creative vault...",
      "Preparing your personal library..."
    ] : [
      "Cooking up your masterpieces...",
      "Finding your viral moments...",
      "Curating your creative gems...",
      "Gathering your content magic...",
      "Assembling your visual stories..."
    ];
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="relative">
            <div className="text-6xl animate-bounce">🎨</div>
            <div className="absolute inset-0 text-6xl animate-pulse opacity-30">✨</div>
          </div>
          <p className="text-lg text-gray-300 mt-4 font-medium">{randomMessage}</p>
          <div className="flex justify-center items-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-900/50 rounded-2xl overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 animate-pulse"></div>
                <div className="absolute bottom-2 right-2 text-2xl animate-spin">🎆</div>
              </div>
              <div className="p-4">
                <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-2/3 animate-pulse [animation-delay:0.2s]"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show authentication required message if not authenticated and not in demo mode
  if (!authLoading && !user && !demoMode) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
        <p className="text-gray-400 mb-6">Please sign in to view your generated assets</p>
        <button 
          onClick={() => window.location.href = '/sign-in'}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (error) {
    const errorQuips = [
      "Oops, our pixels went on a coffee break ☕",
      "Houston, we have a (minor) problem 🚀",
      "The creative gremlins are at it again 🎭",
      "Our servers are having a moment... 🤖",
      "Plot twist: The internet hiccupped 📡"
    ];
    const randomQuip = errorQuips[Math.floor(Math.random() * errorQuips.length)];

    return (
      <div className="text-center py-12">
        <div className="relative mb-6">
          <div className="text-6xl animate-bounce">😅</div>
          <div className="absolute -top-2 -right-2 text-2xl animate-pulse">💥</div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{randomQuip}</h3>
        <p className="text-gray-400 mb-2">Don't worry, your creations are safe!</p>
        <div className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          <details className="cursor-pointer hover:text-gray-400 transition-colors">
            <summary className="font-mono">Tech details (for the curious)</summary>
            <p className="mt-2 text-xs">{error}</p>
          </details>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => fetchAssets(1, true)}
            className="group px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-medium rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            <span className="inline-flex items-center space-x-2">
              <span>🔄</span>
              <span>Give it another shot</span>
              <span className="group-hover:animate-spin">✨</span>
            </span>
          </button>
          
          <p className="text-xs text-gray-500">
            Still stuck? <a href="/support" className="text-primary-400 hover:text-primary-300 underline">We're here to help</a>
          </p>
        </div>
      </div>
    );
  }

  if (!assets.length) {
    const emptyStateMessages = {
      image: {
        favorites: {
          emoji: "💝",
          title: "No favorites yet?",
          subtitle: "Time to find your next viral hit!",
          cta: "Browse your creations",
          link: "/library"
        },
        regular: {
          emoji: "🎨",
          title: "Your creative canvas awaits",
          subtitle: "Transform your selfies into IG-ready masterpieces in under 5 minutes!",
          cta: "Create your first image",
          link: "/dashboard"
        }
      },
      video: {
        favorites: {
          emoji: "🎬",
          title: "No favorite videos yet",
          subtitle: "Your next TikTok hit is waiting to be created!",
          cta: "Browse your videos",
          link: "/create"
        },
        regular: {
          emoji: "🎬",
          title: "Lights, camera, action!",
          subtitle: "Create viral-ready video content that stops the scroll",
          cta: "Make your first video",
          link: "/create"
        }
      },
      all: {
        favorites: {
          emoji: "⭐",
          title: "Nothing starred yet",
          subtitle: "Heart the creations you love to find them here!",
          cta: "Explore your library",
          link: "/library"
        },
        regular: {
          emoji: "✨",
          title: "Your creative journey starts here",
          subtitle: "Join thousands of creators making viral content with AI",
          cta: "Start creating",
          link: "/dashboard"
        }
      }
    };

    const stateKey = type || 'all';
    const messageSet = favorites 
      ? emptyStateMessages[stateKey]?.favorites ?? emptyStateMessages['all'].favorites
      : emptyStateMessages[stateKey]?.regular ?? emptyStateMessages['all'].regular;

    return (
      <div className="text-center py-16">
        <div className="relative mb-6">
          <div className="text-8xl animate-bounce">{messageSet?.emoji}</div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-2 bg-gradient-to-r from-primary-500/30 to-secondary-500/30 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">
          {messageSet?.title}
        </h3>
        <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
          {messageSet?.subtitle}
        </p>
        
        <a
          href={messageSet?.link ?? '/dashboard'}
          className="group inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        >
          <span className="text-lg">🚀</span>
          <span>{messageSet?.cta}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
        
        <div className="mt-6 text-xs text-gray-500">
          <span className="inline-flex items-center space-x-1">
            <span>👥</span>
            <span>Join 10,000+ creators already making viral content</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden group hover:border-gray-700 transition-all">
            {/* Asset Preview */}
            <div className="relative aspect-square bg-gray-800">
              {asset.type === 'image' ? (
                asset.download_url ? (
                  <img 
                    src={asset.thumbnail_url || asset.download_url} 
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🖼️</span>
                  </div>
                )
              ) : (
                <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
                  {asset.thumbnail_url ? (
                    <img 
                      src={asset.thumbnail_url} 
                      alt={asset.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-4xl">🎬</span>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-1" />
                    </div>
                  </div>
                  {asset.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                      {asset.duration}s
                    </div>
                  )}
                </div>
              )}
              
              {/* Watermark indicator */}
              {asset.is_watermarked && (
                <div className="absolute top-2 left-2 bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded text-xs text-yellow-400">
                  Trial
                </div>
              )}
              
              {/* Quick actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button
                    onClick={() => toggleFavorite(asset.id)}
                    className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
                      asset.is_favorite 
                        ? 'bg-red-500/80 text-white' 
                        : 'bg-black/40 text-gray-300 hover:bg-black/60'
                    }`}
                  >
                    <Heart className="w-4 h-4" fill={asset.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button className="w-8 h-8 bg-black/40 backdrop-blur-sm text-gray-300 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Asset Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {asset.job?.prompt ? 
                      asset.job.prompt.slice(0, 40) + (asset.job.prompt.length > 40 ? '...' : '') :
                      asset.filename
                    }
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(asset.created_at)}</span>
                    {asset.file_size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(asset.file_size)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Generation details */}
              {asset.job && (
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span className="px-2 py-1 bg-gray-800 rounded">
                    {asset.job.replicate_model?.split('/')?.[1] || asset.type}
                  </span>
                  {asset.job.estimated_cost && (
                    <span>{asset.job.estimated_cost} credits</span>
                  )}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex space-x-2">
                <a
                  href={asset.download_url}
                  download={asset.filename}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
                {asset.type === 'image' && (
                  <button className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                    Upscale
                  </button>
                )}
              </div>
              
              {/* Expiry warning */}
              {asset.expires_at && (
                <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center space-x-1 text-xs text-yellow-400">
                    <Clock className="w-3 h-3" />
                    <span>Expires {formatDate(asset.expires_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
                <span>Loading more magic...</span>
                <span className="animate-bounce">✨</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🔥</span>
                <span>Load More</span>
                <span>🔥</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}




