import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader, ChartCard, EmptyState } from '@/features/app/components/dashboard';
import { TableSkeleton } from '@/components/loading/Skeletons';
import { Users } from 'lucide-react';
import { useOrgMembers } from '@/hooks/queries/useOrgQueries';
import { useAuth } from '@/features/app/context/AuthContext';
import type { User } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function UserList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  // Fetch org members instead of all users — scoped to the user's organization
  const { data, isLoading } = useOrgMembers(page, 20);

  const members = data?.data ?? [];

  const columns: Column<any>[] = [
    {
      key: 'name', header: t('users.name'), sortable: true,
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
              {(m.name || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-[13px] truncate">{m.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: t('users.role'), sortable: true,
      render: (m) => (
        <Badge variant={m.role === 'owner' ? 'default' : 'outline'} className="text-[11px]">
          {t(`organizations.roles.${m.role}`, m.role)}
        </Badge>
      ),
    },
    {
      key: 'joined_at', header: t('users.joined'), sortable: true, hideOnMobile: true,
      render: (m) => {
        const date = m.joined_at || m.created_at;
        if (!date) return <span className="text-[12px] text-muted-foreground">—</span>;
        return (
          <span className="text-[12px] text-muted-foreground">
            {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'last_active', header: t('users.lastActive'), sortable: true, hideOnMobile: true,
      render: (m) => {
        const date = m.updated_at || m.last_active;
        if (!date) return <span className="text-[12px] text-muted-foreground">—</span>;
        try {
          return (
            <span className="text-[12px] text-muted-foreground">
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </span>
          );
        } catch {
          return <span className="text-[12px] text-muted-foreground">—</span>;
        }
      },
    },
  ];

  return (
    <PageShell>
      <PageHeader title={t('users.title')} />
      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          message={t('users.noMembers')}
          description={t('users.noMembersDescription')}
        />
      ) : (
        <ChartCard title={t('users.title')}>
          <DataTable columns={columns} data={members} searchable />
        </ChartCard>
      )}
    </PageShell>
  );
}