/**
 * @fileoverview Tag Display Component
 *
 * Component for displaying and managing tags on posts.
 * Shows tags as removable badges with ability to add new tags.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { winsApi } from '@/features/app/api/wins';

interface TagDisplayProps {
  postId: string;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  editable?: boolean;
  maxTags?: number;
  disabled?: boolean;
}

/**
 * TagDisplay Component
 *
 * Displays tags as badges with optional edit/add capabilities.
 * Can remove tags and add new ones if editable=true.
 */
export const TagDisplay: React.FC<TagDisplayProps> = ({
  postId,
  tags = [],
  onTagsChange,
  editable = false,
  maxTags = 10,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    if (editable && tags.length >= maxTags) {
      setError(t('gamePlay.wins.maxTagsReached', `Maximum ${maxTags} tags allowed`));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editable) {
        await winsApi.addTags(postId, [newTag.trim()]);
        const updatedTags = [...tags, newTag.trim().toLowerCase()];
        onTagsChange?.(updatedTags);
      }

      setNewTag('');
    } catch (err) {
      setError(`Failed to add tag: ${err}`);
      console.error('Failed to add tag:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      setLoading(true);
      setError(null);

      if (editable) {
        await winsApi.removeTags(postId, [tagToRemove]);
        const updatedTags = tags.filter(t => t !== tagToRemove);
        onTagsChange?.(updatedTags);
      }
    } catch (err) {
      setError(`Failed to remove tag: ${err}`);
      console.error('Failed to remove tag:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-3">
      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
            >
              <span className="truncate">{tag}</span>
              {editable && !disabled && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:opacity-70 transition-opacity focus:outline-none"
                  type="button"
                  disabled={loading}
                  aria-label={t('gamePlay.wins.removeTag', 'Remove tag')}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Tag Input */}
      {editable && !disabled && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t('gamePlay.wins.enterTag', 'Enter a tag...')}
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading || tags.length >= maxTags}
              className="flex-1 h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddTag}
              disabled={loading || !newTag.trim() || tags.length >= maxTags}
              variant="outline"
              className="h-8 px-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Help Text */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{tags.length}/{maxTags} tags</span>
            {tags.length >= maxTags && (
              <span className="text-orange-600 dark:text-orange-400">
                (max reached)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {tags.length === 0 && !editable && (
        <div className="text-sm text-muted-foreground">
          {t('gamePlay.wins.noTags', 'No tags')}
        </div>
      )}
    </div>
  );
};

export default TagDisplay;
