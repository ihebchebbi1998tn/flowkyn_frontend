/**
 * @fileoverview Avatar Picker — rich avatar selection with 15+ DiceBear styles.
 * Generates a diverse grid of avatars, grouped by style, with shuffle functionality.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createAvatar } from '@dicebear/core';
import {
  adventurer, adventurerNeutral, avataaars, avataaarsNeutral,
  bigEars, bigEarsNeutral, bigSmile, bottts, botttsNeutral,
  croodles, croodlesNeutral, funEmoji, icons, identicon,
  lorelei, loreleiNeutral, micah, miniavs, notionists,
  notionistsNeutral, openPeeps, personas, pixelArt, pixelArtNeutral,
  rings, shapes, thumbs,
} from '@dicebear/collection';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const AVATAR_STYLES = [
  { name: 'Adventurer', style: adventurer },
  { name: 'Adventurer Neutral', style: adventurerNeutral },
  { name: 'Avataaars', style: avataaars },
  { name: 'Avataaars Neutral', style: avataaarsNeutral },
  { name: 'Big Ears', style: bigEars },
  { name: 'Big Ears Neutral', style: bigEarsNeutral },
  { name: 'Big Smile', style: bigSmile },
  { name: 'Bottts', style: bottts },
  { name: 'Bottts Neutral', style: botttsNeutral },
  { name: 'Croodles', style: croodles },
  { name: 'Croodles Neutral', style: croodlesNeutral },
  { name: 'Fun Emoji', style: funEmoji },
  { name: 'Lorelei', style: lorelei },
  { name: 'Lorelei Neutral', style: loreleiNeutral },
  { name: 'Micah', style: micah },
  { name: 'Miniavs', style: miniavs },
  { name: 'Notionists', style: notionists },
  { name: 'Notionists Neutral', style: notionistsNeutral },
  { name: 'Open Peeps', style: openPeeps },
  { name: 'Personas', style: personas },
  { name: 'Pixel Art', style: pixelArt },
  { name: 'Pixel Art Neutral', style: pixelArtNeutral },
  { name: 'Rings', style: rings },
  { name: 'Shapes', style: shapes },
  { name: 'Thumbs', style: thumbs },
] as const;

interface AvatarPickerProps {
  seed?: string;
  onSelect: (dataUri: string) => void;
  selectedUri?: string;
  className?: string;
  /** Number of avatars to generate (default 36) */
  count?: number;
  /** Grid columns (default 9) */
  cols?: number;
}

function generateAvatars(seed: string, count = 36) {
  const results: { uri: string; label: string }[] = [];
  const variationsPerStyle = Math.max(1, Math.ceil(count / AVATAR_STYLES.length));

  for (const { name, style } of AVATAR_STYLES) {
    for (let i = 0; i < variationsPerStyle; i++) {
      const avatar = createAvatar(style as any, {
        seed: `${seed}-${name}-${i}`,
        size: 80,
      });
      results.push({ uri: avatar.toDataUri(), label: `${name} #${i + 1}` });
    }
  }

  // Shuffle for variety, then slice
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }

  return results.slice(0, count);
}

export function AvatarPicker({ seed = 'guest', onSelect, selectedUri, className, count = 36, cols = 9 }: AvatarPickerProps) {
  const [randomSeed, setRandomSeed] = useState(seed);
  const avatars = useMemo(() => generateAvatars(randomSeed, count), [randomSeed, count]);

  const reshuffle = () => setRandomSeed(`${seed}-${Date.now()}`);

  const { t } = useTranslation();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-medium text-foreground">{t('avatarPicker.chooseAvatar')}</p>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-label gap-1.5 text-muted-foreground" onClick={reshuffle}>
          <RefreshCw className="h-3 w-3" /> {t('avatarPicker.shuffle')}
        </Button>
      </div>

      <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {avatars.map((av, i) => (
          <button
            key={`${randomSeed}-${i}`}
            type="button"
            title={av.label}
            className={cn(
              'relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200 hover:scale-110 hover:shadow-md hover:z-10',
              selectedUri === av.uri
                ? 'border-primary ring-2 ring-primary/20 shadow-sm scale-105'
                : 'border-border/50 hover:border-primary/40'
            )}
            onClick={() => onSelect(av.uri)}
          >
            <img src={av.uri} alt={av.label} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
