import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages?: number;
  pageSize: number;
  total?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  showTotalItems?: boolean;
  loading?: boolean;
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showTotalItems = true,
  loading = false,
}: PaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = totalPages ? page < totalPages : true;

  return (
    <div className="flex items-center justify-between py-4 px-4 border-t bg-slate-50">
      <div className="flex items-center gap-4">
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Items per page:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 text-sm border rounded-md"
              disabled={loading}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {showTotalItems && total && (
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} items
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev || loading}
          className="gap-1"
        >
          <ChevronsLeft className="w-4 h-4" />
          First
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev || loading}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="px-3 py-1 text-sm border rounded-md bg-white">
          Page <span className="font-semibold">{page}</span>
          {totalPages && <span className="text-muted-foreground"> of {totalPages}</span>}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext || loading}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages || page + 1)}
          disabled={!canGoNext || loading}
          className="gap-1"
        >
          Last
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
