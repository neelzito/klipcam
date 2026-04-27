import { describe, it, expect } from 'vitest';
import { 
  PRESETS, 
  PRESET_CATEGORIES,
  getPresetsByCategory, 
  getTrendingPresets, 
  getNewPresets, 
  searchPresets, 
  getPresetById 
} from '../presets';

describe('Presets System', () => {
  it('should have valid preset structure', () => {
    PRESETS.forEach(preset => {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('description');
      expect(preset).toHaveProperty('prompt');
      expect(preset).toHaveProperty('category');
      expect(preset).toHaveProperty('cost');
      expect(preset).toHaveProperty('tags');
      
      expect(typeof preset.id).toBe('string');
      expect(typeof preset.name).toBe('string');
      expect(typeof preset.description).toBe('string');
      expect(typeof preset.prompt).toBe('string');
      expect([1, 4]).toContain(preset.cost);
      expect(Array.isArray(preset.tags)).toBe(true);
      expect(preset.category in PRESET_CATEGORIES).toBe(true);
    });
  });

  it('should filter presets by category', () => {
    const fashionPresets = getPresetsByCategory('fashion');
    expect(fashionPresets.length).toBeGreaterThan(0);
    fashionPresets.forEach(preset => {
      expect(preset.category).toBe('fashion');
    });
  });

  it('should get trending presets', () => {
    const trendingPresets = getTrendingPresets();
    expect(trendingPresets.length).toBeGreaterThan(0);
    trendingPresets.forEach(preset => {
      expect(preset.trending).toBe(true);
    });
  });

  it('should get new presets', () => {
    const newPresets = getNewPresets();
    newPresets.forEach(preset => {
      expect(preset.new).toBe(true);
    });
  });

  it('should search presets by name', () => {
    const results = searchPresets('fashion');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(preset => {
      const matchesName = preset.name.toLowerCase().includes('fashion');
      const matchesDescription = preset.description.toLowerCase().includes('fashion');
      const matchesTags = preset.tags.some(tag => tag.toLowerCase().includes('fashion'));
      expect(matchesName || matchesDescription || matchesTags).toBe(true);
    });
  });

  it('should search presets case insensitively', () => {
    const lowerResults = searchPresets('fashion');
    const upperResults = searchPresets('FASHION');
    const mixedResults = searchPresets('Fashion');
    
    expect(lowerResults.length).toBe(upperResults.length);
    expect(lowerResults.length).toBe(mixedResults.length);
  });

  it('should find preset by id', () => {
    const testPreset = PRESETS[0];
    const foundPreset = getPresetById(testPreset.id);
    expect(foundPreset).toEqual(testPreset);
  });

  it('should return undefined for non-existent preset id', () => {
    const foundPreset = getPresetById('non-existent-id');
    expect(foundPreset).toBeUndefined();
  });

  it('should have unique preset ids', () => {
    const ids = PRESETS.map(preset => preset.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should contain user_prompt placeholder in prompts', () => {
    PRESETS.forEach(preset => {
      expect(preset.prompt).toContain('{user_prompt}');
    });
  });

  it('should have valid categories', () => {
    const validCategories = Object.keys(PRESET_CATEGORIES);
    PRESETS.forEach(preset => {
      expect(validCategories).toContain(preset.category);
    });
  });
});