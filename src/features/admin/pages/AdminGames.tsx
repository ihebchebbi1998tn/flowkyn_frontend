/**
 * Admin Game Sessions — lists all game sessions across the platform.
 * Wired to the real backend via adminApi.listGameSessions().
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Gamepad2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/api/admin';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/loading/Skeletons';
import type { GameSession } from '@/types';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  paused: 'bg-warning/10 text-warning',
  finished: 'bg-success/10 text-success',
};

export default function AdminGames() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listGameSessions(page, 20);
      setSessions(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load game sessions');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Client-side filter for search
  const filtered = sessions.filter(s =>
    !search ||
    (s.game_type_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.event_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.organization_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Game Sessions" subtitle="All game sessions across the platform" actions={<Badge variant="outline" className="text-[12px]">{total} total</Badge>} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search game sessions..." className="pl-10 h-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Game</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden md:table-cell">Event</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden lg:table-cell">Organization</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden sm:table-cell">Round</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden sm:table-cell">Actions</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : (
                filtered.map(session => (
                  <tr key={session.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Gamepad2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{session.game_type_name || session.game_type_key || '—'}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {session.started_at ? new Date(session.started_at).toLocaleString() : 'Not started'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{session.event_title || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{session.organization_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{session.current_round}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{session.action_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[session.status] || ''}`}>
                        {session.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No game sessions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-[13px] text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
