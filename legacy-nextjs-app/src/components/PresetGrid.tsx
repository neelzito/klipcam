"use client";
import React, { useState, useMemo } from "react";
import { Search, Filter, Star, Sparkles } from "lucide-react";
import { 
  PRESETS, 
  PRESET_CATEGORIES, 
  Preset, 
  PresetCategory,
  getPresetsByCategory,
  getTrendingPresets,
  getNewPresets,
  searchPresets 
} from "@/lib/presets";

type FilterType = "all" | "trending" | "new" | PresetCategory;

interface PresetGridProps {
  onSelect: (preset: Preset) => void;
  presets?: Preset[];
  showCredits?: boolean;
}

export function PresetGrid({ onSelect, presets, showCredits = false }: PresetGridProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredPresets = useMemo(() => {
    let basePresets = presets || PRESETS;

    // Apply search filter
    if (searchQuery.trim()) {
      basePresets = searchPresets(searchQuery);
    }

    // Apply category/type filter
    if (filter === "trending") {
      basePresets = basePresets.filter(p => p.trending);
    } else if (filter === "new") {
      basePresets = basePresets.filter(p => p.new);
    } else if (filter !== "all" && filter in PRESET_CATEGORIES) {
      basePresets = basePresets.filter(p => p.category === filter);
    }

    return basePresets;
  }, [filter, searchQuery]);

  const handlePresetSelect = (preset: Preset) => {
    setSelected(preset.id);
    onSelect(preset);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search styles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
            showFilters ? "border-primary-500 bg-primary-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filter Pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === "all" ? "bg-primary-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            All Styles
          </button>
          <button
            onClick={() => setFilter("trending")}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
              filter === "trending" ? "bg-primary-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Star className="w-3 h-3" />
            Trending
          </button>
          <button
            onClick={() => setFilter("new")}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
              filter === "new" ? "bg-primary-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            New
          </button>
          {Object.entries(PRESET_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setFilter(key as PresetCategory)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === key ? "bg-primary-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        {filteredPresets.length} {filteredPresets.length === 1 ? 'style' : 'styles'} found
        {searchQuery && ` for "${searchQuery}"`}
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            className={`p-4 bg-gray-900/50 border rounded-2xl transition-all text-left group hover:scale-[1.02] ${
              selected === preset.id 
                ? "border-primary-500 bg-primary-500/10" 
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white text-sm">{preset.name}</h3>
                  {preset.trending && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                  {preset.new && <Sparkles className="w-3 h-3 text-blue-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {PRESET_CATEGORIES[preset.category]?.icon} {PRESET_CATEGORIES[preset.category]?.name}
                  </span>
                  <span className={`${showCredits ? 'text-sm font-semibold px-3 py-1' : 'text-xs px-2 py-0.5'} rounded-full ${
                    preset.cost === 25 ? "bg-secondary-500/20 text-secondary-300" : 
                    preset.cost === 4 ? "bg-purple-500/20 text-purple-300" : "bg-primary-500/20 text-primary-300"
                  }`}>
                    {preset.cost} {showCredits ? 'credits' : 'cr'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">
              {preset.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {preset.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                  {tag}
                </span>
              ))}
              {preset.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{preset.tags.length - 3}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* No Results */}
      {filteredPresets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">No styles found</div>
          <div className="text-sm text-gray-500">Try adjusting your search or filters</div>
        </div>
      )}
    </div>
  );
}




