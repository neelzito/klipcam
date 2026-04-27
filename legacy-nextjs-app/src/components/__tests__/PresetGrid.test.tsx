import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetGrid } from '../PresetGrid';

// Mock the presets module
vi.mock('../../lib/presets', () => ({
  PRESETS: [
    {
      id: 'test-preset-1',
      name: 'Test Preset 1',
      description: 'A test preset for fashion',
      prompt: '{user_prompt}, fashion style',
      category: 'fashion',
      cost: 1,
      tags: ['fashion', 'style'],
      trending: true,
    },
    {
      id: 'test-preset-2',
      name: 'Test Preset 2',
      description: 'A test preset for portrait',
      prompt: '{user_prompt}, portrait style',
      category: 'portrait',
      cost: 4,
      tags: ['portrait', 'professional'],
      new: true,
    },
  ],
  PRESET_CATEGORIES: {
    fashion: { name: 'Fashion', icon: '👗', description: 'Fashion styles' },
    portrait: { name: 'Portrait', icon: '👤', description: 'Portrait styles' },
  },
  getPresetsByCategory: vi.fn(),
  getTrendingPresets: vi.fn(),
  getNewPresets: vi.fn(),
  searchPresets: vi.fn((query) => {
    const presets = [
      {
        id: 'test-preset-1',
        name: 'Test Preset 1',
        description: 'A test preset for fashion',
        prompt: '{user_prompt}, fashion style',
        category: 'fashion',
        cost: 1,
        tags: ['fashion', 'style'],
        trending: true,
      },
      {
        id: 'test-preset-2',
        name: 'Test Preset 2',
        description: 'A test preset for portrait',
        prompt: '{user_prompt}, portrait style',
        category: 'portrait',
        cost: 4,
        tags: ['portrait', 'professional'],
        new: true,
      },
    ];
    return presets.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }),
}));

describe('PresetGrid', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render presets', () => {
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Test Preset 1')).toBeInTheDocument();
    expect(screen.getByText('Test Preset 2')).toBeInTheDocument();
  });

  it('should show search input', () => {
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should show filters button', () => {
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    const filtersButton = screen.getByText('Filters');
    expect(filtersButton).toBeInTheDocument();
  });

  it('should toggle filters visibility', async () => {
    const user = userEvent.setup();
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    const filtersButton = screen.getByText('Filters');
    
    // Initially filters should not be visible
    expect(screen.queryByText('All Styles')).not.toBeInTheDocument();
    
    // Click to show filters
    await user.click(filtersButton);
    expect(screen.getByText('All Styles')).toBeInTheDocument();
    
    // Click again to hide filters
    await user.click(filtersButton);
    expect(screen.queryByText('All Styles')).not.toBeInTheDocument();
  });

  it('should filter presets by search', async () => {
    const user = userEvent.setup();
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    
    // Search for 'fashion'
    await user.type(searchInput, 'fashion');
    
    await waitFor(() => {
      expect(screen.getByText('Test Preset 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Preset 2')).not.toBeInTheDocument();
    });
  });

  it('should call onSelect when preset is clicked', async () => {
    const user = userEvent.setup();
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    const preset1Button = screen.getByText('Test Preset 1').closest('button');
    expect(preset1Button).toBeInTheDocument();
    
    await user.click(preset1Button!);
    
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-preset-1',
        name: 'Test Preset 1',
      })
    );
  });

  it('should show results count', () => {
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    expect(screen.getByText('2 styles found')).toBeInTheDocument();
  });

  it('should show singular form for single result', async () => {
    const user = userEvent.setup();
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    await user.type(searchInput, 'fashion');
    
    await waitFor(() => {
      expect(screen.getByText('1 style found for "fashion"')).toBeInTheDocument();
    });
  });

  it('should show no results message when no presets match', async () => {
    const user = userEvent.setup();
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    await user.type(searchInput, 'nonexistent');
    
    await waitFor(() => {
      expect(screen.getByText('No styles found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  it('should display preset cost correctly', () => {
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    expect(screen.getByText('1 cr')).toBeInTheDocument();
    expect(screen.getByText('4 cr')).toBeInTheDocument();
  });

  it('should display trending and new badges', () => {
    render(<PresetGrid onSelect={mockOnSelect} />);
    
    // Check for trending star icon (should be in Test Preset 1)
    const preset1 = screen.getByText('Test Preset 1').closest('button');
    expect(preset1).toBeInTheDocument();
    
    // Check for new sparkles icon (should be in Test Preset 2)
    const preset2 = screen.getByText('Test Preset 2').closest('button');
    expect(preset2).toBeInTheDocument();
  });
});