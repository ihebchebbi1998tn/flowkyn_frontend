import { useState, useEffect, useCallback } from 'react';
import { Mail, User, Calendar, Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/loading/Skeletons';
import { adminApi, type EarlyAccessEntry } from '@/api/admin';
import { toast } from 'sonner';

export default function AdminEarlyAccess() {
  const [entries, setEntries] = useState<EarlyAccessEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EarlyAccessEntry | null>(null);
  const [message, setMessage] = useState('');
  const [resetPasswordIfExists, setResetPasswordIfExists] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listEarlyAccess(page, 50);
      setEntries(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load early access signups');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.company_name || '').toLowerCase().includes(q)
    );
  });

  const openProvisionModal = (entry: EarlyAccessEntry) => {
    setSelected(entry);
    setResetPasswordIfExists(true);
    setMessage(
      `Hi ${entry.first_name},\n\nGreat news — your early access is ready. I created your account and shared your temporary credentials below.\n\nSee you inside Flowkyn!`
    );
  };

  const sendCredentials = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const result = await adminApi.sendEarlyAccessCredentials(selected.id, message, resetPasswordIfExists);
      const passwordLine = result.data.passwordResetApplied
        ? `Temporary password: ${result.data.temporaryPassword}`
        : 'Password kept unchanged for existing account';
      toast.success(`${result.message}\n${passwordLine}\nLogin URL: ${result.data.loginUrl}`);
      setSelected(null);
      setMessage('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send credentials email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Early Access Signups"
        subtitle="People who requested early access from the landing page"
        actions={
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Badge variant="outline">{total} total</Badge>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative max-w-sm">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, email, or company..."
            className="pl-10 h-9 text-[13px]"
          />
        </div>
        {loading && (
          <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading latest signups…
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Person</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden md:table-cell">
                  Company
                </th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  Contact
                </th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  Signed up
                </th>
                <th className="text-right font-semibold px-4 py-3 text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <TableSkeleton rows={5} cols={5} />
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/15 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {entry.first_name} {entry.last_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{entry.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[220px] truncate">
                      {entry.company_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {entry.ip_address ? (
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Badge variant="outline" className="text-[10px]">
                            {entry.ip_address}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/70">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="h-8 text-[11px] gap-1"
                        onClick={() => openProvisionModal(entry)}
                      >
                        <Send className="h-3 w-3" />
                        Send Access
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No early access signups found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Early Access Credentials</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3 bg-muted/20 text-[12px]">
                <p><strong>Name:</strong> {selected.first_name} {selected.last_name}</p>
                <p><strong>Email:</strong> {selected.email}</p>
                <p><strong>Company:</strong> {selected.company_name || '—'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted-foreground">
                  Personalized message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  placeholder="Write a personalized message..."
                />
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-[12px]">
                <Checkbox
                  checked={resetPasswordIfExists}
                  onCheckedChange={(checked) => setResetPasswordIfExists(checked !== false)}
                />
                <span>Reset password if account already exists</span>
              </label>
              <p className="text-[11px] text-muted-foreground">
                This will create (or update) the account and email login details. Password reset is controlled by the checkbox above.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)} disabled={sending}>
              Cancel
            </Button>
            <Button size="sm" onClick={sendCredentials} disabled={sending || !selected}>
              {sending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Send Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

