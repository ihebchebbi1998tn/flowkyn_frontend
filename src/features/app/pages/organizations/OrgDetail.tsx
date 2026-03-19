import { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Crown, UserPlus, Mail, MoreHorizontal, Shield, Camera, ImagePlus, Loader2, Upload, Download, X } from 'lucide-react';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormModal, ConfirmModal } from '@/components/modals/ConfirmModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageShell, PageHeader, DashStat, ChartCard } from '@/features/app/components/dashboard';
import { TableSkeleton, StatCardSkeleton } from '@/components/loading/Skeletons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreateDepartment, useDeleteDepartment, useMyOrganization, useOrgDepartments, useOrgPeople, useRemoveOrgMember, useSendOrgInvites, useUpdateDepartment, useUploadOrgLogo } from '@/hooks/queries';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import type { OrgMember } from '@/types';
import type { Department } from '@/types';
import { useApiError } from '@/hooks/useApiError';
import { parseExcelFile, downloadExcelTemplate } from '@/features/app/pages/onboarding/utils/excelImport';

const roleStyle: Record<string, { bg: string; text: string; border: string }> = {
  owner: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  admin: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  member: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  moderator: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

export default function OrgDetail() {
  const { t, i18n } = useTranslation();
  const [showInvite, setShowInvite] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [singleDepartment, setSingleDepartment] = useState('General');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [excelMessage, setExcelMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Array<{ email: string; department?: string }>>([]);
  const [departmentName, setDepartmentName] = useState('');
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invitesFileInputRef = useRef<HTMLInputElement>(null);
  const { showError } = useApiError();

  const { data: org, isLoading: orgLoading } = useMyOrganization();
  const orgId = org?.id || '';
  const { data: people, isLoading: membersLoading } = useOrgPeople(orgId);
  const { data: departments, isLoading: departmentsLoading } = useOrgDepartments(orgId);
  const sendInvites = useSendOrgInvites();
  const removeMember = useRemoveOrgMember();
  const uploadLogo = useUploadOrgLogo();
  const createDepartment = useCreateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const updateDepartment = useUpdateDepartment();
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState('');

  const isLoading = orgLoading || membersLoading;
  const members = people?.members || [];
  const invitations = people?.invitations || [];
  const membersList = [...members, ...invitations];
  const owner = membersList.find(m => (m as OrgMember).role_name === 'owner');

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

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const existingEmailsLower = useMemo(() => {
    const all = [
      ...members.map((m: any) => m?.email).filter(Boolean),
      ...invitations.map((inv: any) => inv?.email).filter(Boolean),
    ] as string[];
    return new Set(all.map((e) => String(e).toLowerCase()));
  }, [members, invitations]);

  const parseBulkInvites = (text: string) => {
    const lines = text
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean);

    const uniqueLower = new Set<string>();
    const valid: Array<{ email: string; department?: string }> = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];

    for (const line of lines) {
      const parts = line.split(/[,\t;]+/g).map((p) => p.trim()).filter(Boolean);
      const email = parts[0] || '';
      const department = (parts[1] || '').trim() || 'General';
      if (!email) continue;

      const lower = email.toLowerCase();
      if (existingEmailsLower.has(lower) || uniqueLower.has(lower) || pendingInvites.some((i) => i.email.toLowerCase() === lower)) {
        duplicates.push(email);
        continue;
      }
      uniqueLower.add(lower);

      if (!validateEmail(email)) {
        invalid.push(email);
        continue;
      }

      valid.push({ email, department });
    }

    return { valid, invalid, duplicates, total: lines.length, unique: uniqueLower.size };
  };

  const handleAddSingle = () => {
    const email = emailInput.trim();
    const department = (singleDepartment || '').trim() || 'General';
    if (!email) {
      toast.error(t('onboarding.teamInvite.emailRequired'));
      return;
    }
    if (!validateEmail(email)) {
      toast.error(t('onboarding.teamInvite.invalidEmail'));
      return;
    }
    const lower = email.toLowerCase();
    if (existingEmailsLower.has(lower) || pendingInvites.some((i) => i.email.toLowerCase() === lower)) {
      toast.error(t('onboarding.teamInvite.alreadyAdded'));
      return;
    }
    setPendingInvites((prev) => [...prev, { email, department }]);
    setEmailInput('');
    setBulkMessage(null);
    setExcelMessage(null);
  };

  const handleImportBulk = () => {
    const text = bulkInput.trim();
    if (!text) {
      setBulkMessage(t('onboarding.teamInvite.bulk.empty'));
      return;
    }

    const { valid, invalid, duplicates } = parseBulkInvites(text);
    if (valid.length === 0) {
      if (invalid.length > 0) setBulkMessage(t('onboarding.teamInvite.bulk.noneAddedInvalid', { count: invalid.length }));
      else if (duplicates.length > 0) setBulkMessage(t('onboarding.teamInvite.bulk.noneAddedDuplicates', { count: duplicates.length }));
      else setBulkMessage(t('onboarding.teamInvite.bulk.empty'));
      return;
    }

    setPendingInvites((prev) => [...prev, ...valid]);
    setBulkInput('');
    const added = valid.length;
      setBulkMessage(
        [
          t('onboarding.teamInvite.bulk.added', { count: added }),
          t('onboarding.teamInvite.bulk.invalid', { count: invalid.length }),
          t('onboarding.teamInvite.bulk.duplicates', { count: duplicates.length }),
        ].join(' · ')
      );
  };

  const handleExcelImport = async (file: File) => {
    try {
      setIsImporting(true);
      setExcelMessage(null);
      const res = await parseExcelFile(file);
      const mapped = (res.valid || []).map((row) => ({
        email: row.email,
        department: (row.department || '').trim() || 'General',
      }));

      const filtered = mapped.filter((row) => {
        const lower = row.email.toLowerCase();
        return !existingEmailsLower.has(lower) && !pendingInvites.some((i) => i.email.toLowerCase() === lower);
      });

      setPendingInvites((prev) => [...prev, ...filtered]);

      setExcelMessage(
        [
          t('onboarding.teamInvite.excel.added', { count: filtered.length }),
          t('onboarding.teamInvite.excel.invalid', { count: res.invalid?.length ?? 0 }),
          t('onboarding.teamInvite.excel.duplicates', { count: res.duplicates?.length ?? 0 }),
        ].join(' · ')
      );
    } catch (err) {
      console.warn('[OrgDetail] excel import failed', err);
      setExcelMessage(t('onboarding.teamInvite.excel.error'));
    } finally {
      setIsImporting(false);
      if (invitesFileInputRef.current) invitesFileInputRef.current.value = '';
    }
  };

  const handleSendInvites = () => {
    if (!orgId) return;
    if (pendingInvites.length === 0) return;
    sendInvites.mutate(
      { orgId, invites: pendingInvites, lang: i18n.language },
      {
        onSuccess: (res) => {
          setShowInvite(false);
          setPendingInvites([]);
          setBulkInput('');
          setBulkMessage(null);
          setExcelMessage(null);
          trackEvent(TRACK.ORG_MEMBER_INVITED, { orgId, count: pendingInvites.length });
          if ((res?.failed?.length ?? 0) > 0) toast.error(t('organizations.invitesSomeFailed', { count: res.failed.length }));
        },
      }
    );
  };

  const handleRemove = () => {
    if (!orgId || !removeTarget) return;
    removeMember.mutate({ orgId, memberId: removeTarget.id }, {
      onSuccess: () => { setRemoveTarget(null); trackEvent(TRACK.ORG_MEMBER_REMOVED, { orgId, memberId: removeTarget.id }); },
    });
  };

  const columns: Column<any>[] = [
    {
      key: 'name', header: t('organizations.name'), sortable: true,
      render: (row) => {
        const member = row as OrgMember;
        const isMember = !!member.name;
        const displayName = isMember ? member.name : t('organizations.invitedMember');
        const email = (row as any).email;

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-label-xs font-semibold">
                {isMember
                  ? member.name.split(' ').map(n => n[0]).join('')
                  : (email || '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-body-sm text-foreground truncate">{displayName}</p>
              <p className="text-caption text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role_name', header: t('organizations.role'), sortable: true,
      render: (row) => {
        const member = row as OrgMember;
        const isMember = !!member.role_name;

        if (!isMember) {
          return (
            <Badge variant="outline" className="text-label-xs border bg-amber-50 text-amber-700 border-amber-200">
              {t('organizations.invitedPending')}
            </Badge>
          );
        }

        const s = roleStyle[member.role_name] || roleStyle.member;
        const roleLabel =
          member.role_name === 'owner'
            ? t('roles.owner')
            : member.role_name === 'admin'
              ? t('roles.admin')
              : member.role_name === 'moderator'
                ? t('roles.moderator')
                : t('roles.member');
        return (
          <Badge variant="outline" className={cn('text-label-xs border', s.bg, s.text, s.border)}>
            {member.role_name === 'owner' && <Crown className="h-2.5 w-2.5 mr-1" />}
            {member.role_name === 'admin' && <Shield className="h-2.5 w-2.5 mr-1" />}
            {roleLabel}
          </Badge>
        );
      },
    },
    {
      key: 'joined_at', header: t('organizations.memberSince'), sortable: true, hideOnMobile: true,
      render: (row) => {
        const member = row as OrgMember;
        if (!member.joined_at) {
          const created = (row as any).created_at;
          if (!created) {
            return <span className="text-body-sm text-muted-foreground">—</span>;
          }
          return (
            <span className="text-body-sm text-muted-foreground">
              {new Date(created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          );
        }
        return (
          <span className="text-body-sm text-muted-foreground">
            {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'actions', header: '', hideOnMobile: true,
      render: (row) => {
        const member = row as OrgMember;
        const isMember = !!member.id;
        if (!isMember || member.role_name === 'owner') {
          return null;
        }
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setRemoveTarget(member)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        );
      },
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

  const departmentColumns: Column<Department>[] = [
    {
      key: 'name',
      header: t('departments.name'),
      sortable: true,
      render: (row) => {
        const dept = row as Department;
        const isEditing = editingDepartmentId === dept.id;
        if (isEditing) {
          return (
            <Input
              value={editingDepartmentName}
              onChange={(e) => setEditingDepartmentName(e.target.value)}
              className="h-8 text-body-sm max-w-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = editingDepartmentName.trim();
                  if (!name || !orgId) return;
                  updateDepartment.mutate(
                    { orgId, departmentId: dept.id, name },
                    {
                      onSuccess: () => {
                        setEditingDepartmentId(null);
                        setEditingDepartmentName('');
                      },
                    }
                  );
                }
                if (e.key === 'Escape') {
                  setEditingDepartmentId(null);
                  setEditingDepartmentName('');
                }
              }}
              onBlur={() => {
                setEditingDepartmentId(null);
                setEditingDepartmentName('');
              }}
            />
          );
        }
        return (
          <span className="text-body-sm font-medium text-foreground">
            {dept.name}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      hideOnMobile: true,
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={() => {
              const dept = row as Department;
              setEditingDepartmentId(dept.id);
              setEditingDepartmentName(dept.name);
            }}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-destructive"
            disabled={deleteDepartment.isPending}
            onClick={() => {
              if (!orgId) return;
              deleteDepartment.mutate(
                { orgId, departmentId: (row as Department).id },
                {
                  onSuccess: () => setDepartmentName(''),
                  onError: (err) => showError(err, t('apiErrors.INTERNAL_ERROR')),
                }
              );
            }}
          >
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

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
          <DashStat label={t('organizations.owner')} value={(owner as OrgMember)?.name || ''} icon={Crown} />
          <DashStat label={t('orgDetail.currentPlan')} value={org?.plan_name || t('plans.free')} icon={Mail} />
        </div>

        <ChartCard title={t('organizations.members')}
          action={<Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5 sm:hidden" onClick={() => setShowInvite(true)}><UserPlus className="h-3.5 w-3.5" /> {t('gameShell.invite')}</Button>}>
          <DataTable columns={columns} data={membersList} searchable searchPlaceholder={t('common.search')} />
        </ChartCard>

        <ChartCard title={t('departments.title')}>
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder={t('departments.placeholder')}
                className="h-10"
                disabled={createDepartment.isPending || departmentsLoading}
              />
              <Button
                onClick={() => {
                  if (!orgId) return;
                  const name = departmentName.trim();
                  if (!name) return;
                  createDepartment.mutate(
                    { orgId, name },
                    {
                      onSuccess: () => setDepartmentName(''),
                    }
                  );
                }}
                disabled={createDepartment.isPending || departmentsLoading || !departmentName.trim()}
                className="h-10"
              >
                {t('common.create')}
              </Button>
            </div>

            {departmentsLoading ? (
              <TableSkeleton rows={5} cols={2} />
            ) : (
              <DataTable
                columns={departmentColumns}
                data={departments || []}
                searchable={false}
              />
            )}
          </div>
        </ChartCard>
      </motion.div>

      <FormModal open={showInvite} onClose={() => setShowInvite(false)} title={t('organizations.inviteMember')}
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setShowInvite(false)} className="text-body-sm">{t('common.cancel')}</Button>
            <Button onClick={handleSendInvites} disabled={sendInvites.isPending || pendingInvites.length === 0} className="text-body-sm gap-2">
              <Mail className="h-3.5 w-3.5" />{sendInvites.isPending ? t('orgDetail.sending') : t('common.send')}
            </Button>
          </div>
        }>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-body-sm">{t('organizations.inviteEmail')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                type="email"
                className="h-10 text-body-sm sm:col-span-2"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder={t('organizations.inviteEmailPlaceholder')}
              />
              <Input
                className="h-10 text-body-sm"
                value={singleDepartment}
                onChange={(e) => setSingleDepartment(e.target.value)}
                placeholder={t('departments.placeholder')}
                list="org-departments"
              />
              <datalist id="org-departments">
                <option value="General" />
                {(departments || []).map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleAddSingle} disabled={!emailInput.trim()}>
                <UserPlus className="h-4 w-4" />
                {t('common.add')}
              </Button>
            </div>
            <p className="text-caption text-muted-foreground">
              {t('departments.importHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm">{t('onboarding.teamInvite.bulk.title')}</Label>
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="min-h-[110px] text-body-sm"
              placeholder={t('onboarding.teamInvite.bulk.placeholder')}
            />
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleImportBulk} disabled={!bulkInput.trim()}>
                <Upload className="h-4 w-4" />
                {t('onboarding.teamInvite.bulk.import')}
              </Button>
              {bulkMessage && <span className="text-caption text-muted-foreground">{bulkMessage}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm">{t('onboarding.teamInvite.excel.title')}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={invitesFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleExcelImport(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => invitesFileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('onboarding.teamInvite.excel.importButton')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2"
                onClick={() => downloadExcelTemplate(i18n.language)}
              >
                <Download className="h-4 w-4" />
                {t('onboarding.teamInvite.excel.downloadTemplate')}
              </Button>
              {excelMessage && <span className="text-caption text-muted-foreground">{excelMessage}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-body-sm">
                {t('organizations.pendingInvites')} ({pendingInvites.length})
              </Label>
              {pendingInvites.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={() => setPendingInvites([])}
                >
                  {t('common.clearAll')}
                </Button>
              )}
            </div>

            {pendingInvites.length === 0 ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-body-sm text-muted-foreground">
                {t('organizations.noPendingInvites')}
              </div>
            ) : (
              <div className="max-h-44 overflow-auto rounded-lg border">
                <div className="divide-y">
                  {pendingInvites.map((inv) => (
                    <div key={inv.email.toLowerCase()} className="flex items-center justify-between gap-2 p-2">
                      <div className="min-w-0">
                        <div className="text-body-sm font-medium text-foreground truncate">{inv.email}</div>
                        <div className="text-caption text-muted-foreground truncate">
                          {t('departments.name')}: {inv.department || 'General'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setPendingInvites((prev) => prev.filter((x) => x.email.toLowerCase() !== inv.email.toLowerCase()))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </FormModal>

      <ConfirmModal open={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove}
        title={t('organizations.removeMember')} message={t('organizations.removeConfirm')} variant="destructive" confirmLabel={t('common.delete')} />
    </PageShell>
  );
}
