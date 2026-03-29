import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Section } from './Primitives';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  events: number;
}

const DEMO_DATA: DemoUser[] = [
  { id: '1', name: 'Alice Martin', email: 'alice@flowkyn.com', role: 'Admin', status: 'active', events: 24 },
  { id: '2', name: 'Bob Chen', email: 'bob@flowkyn.com', role: 'Member', status: 'active', events: 18 },
  { id: '3', name: 'Carol Davis', email: 'carol@flowkyn.com', role: 'Member', status: 'inactive', events: 7 },
  { id: '4', name: 'David Kim', email: 'david@flowkyn.com', role: 'Owner', status: 'active', events: 42 },
  { id: '5', name: 'Eve Wilson', email: 'eve@flowkyn.com', role: 'Member', status: 'pending', events: 0 },
  { id: '6', name: 'Frank Lopez', email: 'frank@flowkyn.com', role: 'Member', status: 'active', events: 15 },
  { id: '7', name: 'Grace Park', email: 'grace@flowkyn.com', role: 'Admin', status: 'active', events: 31 },
  { id: '8', name: 'Henry Zhang', email: 'henry@flowkyn.com', role: 'Member', status: 'active', events: 9 },
  { id: '9', name: 'Iris Johnson', email: 'iris@flowkyn.com', role: 'Member', status: 'inactive', events: 3 },
  { id: '10', name: 'Jack Brown', email: 'jack@flowkyn.com', role: 'Member', status: 'active', events: 22 },
  { id: '11', name: 'Karen Lee', email: 'karen@flowkyn.com', role: 'Admin', status: 'active', events: 36 },
  { id: '12', name: 'Leo Garcia', email: 'leo@flowkyn.com', role: 'Member', status: 'pending', events: 1 },
];

const statusStyle: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/20',
};

const columns: Column<DemoUser>[] = [
  {
    key: 'name',
    header: 'User',
    sortable: true,
    render: (item) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-label-xs font-semibold bg-primary/10 text-primary">
            {item.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-body-sm font-medium text-foreground">{item.name}</p>
          <p className="text-label-xs text-muted-foreground">{item.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    render: (item) => <Badge variant="outline" className="text-label-xs">{item.role}</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (item) => (
      <Badge variant="outline" className={`text-label-xs border ${statusStyle[item.status]}`}>
        {item.status}
      </Badge>
    ),
  },
  {
    key: 'events',
    header: 'Events',
    sortable: true,
    hideOnMobile: true,
    className: 'text-right',
    render: (item) => <span className="text-body-sm font-medium text-foreground tabular-nums">{item.events}</span>,
  },
];

export function TablesSection() {
  return (
    <Section id="tables" title="Tables" description="Sortable, searchable, paginated data tables with responsive column hiding.">
      <div className="rounded-lg border border-border bg-card p-5">
        <DataTable
          columns={columns}
          data={DEMO_DATA}
          searchable
          searchPlaceholder="Search users..."
          pageSize={5}
          onRowClick={(item) => console.log('Row clicked:', item.name)}
        />
      </div>
    </Section>
  );
}
