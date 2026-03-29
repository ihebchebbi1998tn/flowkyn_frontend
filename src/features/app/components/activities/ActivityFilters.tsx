import { useTranslation } from 'react-i18next';
import { X, Search, Radio, Users, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ActivityType, ActivityTeamSize } from '@/features/app/data/activities';

export interface ActivityFilterState {
  search: string;
  category: string;
  type: ActivityType | 'all';
  teamSize: ActivityTeamSize | 'all';
}

interface ActivityFiltersProps {
  filters: ActivityFilterState;
  onChange: (filters: ActivityFilterState) => void;
  resultCount: number;
  totalCount: number;
}

export function ActivityFilters({ filters, onChange, resultCount, totalCount }: ActivityFiltersProps) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const update = (patch: Partial<ActivityFilterState>) => onChange({ ...filters, ...patch });

  const activeFilterCount = [
    filters.type !== 'all',
    filters.teamSize !== 'all',
  ].filter(Boolean).length;

  const hasAnyFilter = activeFilterCount > 0 || filters.search.trim().length > 0;

  const clearAll = () => onChange({ search: '', category: filters.category, type: 'all', teamSize: 'all' });

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            placeholder={t('games.filters.searchPlaceholder')}
            className="pl-10 pr-9 h-10 text-[13px] bg-card border-border/80 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-all"
          />
          {filters.search && (
            <button onClick={() => update({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <Button variant="outline" size="sm"
          className={cn(
            "sm:hidden h-10 px-3.5 text-[12px] gap-2 rounded-xl border-border/80 shrink-0",
            showFilters && "border-primary/30 bg-primary/5 text-primary"
          )}
          onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Desktop filter selects */}
        <div className="hidden sm:flex items-center gap-2">
          <Select value={filters.type} onValueChange={v => update({ type: v as ActivityType | 'all' })}>
            <SelectTrigger className="h-10 w-[140px] text-[12px] bg-card border-border/80 rounded-xl">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-muted-foreground/60" />
                <SelectValue placeholder={t('games.filters.type')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-[12px] rounded-lg">{t('games.filters.allTypes')}</SelectItem>
              <SelectItem value="sync" className="text-[12px] rounded-lg">{t('games.filters.sync')}</SelectItem>
              <SelectItem value="async" className="text-[12px] rounded-lg">{t('games.filters.async')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.teamSize} onValueChange={v => update({ teamSize: v as ActivityTeamSize | 'all' })}>
            <SelectTrigger className="h-10 w-[155px] text-[12px] bg-card border-border/80 rounded-xl">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                <SelectValue placeholder={t('games.filters.teamSize')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-[12px] rounded-lg">{t('games.filters.allSizes')}</SelectItem>
              <SelectItem value="pairs" className="text-[12px] rounded-lg">{t('games.filters.pairs')}</SelectItem>
              <SelectItem value="small" className="text-[12px] rounded-lg">{t('games.filters.smallTeam')}</SelectItem>
              <SelectItem value="medium" className="text-[12px] rounded-lg">{t('games.filters.mediumTeam')}</SelectItem>
              <SelectItem value="large" className="text-[12px] rounded-lg">{t('games.filters.largeTeam')}</SelectItem>
              <SelectItem value="any" className="text-[12px] rounded-lg">{t('games.filters.anySize')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile expanded filters */}
      {showFilters && (
        <div className="sm:hidden grid grid-cols-2 gap-2 p-3 rounded-xl bg-card border border-border/80 animate-fade-in">
          <Select value={filters.type} onValueChange={v => update({ type: v as ActivityType | 'all' })}>
            <SelectTrigger className="h-10 text-[12px] bg-background border-border/60 rounded-lg">
              <SelectValue placeholder={t('games.filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">{t('games.filters.allTypes')}</SelectItem>
              <SelectItem value="sync" className="text-[12px]">{t('games.filters.sync')}</SelectItem>
              <SelectItem value="async" className="text-[12px]">{t('games.filters.async')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.teamSize} onValueChange={v => update({ teamSize: v as ActivityTeamSize | 'all' })}>
            <SelectTrigger className="h-10 text-[12px] bg-background border-border/60 rounded-lg">
              <SelectValue placeholder={t('games.filters.teamSize')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">{t('games.filters.allSizes')}</SelectItem>
              <SelectItem value="pairs" className="text-[12px]">{t('games.filters.pairs')}</SelectItem>
              <SelectItem value="small" className="text-[12px]">{t('games.filters.smallTeam')}</SelectItem>
              <SelectItem value="medium" className="text-[12px]">{t('games.filters.mediumTeam')}</SelectItem>
              <SelectItem value="large" className="text-[12px]">{t('games.filters.largeTeam')}</SelectItem>
              <SelectItem value="any" className="text-[12px]">{t('games.filters.anySize')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Active filters bar + result count */}
      {hasAnyFilter && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}
                className="h-7 text-[11px] text-muted-foreground gap-1 hover:text-foreground px-2 rounded-lg">
                <X className="h-3 w-3" /> {t('games.filters.clearAll')}
              </Button>
            )}
            {filters.type !== 'all' && (
              <Badge className="text-[10px] gap-1.5 pr-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 rounded-lg h-7">
                <Radio className="h-2.5 w-2.5" />
                {filters.type === 'sync' ? 'Live' : 'Async'}
                <button onClick={() => update({ type: 'all' })} className="ml-0.5 hover:text-primary/70 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.teamSize !== 'all' && (
              <Badge className="text-[10px] gap-1.5 pr-1 bg-info/10 text-info border-info/20 hover:bg-info/15 rounded-lg h-7">
                <Users className="h-2.5 w-2.5" />
                {filters.teamSize}
                <button onClick={() => update({ teamSize: 'all' })} className="ml-0.5 hover:text-info/70 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="h-3 w-3 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground font-medium">
              {resultCount === totalCount
                ? t('games.filters.showingAll', { count: totalCount })
                : t('games.filters.showingFiltered', { count: resultCount, total: totalCount })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
