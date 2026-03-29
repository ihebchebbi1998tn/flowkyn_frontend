/**
 * @fileoverview Avatars Section — showcases all DiceBear styles, sizes, groups, and the AvatarPicker.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createAvatar } from '@dicebear/core';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AvatarPicker, AVATAR_STYLES } from '@/components/common/AvatarPicker';
import { Badge } from '@/components/ui/badge';
import { Section, ShowcaseRow, ShowcaseGrid } from './Primitives';
import { cn } from '@/lib/utils';

const SAMPLE_USERS = [
  { name: 'Alice Martin', initials: 'AM', color: 'bg-primary/10 text-primary' },
  { name: 'Bob Chen', initials: 'BC', color: 'bg-success/10 text-success' },
  { name: 'Carol Davis', initials: 'CD', color: 'bg-warning/10 text-warning' },
  { name: 'David Kim', initials: 'DK', color: 'bg-info/10 text-info' },
  { name: 'Eve Wilson', initials: 'EW', color: 'bg-destructive/10 text-destructive' },
  { name: 'Frank Lopez', initials: 'FL', color: 'bg-primary/10 text-primary' },
  { name: 'Grace Park', initials: 'GP', color: 'bg-success/10 text-success' },
  { name: 'Henry Zhang', initials: 'HZ', color: 'bg-info/10 text-info' },
];

function StylePreview({ name, style }: { name: string; style: any }) {
  const seeds = ['alice', 'bob', 'carol', 'dave'];
  const avatars = useMemo(
    () => seeds.map(seed => createAvatar(style as any, { seed, size: 64 }).toDataUri()),
    [style]
  );

  return (
    <div className="rounded-xl border border-border bg-card p-3 hover:border-primary/20 hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-center gap-1.5 mb-2.5">
        {avatars.map((uri, i) => (
          <Avatar key={i} className="h-9 w-9">
            <AvatarImage src={uri} alt={`${name} ${seeds[i]}`} />
            <AvatarFallback className="bg-muted text-muted-foreground text-label">{seeds[i][0].toUpperCase()}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <p className="text-label text-muted-foreground truncate">{name}</p>
    </div>
  );
}

export function AvatarsSection() {
  const [pickerAvatar, setPickerAvatar] = useState<string>('');
  const { t } = useTranslation();

  return (
    <Section
      id="avatars"
      title={t('templates.avatars.title')}
      description={t('templates.avatars.description', { count: AVATAR_STYLES.length })}
    >

      {/* All DiceBear styles */}
      <ShowcaseGrid label={t('templates.avatars.allStylesLabel', { count: AVATAR_STYLES.length })} cols={4}>
        {AVATAR_STYLES.map(s => (
          <StylePreview key={s.name} name={s.name} style={s.style} />
        ))}
      </ShowcaseGrid>

      {/* Sizes */}
      <ShowcaseRow label={t('templates.avatars.sizesLabel')}>
        {[6, 8, 10, 12, 16].map((size, i) => (
          <Avatar key={size} style={{ height: size * 4, width: size * 4 }}>
            <AvatarFallback className={cn('text-label font-semibold', SAMPLE_USERS[i].color)}>
              {SAMPLE_USERS[i].initials}
            </AvatarFallback>
          </Avatar>
        ))}
      </ShowcaseRow>

      {/* With Images */}
      <ShowcaseRow label={t('templates.avatars.withImagesLabel')}>
        {SAMPLE_USERS.slice(0, 6).map(user => (
          <Avatar key={user.name} className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`} alt={user.name} />
            <AvatarFallback className={cn('text-label font-semibold', user.color)}>{user.initials}</AvatarFallback>
          </Avatar>
        ))}
      </ShowcaseRow>

      {/* Stacked Groups */}
      <ShowcaseRow label={t('templates.avatars.stackedGroupsLabel')}>
        <div className="space-y-4 w-full">
          {/* Small group */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {SAMPLE_USERS.slice(0, 4).map((user, i) => (
                <Avatar key={i} className="h-9 w-9 border-2 border-card">
                  <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`} />
                  <AvatarFallback className={user.color}>{user.initials}</AvatarFallback>
                </Avatar>
              ))}
              <div className="h-9 w-9 rounded-full bg-muted border-2 border-card flex items-center justify-center text-label text-muted-foreground font-medium">
                +3
              </div>
            </div>
            <span className="text-body-sm text-muted-foreground">{t('templates.avatars.smallGroupShown', { count: 4 })}</span>
          </div>

          {/* Large group */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {SAMPLE_USERS.map((user, i) => (
                <Avatar key={i} className="h-7 w-7 border-2 border-card">
                  <AvatarImage src={`https://api.dicebear.com/9.x/micah/svg?seed=${user.name}`} />
                  <AvatarFallback className={cn('text-label-xs', user.color)}>{user.initials}</AvatarFallback>
                </Avatar>
              ))}
              <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-label-xs text-primary font-semibold">
                +12
              </div>
            </div>
            <span className="text-body-sm text-muted-foreground">{t('templates.avatars.largeGroupShown', { count: 8 })}</span>
          </div>
        </div>
      </ShowcaseRow>

      {/* Fallback Colors */}
      <ShowcaseRow label={t('templates.avatars.fallbackColorsLabel')}>
        {SAMPLE_USERS.map(user => (
          <div key={user.name} className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className={cn('text-label font-semibold', user.color)}>{user.initials}</AvatarFallback>
            </Avatar>
            <span className="text-body-sm text-foreground">{user.name}</span>
          </div>
        ))}
      </ShowcaseRow>

      {/* Status Indicators */}
      <ShowcaseRow label={t('templates.avatars.statusIndicatorsLabel')}>
        {[
          { user: SAMPLE_USERS[0], status: 'online', color: 'bg-success' },
          { user: SAMPLE_USERS[1], status: 'away', color: 'bg-warning' },
          { user: SAMPLE_USERS[2], status: 'busy', color: 'bg-destructive' },
          { user: SAMPLE_USERS[3], status: 'offline', color: 'bg-muted-foreground/40' },
        ].map(({ user, status, color }) => (
          <div key={user.name} className="flex items-center gap-2.5">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${user.name}`} />
                <AvatarFallback className={cn('text-label font-semibold', user.color)}>{user.initials}</AvatarFallback>
              </Avatar>
              <div className={cn('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card', color)} />
            </div>
            <div>
              <p className="text-body-sm font-medium text-foreground">{user.name}</p>
              <p className="text-label text-muted-foreground capitalize">{status}</p>
            </div>
          </div>
        ))}
      </ShowcaseRow>

      {/* AvatarPicker Component */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-label uppercase text-muted-foreground">{t('templates.avatars.pickerTitle')}</p>
          <Badge variant="outline" className="text-label">{t('templates.avatars.pickerBadge', { styles: AVATAR_STYLES.length, avatars: 36 })}</Badge>
        </div>
        <div className="max-w-lg">
          <AvatarPicker
            seed="demo"
            onSelect={setPickerAvatar}
            selectedUri={pickerAvatar}
            count={36}
            cols={9}
          />
        </div>
        {pickerAvatar && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/60">
            <img src={pickerAvatar} className="h-12 w-12 rounded-xl border border-border" alt="Selected" />
            <p className="text-body-sm text-muted-foreground">Selected avatar</p>
          </div>
        )}
      </div>
    </Section>
  );
}
