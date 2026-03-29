import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}

export interface TextInputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  rows?: number;
}

export interface SelectInputProps extends FormFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options: Array<{ value: string; label: string }>;
}

export interface CheckboxInputProps extends FormFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function FormTextInput({
  label,
  error,
  required,
  hint,
  className = '',
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  rows,
}: TextInputProps) {
  const Component = rows ? 'textarea' : 'input';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
      )}
      {rows ? (
        <textarea
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-muted-foreground"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9"
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormSelectInput({
  label,
  error,
  required,
  hint,
  className = '',
  placeholder,
  value,
  onChange,
  disabled,
  options,
}: SelectInputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
      )}
      <select
        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-muted-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormCheckboxInput({
  label,
  error,
  className = '',
  checked,
  onChange,
  disabled,
}: CheckboxInputProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Checkbox
        checked={checked}
        onCheckedChange={(checked) => onChange(checked as boolean)}
        disabled={disabled}
        id={label}
      />
      {label && (
        <Label htmlFor={label} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
      )}
      {error && <p className="text-xs text-red-600 ml-auto">{error}</p>}
    </div>
  );
}
