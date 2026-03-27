/**
 * Admin Organizations — lists and manages all platform organizations.
 * Wired to the real backend via adminApi.listOrganizations().
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, Trash2, Eye, Users, Loader, AlertCircle, HeartPulse } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/api/admin';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/loading/Skeletons';
import type { Organization, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning',
};

const statusColors: Record<string, string> = {
  test: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  real: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusLabels: Record<string, string> = {
  test: '🧪 Test',
  real: '✅ Real',
  inactive: '⏸️ Inactive',
  banned: '🚫 Banned',
};

export default function AdminOrganizations() {
  const [search, setSearch] = useState('');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Organization>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState<string | null>(null);
  const [pulseSurveys, setPulseSurveys] = useState<Array<{
    id: string; submitted_by_name: string; submitted_by_email: string;
    team_connectedness: number; relationship_quality: number; team_familiarity: number;
    expectations: string | null; created_at: string;
  }>>([]);

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

  const handleViewDetails = async (org: Organization) => {
    try {
      const [fullOrg, surveys] = await Promise.all([
        adminApi.getOrganization(org.id),
        adminApi.getOrgPulseSurvey(org.id).catch(() => []),
      ]);
      setEditingOrg(fullOrg);
      setPulseSurveys(surveys);
      setEditFormData({
        name: fullOrg.name,
        description: fullOrg.description,
        industry: fullOrg.industry,
        company_size: fullOrg.company_size,
      });
      setEditModalOpen(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load organization details');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingOrg) return;
    
    try {
      setSavingEdit(true);
      const updated = await adminApi.updateOrganization(editingOrg.id, editFormData);
      
      // Update local state
      setOrgs(orgs.map(o => o.id === updated.id ? updated : o));
      setEditingOrg(updated);
      setEditModalOpen(false);
      toast.success('Organization updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save organization');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStatusChange = async (orgId: string, newStatus: 'test' | 'real' | 'inactive' | 'banned') => {
    try {
      setStatusChangeLoading(orgId);
      const updated = await adminApi.updateOrganizationStatus(orgId, newStatus);
      
      // Update local state
      setOrgs(orgs.map(o => o.id === updated.id ? updated : o));
      
      toast.success(`Organization marked as ${statusLabels[newStatus]}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update organization status');
    } finally {
      setStatusChangeLoading(null);
    }
  };

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
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Status</th>
                <th className="text-right font-semibold px-4 py-3 text-muted-foreground w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><TableSkeleton rows={5} cols={7} /></td></tr>
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
                    <td className="px-4 py-3">
                      <Select
                        value={org.status || 'real'}
                        onValueChange={(value) => handleStatusChange(org.id, value as 'test' | 'real' | 'inactive' | 'banned')}
                        disabled={statusChangeLoading === org.id}
                      >
                        <SelectTrigger className="h-8 text-[12px] w-[120px]">
                          {statusChangeLoading === org.id ? (
                            <Loader className="h-3 w-3 animate-spin" />
                          ) : (
                            <SelectValue placeholder="Select status" />
                          )}
                        </SelectTrigger>
                        <SelectContent className="min-w-[120px]">
                          <SelectItem value="test" className="text-[12px]">
                            🧪 Test
                          </SelectItem>
                          <SelectItem value="real" className="text-[12px]">
                            ✅ Real
                          </SelectItem>
                          <SelectItem value="inactive" className="text-[12px]">
                            ⏸️ Inactive
                          </SelectItem>
                          <SelectItem value="banned" className="text-[12px]">
                            🚫 Banned
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem className="text-[13px] gap-2 cursor-pointer" onClick={() => handleViewDetails(org)}>
                            <Eye className="h-3.5 w-3.5" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[13px] gap-2 text-destructive cursor-pointer" onClick={() => handleDelete(org.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
              {!loading && orgs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No organizations found</td></tr>
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

      {/* Edit Organization Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>

          {editingOrg && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name" className="text-[13px] font-medium">Organization Name</Label>
                <Input
                  id="org-name"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className="mt-1.5 h-9"
                />
              </div>

              <div>
                <Label htmlFor="org-description" className="text-[13px] font-medium">Description</Label>
                <Textarea
                  id="org-description"
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Brief description of your organization"
                  rows={3}
                  className="mt-1.5 text-[13px]"
                />
              </div>

              <div>
                <Label htmlFor="org-industry" className="text-[13px] font-medium">Industry</Label>
                <Input
                  id="org-industry"
                  value={editFormData.industry || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                  placeholder="e.g. Technology, Finance, etc."
                  className="mt-1.5 h-9"
                />
              </div>

              <div>
                <Label htmlFor="org-size" className="text-[13px] font-medium">Company Size</Label>
                <Input
                  id="org-size"
                  value={editFormData.company_size || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, company_size: e.target.value })}
                  placeholder="e.g. 10-50 employees"
                  className="mt-1.5 h-9"
                />
              </div>

              {/* Pulse Survey Results */}
              {pulseSurveys.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    <Label className="text-[13px] font-semibold">Team Pulse Survey</Label>
                  </div>
                  {pulseSurveys.map((survey) => (
                    <div key={survey.id} className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          Submitted by <span className="font-medium text-foreground">{survey.submitted_by_name}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(survey.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {[
                        { label: 'Team Connectedness', value: survey.team_connectedness },
                        { label: 'Relationship Quality', value: survey.relationship_quality },
                        { label: 'Team Familiarity', value: survey.team_familiarity },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-foreground">{label}</span>
                            <span className={`text-[12px] font-bold tabular-nums ${
                              value <= 3 ? 'text-red-500' : value <= 6 ? 'text-amber-500' : value <= 8 ? 'text-emerald-500' : 'text-primary'
                            }`}>{value}/10</span>
                          </div>
                          <Progress value={value * 10} className="h-1.5" />
                        </div>
                      ))}

                      {survey.expectations && (
                        <div className="mt-2">
                          <span className="text-[11px] font-medium text-muted-foreground">Expectations:</span>
                          <p className="text-[12px] text-foreground mt-1 bg-background rounded p-2 border border-border/50">
                            {survey.expectations}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
