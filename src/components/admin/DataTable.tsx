import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isEmpty?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
  emptyMessage?: React.ReactNode;
  rowClickable?: boolean;
  onRowClick?: (row: T, index: number) => void;
  highlightedRowId?: string | number;
  getRowId?: (row: T) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  isEmpty,
  onSort,
  sortKey,
  sortDirection,
  className = '',
  emptyMessage = 'No data available',
  rowClickable = false,
  onRowClick,
  highlightedRowId,
  getRowId,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;

    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortKey === key && sortDirection === 'asc') {
      newDirection = 'desc';
    }

    onSort(key, newDirection);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
    }

    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={column.width ? `w-${column.width}` : ''}
              >
                {column.sortable && onSort ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort(String(column.key))}
                    className="h-8 gap-2 px-2 font-semibold text-foreground hover:bg-slate-200"
                  >
                    {column.label}
                    {getSortIcon(String(column.key))}
                  </Button>
                ) : (
                  <span className="text-sm font-semibold">{column.label}</span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : isEmpty || data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => {
              const rowId = getRowId ? getRowId(row) : index;
              const isHighlighted = highlightedRowId === rowId;

              return (
                <TableRow
                  key={rowId}
                  className={`
                    ${rowClickable ? 'cursor-pointer hover:bg-slate-50' : ''}
                    ${isHighlighted ? 'bg-blue-50' : ''}
                  `}
                  onClick={() => rowClickable && onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <TableCell key={`${rowId}-${String(column.key)}`} className="py-3">
                      {column.render
                        ? column.render((row as any)[column.key as string], row, index)
                        : (row as any)[column.key as string]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
