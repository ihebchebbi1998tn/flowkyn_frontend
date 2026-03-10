import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader, ChartCard, EmptyState } from '@/features/app/components/dashboard';
import { TableSkeleton } from '@/components/loading/Skeletons';
import { Users } from 'lucide-react';
import { useUsers } from '@/hooks/queries/useUserQueries';
import type { User } from '@/types';

export default function UserList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers(page, 20);

  const users = data?.data ?? [];

  const columns: Column<User>[] = [
    {
      key: 'name', header: t('users.name'), sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-[13px] truncate">{u.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: t('users.role'), sortable: true,
      render: (u) => <Badge variant={u.status === 'active' ? 'default' : 'outline'} className="text-[11px]">{u.status}</Badge>,
    },
    {
      key: 'created_at', header: t('users.joined'), sortable: true, hideOnMobile: true,
      render: (u) => <span className="text-[12px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>,
    },
    {
      key: 'updated_at', header: t('users.lastActive'), sortable: true, hideOnMobile: true,
      render: (u) => <span className="text-[12px] text-muted-foreground">{new Date(u.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>,
    },
  ];

  return (
    <PageShell>
      <PageHeader title={t('users.title')} />
      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          message={t('users.noMembers')}
          description={t('users.noMembersDescription')}
        />
      ) : (
        <ChartCard title={t('users.title')}>
          <DataTable columns={columns} data={users} searchable />
        </ChartCard>
      )}
    </PageShell>
  );
}
