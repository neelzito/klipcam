"use client";
import { useState } from "react";
import { AssetGrid } from "@/components/AssetGrid";
import { useDemoAwareUser } from "@/hooks/useDemoAwareUser";
import { useDemoMode } from "@/components/DemoModeProvider";
import { Search, Grid, List } from "lucide-react";

type FilterType = 'all' | 'image' | 'video' | 'favorites';
type ViewMode = 'grid' | 'list';

export default function LibraryPage() {
  const { user, isLoading } = useDemoAwareUser();
  const { isDemoMode } = useDemoMode();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { key: 'all' as const, label: 'All', count: null },
    { key: 'image' as const, label: 'Images', count: null },
    { key: 'video' as const, label: 'Videos', count: null },
    { key: 'favorites' as const, label: 'Favorites', count: null },
  ];

  const getAssetGridProps = () => {
    const props: any = {};
    if (activeFilter === 'image' || activeFilter === 'video') {
      props.type = activeFilter;
    }
    if (activeFilter === 'favorites') {
      props.favorites = true;
    }
    return props;
  };

  if (isLoading) {
    const loadingCreatorMessages = [
      "Curating your creative empire...",
      "Organizing your viral arsenal...", 
      "Loading your content vault...",
      "Gathering your masterpieces..."
    ];
    const randomMessage = loadingCreatorMessages[Math.floor(Math.random() * loadingCreatorMessages.length)];

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Main spinner */}
            <div className="w-32 h-32 border-4 border-gray-700 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
            
            {/* Inner glow effect */}
            <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-t-secondary-500/50 rounded-full animate-spin mx-auto [animation-direction:reverse] [animation-duration:3s]"></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-pulse">🎨</div>
            </div>
            
            {/* Orbiting elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border border-primary-500/20 rounded-full relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg animate-bounce">✨</div>
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-lg animate-bounce [animation-delay:0.33s]">🚀</div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-lg animate-bounce [animation-delay:0.66s]">🎆</div>
                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 text-lg animate-bounce [animation-delay:1s]">📸</div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">{randomMessage}</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Your digital art gallery is getting ready for the spotlight
          </p>
          
          <div className="flex justify-center items-center space-x-1 mt-6">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Your Library</h1>
            <p className="text-gray-400 mt-2">Browse and manage all your generated content</p>
            {user && (
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
                <span>{user.credit_balance} credits remaining</span>
                <span>•</span>
                <span>{user.total_credits_used} total credits used</span>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 mt-4 lg:mt-0">
            <div className="flex bg-gray-900/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your creations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-xl w-fit">
            {filters.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === key
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
                {count !== null && (
                  <span className="ml-1 text-xs opacity-75">({count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Grid */}
        <AssetGrid {...getAssetGridProps()} />
      </div>
    </div>
  );
}