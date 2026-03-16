/**
 * Admin Organizations — lists and manages all platform organizations.
 * Wired to the real backend via adminApi.listOrganizations().
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, Trash2, Eye, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { adminApi } from '@/api/admin';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/loading/Skeletons';
import type { Organization, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning',
};

export default function AdminOrganizations() {
  const [search, setSearch] = useState('');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listOrganizations(page, 20, search || undefined);
      setOrgs(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization? This cannot be undone.')) return;
    try {
      await adminApi.deleteOrganization(id);
      toast.success('Organization deleted');
      fetchOrgs();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete organization');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" subtitle="Manage all platform organizations" actions={<Badge variant="outline" className="text-[12px]">{total} total</Badge>} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations..." className="pl-10 h-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Organization</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden md:table-cell">Owner</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden sm:table-cell">Members</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden lg:table-cell">Events</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Plan</th>
                <th className="text-right font-semibold px-4 py-3 text-muted-foreground w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : (
                orgs.map(org => (
                  <tr key={org.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg border border-border bg-background/50 flex items-center justify-center shrink-0 overflow-hidden">
                          {org.logo_url ? (
                            <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{org.name}</p>
                          <p className="text-[11px] text-muted-foreground">Created {new Date(org.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{org.owner_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{org.member_count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{org.event_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] capitalize ${planColors[org.plan_name || 'free'] || planColors.free}`}>
                        {org.plan_name || 'free'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem className="text-[13px] gap-2"><Eye className="h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[13px] gap-2 text-destructive" onClick={() => handleDelete(org.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
              {!loading && orgs.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No organizations found</td></tr>
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
