import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Crown, UserPlus, Mail, MoreHorizontal, Shield, Camera, ImagePlus, Loader2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormModal, ConfirmModal } from '@/components/modals/ConfirmModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageShell, PageHeader, DashStat, ChartCard } from '@/features/app/components/dashboard';
import { TableSkeleton, StatCardSkeleton } from '@/components/loading/Skeletons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMyOrganization, useOrgMembers, useInviteOrgMember, useRemoveOrgMember, useUploadOrgLogo } from '@/hooks/queries';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import type { OrgMember } from '@/types';
import { useApiError } from '@/hooks/useApiError';

const roleStyle: Record<string, { bg: string; text: string; border: string }> = {
  owner: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  admin: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  member: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  moderator: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

export default function OrgDetail() {
  const { t } = useTranslation();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError } = useApiError();

  const { data: org, isLoading: orgLoading } = useMyOrganization();
  const orgId = org?.id || '';
  const { data: members, isLoading: membersLoading } = useOrgMembers(orgId);
  const inviteMember = useInviteOrgMember();
  const removeMember = useRemoveOrgMember();
  const uploadLogo = useUploadOrgLogo();

  const isLoading = orgLoading || membersLoading;
  const membersList = members || [];
  const owner = membersList.find(m => m.role_name === 'owner');

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    if (!file.type.startsWith('image/')) { toast.error(t('orgDetail.uploadImageError')); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t('orgDetail.logoSizeError')); return; }
    uploadLogo.mutate({ orgId, file }, {
      onSuccess: () => trackEvent(TRACK.ORG_LOGO_UPLOADED, { orgId }),
      onError: (err) => showError(err, t('orgDetail.logoUploadFailed')),
    });
  };

  const handleInvite = () => {
    if (!orgId || !inviteEmail) return;
    inviteMember.mutate({ orgId, email: inviteEmail, roleId: inviteRole }, {
      onSuccess: () => { setShowInvite(false); setInviteEmail(''); trackEvent(TRACK.ORG_MEMBER_INVITED, { orgId, role: inviteRole }); },
    });
  };

  const handleRemove = () => {
    if (!orgId || !removeTarget) return;
    removeMember.mutate({ orgId, memberId: removeTarget.id }, {
      onSuccess: () => { setRemoveTarget(null); trackEvent(TRACK.ORG_MEMBER_REMOVED, { orgId, memberId: removeTarget.id }); },
    });
  };

  const columns: Column<OrgMember>[] = [
    {
      key: 'name', header: t('organizations.name'), sortable: true,
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-label-xs font-semibold">
              {m.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-body-sm text-foreground truncate">{m.name}</p>
            <p className="text-caption text-muted-foreground truncate">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role_name', header: t('organizations.role'), sortable: true,
      render: (m) => {
        const s = roleStyle[m.role_name] || roleStyle.member;
        return (
          <Badge variant="outline" className={cn('text-label-xs border', s.bg, s.text, s.border)}>
            {m.role_name === 'owner' && <Crown className="h-2.5 w-2.5 mr-1" />}
            {m.role_name === 'admin' && <Shield className="h-2.5 w-2.5 mr-1" />}
            {m.role_name}
          </Badge>
        );
      },
    },
    {
      key: 'joined_at', header: t('organizations.memberSince'), sortable: true, hideOnMobile: true,
      render: (m) => <span className="text-body-sm text-muted-foreground">{new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>,
    },
    {
      key: 'actions', header: '', hideOnMobile: true,
      render: (m) => m.role_name !== 'owner' ? (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setRemoveTarget(m)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ) : null,
    },
  ];

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center gap-5 mb-6">
          <StatCardSkeleton count={1} />
        </div>
        <StatCardSkeleton count={3} />
        <TableSkeleton rows={5} cols={4} />
      </PageShell>
    );
  }

  const pageTransition = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } };

  return (
    <PageShell>
      <motion.div className="space-y-5" {...pageTransition}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <button onClick={() => fileInputRef.current?.click()}
                className={cn('flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden shrink-0',
                  org?.logo_url ? 'border-transparent' : 'border-border hover:border-primary/40 bg-muted/50 hover:bg-primary/5',
                  uploadLogo.isPending && 'opacity-60 pointer-events-none')}>
                {org?.logo_url ? <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover rounded-2xl" />
                  : <ImagePlus className="h-6 w-6 text-muted-foreground/60 group-hover:text-primary transition-colors" />}
              </button>
              {org?.logo_url && (
                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
            <div>
              <h1 className="text-page-title sm:text-3xl font-bold tracking-tight text-foreground leading-none">{org?.name}</h1>
              <p className="text-body-sm text-muted-foreground mt-1">/{org?.slug}</p>
            </div>
          </div>
          <Button onClick={() => setShowInvite(true)} className="h-8 text-caption gap-1.5 shadow-sm hidden sm:flex rounded-lg">
            <UserPlus className="h-3.5 w-3.5" /> {t('organizations.inviteMember')}
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <DashStat label={t('organizations.totalMembers')} value={String(membersList.length)} icon={Users} />
          <DashStat label={t('organizations.owner')} value={owner?.name || ''} icon={Crown} />
          <DashStat label={t('orgDetail.currentPlan')} value={org?.plan_name || 'Free'} icon={Mail} />
        </div>

        <ChartCard title={t('organizations.members')}
          action={<Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5 sm:hidden" onClick={() => setShowInvite(true)}><UserPlus className="h-3.5 w-3.5" /> {t('gameShell.invite')}</Button>}>
          <DataTable columns={columns} data={membersList} searchable searchPlaceholder={t('common.search')} />
        </ChartCard>
      </motion.div>

      <FormModal open={showInvite} onClose={() => setShowInvite(false)} title={t('organizations.inviteMember')}
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setShowInvite(false)} className="text-body-sm">{t('common.cancel')}</Button>
            <Button onClick={handleInvite} disabled={inviteMember.isPending} className="text-body-sm gap-2">
              <Mail className="h-3.5 w-3.5" />{inviteMember.isPending ? t('orgDetail.sending') : t('common.send')}
            </Button>
          </div>
        }>
        <div className="space-y-1.5">
          <Label className="text-body-sm">{t('organizations.inviteEmail')}</Label>
          <Input type="email" className="h-10 text-body-sm" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-body-sm">{t('organizations.inviteRole')}</Label>
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="h-10 text-body-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormModal>

      <ConfirmModal open={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove}
        title={t('organizations.removeMember')} message={t('organizations.removeConfirm')} variant="destructive" confirmLabel={t('common.delete')} />
    </PageShell>
  );
}
