/**
 * Admin Contacts — displays contact form submissions.
 * Wired to the real backend via adminApi.listContacts().
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, Trash2, Eye, Mail, MailOpen, Archive, Reply } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { adminApi, type ContactEntry } from '@/api/admin';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/loading/Skeletons';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Mail }> = {
  new: { label: 'New', color: 'bg-primary/10 text-primary', icon: Mail },
  read: { label: 'Read', color: 'bg-info/10 text-info', icon: MailOpen },
  replied: { label: 'Replied', color: 'bg-success/10 text-success', icon: Reply },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground', icon: Archive },
};

export default function AdminContacts() {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ContactEntry | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listContacts(page, 20);
      setContacts(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateContactStatus(id, status);
      toast.success(`Marked as ${status}`);
      fetchContacts();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await adminApi.deleteContact(id);
      toast.success('Message deleted');
      fetchContacts();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  // Client-side search filter
  const filtered = contacts.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.message.toLowerCase().includes(search.toLowerCase())
  );

  const newCount = contacts.filter(c => c.status === 'new').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Contact Submissions" subtitle="Messages from the contact form" actions={
        <div className="flex items-center gap-2">
          {newCount > 0 && <Badge className="bg-primary/10 text-primary border-primary/20 text-[12px]">{newCount} new</Badge>}
          <Badge variant="outline" className="text-[12px]">{total} total</Badge>
        </div>
      } />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..." className="pl-10 h-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">From</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden md:table-cell">Subject</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden lg:table-cell">Message</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Status</th>
                <th className="text-right font-semibold px-4 py-3 text-muted-foreground w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : (
                filtered.map(contact => {
                  const statusInfo = statusConfig[contact.status] || statusConfig.new;
                  return (
                    <tr key={contact.id}
                      className={cn(
                        "border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer",
                        contact.status === 'new' && "bg-primary/[0.02]"
                      )}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <statusInfo.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className={cn("font-medium text-foreground truncate", contact.status === 'new' && "font-semibold")}>{contact.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{contact.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                        {contact.subject || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[250px] truncate">
                        {contact.message}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {new Date(contact.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="text-[13px] gap-2" onClick={() => setSelectedContact(contact)}>
                              <Eye className="h-3.5 w-3.5" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] gap-2" onClick={() => handleUpdateStatus(contact.id, 'read')}>
                              <MailOpen className="h-3.5 w-3.5" /> Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] gap-2" onClick={() => handleUpdateStatus(contact.id, 'archived')}>
                              <Archive className="h-3.5 w-3.5" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[13px] gap-2 text-destructive" onClick={() => handleDelete(contact.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No messages found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedContact.subject || 'No Subject'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{selectedContact.name}</p>
                    <a href={`mailto:${selectedContact.email}`} className="text-[13px] text-primary hover:underline">{selectedContact.email}</a>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-[10px] ${(statusConfig[selectedContact.status] || statusConfig.new).color}`}>
                      {(statusConfig[selectedContact.status] || statusConfig.new).label}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(selectedContact.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/30 p-4 text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="text-[13px] gap-1.5" onClick={() => window.open(`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`)}>
                    <Reply className="h-3.5 w-3.5" /> Reply
                  </Button>
                  <Button variant="outline" size="sm" className="text-[13px] gap-1.5" onClick={() => { handleUpdateStatus(selectedContact.id, 'archived'); setSelectedContact(null); }}>
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
