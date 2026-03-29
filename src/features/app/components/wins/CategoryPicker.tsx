/**
 * @fileoverview Category Picker Component
 *
 * Multi-select component for choosing win categories.
 * Displays all available categories with icons and colors.
 * Supports single or multiple category selection.
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { winsApi, type WinCategory } from '@/features/app/api/wins';

interface CategoryPickerProps {
  organizationId: string;
  selectedCategories: string[];
  onSelectionChange: (categories: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CategoryPicker Component
 *
 * Displays a grid of category options that users can select from.
 * Shows category icons, colors, and labels.
 * Supports limiting number of selections.
 */
export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  organizationId,
  selectedCategories,
  onSelectionChange,
  maxSelections = 1,
  disabled = false,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<WinCategory[]>([]);
  const [loading, setLoading] = useState(!!organizationId);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await winsApi.getCategories(organizationId);
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load categories: ${err}`);
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [organizationId]);

  const toggleCategory = (categoryKey: string) => {
    if (disabled) return;

    let newSelection: string[];
    if (maxSelections === 1) {
      // Single selection mode
      newSelection = selectedCategories.includes(categoryKey) ? [] : [categoryKey];
    } else {
      // Multi-selection mode
      if (selectedCategories.includes(categoryKey)) {
        newSelection = selectedCategories.filter(c => c !== categoryKey);
      } else if (selectedCategories.length < maxSelections) {
        newSelection = [...selectedCategories, categoryKey];
      } else {
        return; // Max selections reached
      }
    }
    onSelectionChange(newSelection);
  };

  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-24 h-24 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-2">
        <div className="text-sm text-destructive">{error}</div>
        <Button
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchCategories();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {t('gamePlay.wins.selectCategory', 'Select Category')}
        </div>
        {maxSelections > 1 && (
          <div className="text-xs text-muted-foreground">
            {selectedCategories.length}/{maxSelections}
          </div>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {categories.map(category => {
          const isSelected = selectedCategories.includes(category.key);
          const canSelect = !disabled && (isSelected || selectedCategories.length < maxSelections);

          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.key)}
              disabled={disabled || !canSelect}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 transition-all',
                sizeClasses[size],
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-accent',
                (disabled || !canSelect) && 'opacity-50 cursor-not-allowed'
              )}
              title={category.label}
            >
              {/* Icon Container */}
              <div
                className={cn('rounded flex items-center justify-center', iconSizeClasses[size])}
                style={{ backgroundColor: category.color + '20' }}
              >
                <span
                  className="text-center leading-none"
                  style={{ color: category.color }}
                >
                  {getIconEmoji(category.icon)}
                </span>
              </div>

              {/* Label */}
              <div className="text-center font-medium truncate px-1">
                {category.label}
              </div>

              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <Check
                    className="w-4 h-4 text-primary"
                    strokeWidth={3}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info Text */}
      {categories.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('gamePlay.wins.noCategories', 'No categories available')}
        </div>
      )}

      {maxSelections > 1 && selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedCategories.map(catKey => {
            const cat = categories.find(c => c.key === catKey);
            return cat ? (
              <div
                key={catKey}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium"
                style={{ backgroundColor: cat.color + '20', color: cat.color }}
              >
                {cat.label}
                <button
                  onClick={() => toggleCategory(catKey)}
                  className="ml-1 hover:opacity-70 transition-opacity"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Convert icon name to emoji for display
 * Fallback to generic tag emoji if icon not recognized
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

export default CategoryPicker;
