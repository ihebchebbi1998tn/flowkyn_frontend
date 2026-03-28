/**
 * @fileoverview Reusable admin table with search, pagination, and loading states.
 * Extracted from AdminUsers, AdminOrganizations, AdminContacts.
 */

import { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/loading/Skeletons';

interface Column<T> {
  key: string;
  header: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  render?: (item: T) => ReactNode;
}

interface AdminDataTableProps<T> {
  title: string;
  subtitle: string;
  data: T[];
  columns: Column<T>[];
  total: number;
  page: number;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  actions?: ReactNode;
  itemsPerPage?: number;
}

export function AdminDataTable<T extends { id: string }>({
  title,
  subtitle,
  data,
  columns,
  total,
  page,
  loading,
  search,
  onSearchChange,
  onPageChange,
  emptyMessage = 'No data found',
  actions,
  itemsPerPage = 20,
}: AdminDataTableProps<T>) {
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={title} 
        subtitle={subtitle} 
        actions={
          <div className="flex items-center gap-2">
            {actions}
            <Badge variant="outline">{total} total</Badge>
          </div>
        } 
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}...`}
          className="pl-10 h-9"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map(col => (
                  <th 
                    key={col.key}
                    className={`text-left font-semibold px-4 py-3 text-muted-foreground ${
                      col.hideOnMobile ? 'hidden sm:table-cell' : 
                      col.hideOnTablet ? 'hidden md:table-cell' : ''
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="text-right font-semibold px-4 py-3 text-muted-foreground w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <TableSkeleton rows={5} cols={columns.length + 1} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr 
                    key={item.id} 
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {columns.map(col => (
                      <td 
                        key={col.key}
                        className={`px-4 py-3 ${
                          col.hideOnMobile ? 'hidden sm:table-cell' : 
                          col.hideOnTablet ? 'hidden md:table-cell' : ''
                        }`}
                      >
                        {col.render ? col.render(item) : String((item as any)[col.key] || '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      {/* Actions slot - to be overridden by parent */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page <= 1} 
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-[13px] text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page >= totalPages} 
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}