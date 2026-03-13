/**
 * Admin Users — lists and manages all platform users.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, Ban, Trash2, Eye, CheckCircle, Users, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/common/PageHeader';
import { LogoLoader } from '@/components/loading/LogoLoader';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { adminApi } from '@/api/admin';
import type { User } from '@/types';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listUsers(page, 20, search || undefined);
      setUsers(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => { setPage(1); }, [search]);

  const handleSuspend = async (id: string) => {
    try {
      await adminApi.suspendUser(id);
      toast.success('User suspended');
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspend = async (id: string) => {
    try {
      await adminApi.unsuspendUser(id);
      toast.success('User unsuspended');
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to unsuspend user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage all platform users"
        actions={<Badge variant="outline">{total} total</Badge>}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-10 h-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex justify-center"><LogoLoader size="md" /></div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mx-auto mb-3">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-body-sm font-medium text-foreground">No users found</p>
          <p className="text-label text-muted-foreground mt-1">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left font-semibold px-4 py-3 text-muted-foreground w-[300px]">User & Company</th>
                  <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden md:table-cell">Language</th>
                  <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden lg:table-cell">Joined</th>
                  <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden sm:table-cell">Updated</th>
                  <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Status</th>
                  <th className="text-right font-semibold px-4 py-3 text-muted-foreground w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-label font-bold">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-label text-muted-foreground truncate">{user.email}</p>
                          {user.organization_name && (
                            <p className="text-[11px] font-medium text-primary mt-0.5 truncate flex items-center gap-1">
                              <Building className="h-3 w-3" /> {user.organization_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.language}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(user.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}
                        className={cn(
                          user.status === 'active' ? 'bg-success/10 text-success border-success/20' : ''
                        )}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem className="text-body-sm gap-2"><Eye className="h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                          {user.status === 'active' ? (
                            <DropdownMenuItem className="text-body-sm gap-2" onClick={() => handleSuspend(user.id)}>
                              <Ban className="h-3.5 w-3.5" /> Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-body-sm gap-2" onClick={() => handleUnsuspend(user.id)}>
                              <CheckCircle className="h-3.5 w-3.5" /> Unsuspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-body-sm gap-2 text-destructive" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-body-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
