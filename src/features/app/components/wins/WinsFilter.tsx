/**
 * @fileoverview Wins Filter Component
 *
 * Component for filtering wins by category and tags.
 * Provides UI controls for category selection and tag filtering.
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { winsApi, type WinCategory } from '@/features/app/api/wins';

interface WinsFilterProps {
  organizationId: string;
  onCategoryChange?: (category: string | null) => void;
  onTagsChange?: (tags: string[]) => void;
  onAllTagsLoad?: (tags: string[]) => void;
  disabled?: boolean;
  showCompact?: boolean;
}

interface FilterState {
  category: string | null;
  tags: string[];
}

/**
 * WinsFilter Component
 *
 * Provides filtering options for browsing wins by category and tags.
 * Shows category buttons and tag multi-select with clear filters option.
 */
export const WinsFilter: React.FC<WinsFilterProps> = ({
  organizationId,
  onCategoryChange,
  onTagsChange,
  onAllTagsLoad,
  disabled = false,
  showCompact = false,
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<WinCategory[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);
        const [cats, tags] = await Promise.all([
          winsApi.getCategories(organizationId),
          winsApi.getAllTags(organizationId),
        ]);
        setCategories(cats);
        setAllTags(tags);
        onAllTagsLoad?.(tags);
        setError(null);
      } catch (err) {
        setError(`Failed to load filters: ${err}`);
        console.error('Failed to fetch filter data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchFilterData();
    }
  }, [organizationId, onAllTagsLoad]);

  const handleCategoryChange = (categoryKey: string | null) => {
    const newFilters = {
      ...filters,
      category: filters.category === categoryKey ? null : categoryKey,
    };
    setFilters(newFilters);
    onCategoryChange?.(newFilters.category);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];

    const newFilters = { ...filters, tags: newTags };
    setFilters(newFilters);
    onTagsChange?.(newFilters.tags);
  };

  const handleClearFilters = () => {
    const newFilters = { category: null, tags: [] };
    setFilters(newFilters);
    onCategoryChange?.(null);
    onTagsChange?.([]);
  };

  const hasActiveFilters = filters.category !== null || filters.tags.length > 0;
  const activeFilterCount = (filters.category ? 1 : 0) + filters.tags.length;

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('gamePlay.wins.loadingFilters', 'Loading filters...')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">{error}</div>
    );
  }

  return (
    <div className={cn('space-y-3', disabled && 'opacity-50 pointer-events-none')}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            {t('gamePlay.wins.filters', 'Filters')}
          </h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs"
          >
            {t('gamePlay.wins.clearAll', 'Clear all')}
          </Button>
        )}
      </div>

      {/* Category Filter */}
      {!showCompact && categories.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {t('gamePlay.wins.category', 'Category')}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  filters.category === category.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <span>{getIconEmoji(category.icon)}</span>
                <span>{category.label}</span>
                {filters.category === category.key && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
          >
            <span>
              {t('gamePlay.wins.tags', 'Tags')}
              {filters.tags.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded bg-primary text-primary-foreground">
                  {filters.tags.length}
                </span>
              )}
            </span>
            <span className={cn('transition-transform', showTagDropdown && 'rotate-180')}>
              ▼
            </span>
          </button>

          {showTagDropdown && (
            <div className="border border-border rounded-md p-2 space-y-1 bg-background">
              {allTags.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2">
                  {t('gamePlay.wins.noTags', 'No tags available')}
                </div>
              ) : (
                allTags.map(tag => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className="w-4 h-4 rounded"
                      disabled={disabled}
                    />
                    <span className="text-xs truncate flex-1">{tag}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.category && (
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs bg-primary/10 text-primary">
              <span>{filters.category}</span>
              <button
                onClick={() => handleCategoryChange(filters.category)}
                className="ml-1 hover:opacity-70"
                type="button"
              >
                ✕
              </button>
            </div>
          )}
          {filters.tags.map(tag => (
            <div
              key={tag}
              className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground"
            >
              <span>{tag}</span>
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:opacity-70"
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {categories.length === 0 && allTags.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('gamePlay.wins.noFiltersAvailable', 'No filters available')}
        </div>
      )}
    </div>
  );
};

/**
 * Convert icon name to emoji for display
 */
function getIconEmoji(icon?: string): string {
  const iconMap: Record<string, string> = {
    lightbulb: '💡',
    'trending-up': '📈',
    users: '👥',
    smile: '😊',
    star: '⭐',
    tag: '🏷️',
    award: '🏆',
    rocket: '🚀',
    target: '🎯',
    heart: '❤️',
  };

  return iconMap[icon || 'tag'] || '🏷️';
}

export default WinsFilter;
