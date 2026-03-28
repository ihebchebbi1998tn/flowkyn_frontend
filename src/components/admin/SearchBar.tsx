import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onClear?: () => void;
  className?: string;
  showClear?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  onClear,
  className = '',
  showClear = true,
}: SearchBarProps) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(value);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 h-9"
      />
      {showClear && value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 h-7 w-7 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface FilterBarProps {
  filters: {
    [key: string]: string | string[];
  };
  onFilterChange: (key: string, value: string | string[]) => void;
  options: {
    [key: string]: FilterOption[];
  };
  className?: string;
}

export function FilterBar({ filters, onFilterChange, options, className = '' }: FilterBarProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {Object.entries(options).map(([key, filterOptions]) => (
        <div key={key} className="flex items-center gap-2">
          <select
            value={filters[key] || ''}
            onChange={(e) => onFilterChange(key, e.target.value)}
            className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All {key}</option>
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
