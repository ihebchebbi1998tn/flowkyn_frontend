/**
 * @fileoverview Team Invite Step — Optional fifth step for onboarding.
 * 
 * Allows users to invite teammates by email during onboarding.
 * Supports manual entry, bulk paste, and Excel file import.
 * Invitations are sent immediately and teammates can join when launching events.
 */

import { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Plus, X, AlertCircle, Check, Download, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { parseExcelFile, downloadExcelTemplate } from '../utils/excelImport';

import type { OnboardingData, TeamInvite } from '../types';

interface TeamInviteStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
  inviteResults?: {
    success: string[];
    failed: Array<{ email: string; reason: string }>;
  } | null;
}

export function TeamInviteStep({ data, onChange, inviteResults }: TeamInviteStepProps) {
  const { t, i18n } = useTranslation();
  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [excelMessage, setExcelMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const existingEmailsLower = useMemo(() => {
    return new Set(data.teamInvites.map(i => i.email.toLowerCase()));
  }, [data.teamInvites]);

  /**
   * Parse bulk invite lines.
   * Supported row formats:
   * - `email`
   * - `email,department`
   * - `email;department`
   * - `email[TAB]department`
   */
  const parseBulkInvites = (text: string) => {
    const lines = text
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean);

    const uniqueLower = new Set<string>();
    const valid: TeamInvite[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];

    for (const line of lines) {
      // Split by typical CSV-ish separators; take first two columns.
      const parts = line.split(/[,\t;]+/g).map((p) => p.trim()).filter(Boolean);
      const email = parts[0] || '';
      const department = (parts[1] || '').trim() || 'General';

      if (!email) continue;

      const lower = email.toLowerCase();
      if (existingEmailsLower.has(lower) || uniqueLower.has(lower)) {
        duplicates.push(email);
        continue;
      }

      uniqueLower.add(lower);

      if (!validateEmail(email)) {
        invalid.push(email);
        continue;
      }

      valid.push({ email, department } as TeamInvite);
    }

    return { valid, invalid, duplicates, total: lines.length, unique: uniqueLower.size };
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    
    if (!email) {
      setInputError(t('onboarding.teamInvite.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setInputError(t('onboarding.teamInvite.invalidEmail'));
      return;
    }

    // Check if already added
    if (data.teamInvites.some(invite => invite.email.toLowerCase() === email.toLowerCase())) {
      setInputError(t('onboarding.teamInvite.alreadyAdded'));
      return;
    }

    // Add the email
    onChange({
      teamInvites: [...data.teamInvites, { email, department: 'General' }]
    });

    setEmailInput('');
    setInputError('');
    setBulkMessage(null);
  };

  const handleImportBulk = () => {
    const text = bulkInput.trim();
    if (!text) {
      setBulkMessage(t('onboarding.teamInvite.bulk.empty'));
      return;
    }

    const { valid, invalid, duplicates } = parseBulkInvites(text);

    if (valid.length === 0) {
      if (invalid.length > 0) {
        setBulkMessage(t('onboarding.teamInvite.bulk.noneAddedInvalid', { count: invalid.length }));
      } else if (duplicates.length > 0) {
        setBulkMessage(t('onboarding.teamInvite.bulk.noneAddedDuplicates', { count: duplicates.length }));
      } else {
        setBulkMessage(t('onboarding.teamInvite.bulk.empty'));
      }
      return;
    }

    onChange({
      teamInvites: [
        ...data.teamInvites,
        ...valid,
      ],
    });

    const parts: string[] = [];
    parts.push(t('onboarding.teamInvite.bulk.added', { count: valid.length }));
    if (duplicates.length) parts.push(t('onboarding.teamInvite.bulk.duplicates', { count: duplicates.length }));
    if (invalid.length) parts.push(t('onboarding.teamInvite.bulk.invalid', { count: invalid.length }));

    setBulkMessage(parts.join(' · '));
    setBulkInput('');
    setInputError('');
  };

  const handleRemoveEmail = (email: string) => {
    onChange({
      teamInvites: data.teamInvites.filter(invite => invite.email !== email)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setExcelMessage(null);

    try {
      const result = await parseExcelFile(file);

      if (result.valid.length === 0) {
        const parts: string[] = [];
        if (result.invalid.length > 0) {
          parts.push(t('onboarding.teamInvite.excel.invalid', { count: result.invalid.length }));
        }
        if (result.duplicates.length > 0) {
          parts.push(t('onboarding.teamInvite.excel.duplicates', { count: result.duplicates.length }));
        }
        setExcelMessage(parts.join(' · ') || t('onboarding.teamInvite.excel.noValid'));
        return;
      }

      // Merge with existing invites, avoiding duplicates
      const existingLower = new Set(data.teamInvites.map(i => i.email.toLowerCase()));
      const newInvites = result.valid.filter(
        v => !existingLower.has(v.email.toLowerCase())
      );

      onChange({
        teamInvites: [
          ...data.teamInvites,
          ...newInvites.map((row) => ({
            email: row.email,
            department: row.department || 'General',
          }) as TeamInvite),
        ],
      });

      const parts: string[] = [];
      parts.push(t('onboarding.teamInvite.excel.added', { count: newInvites.length }));
      if (result.invalid.length) parts.push(t('onboarding.teamInvite.excel.invalid', { count: result.invalid.length }));
      if (result.duplicates.length) parts.push(t('onboarding.teamInvite.excel.duplicates', { count: result.duplicates.length }));

      setExcelMessage(parts.join(' · '));

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setExcelMessage(
        error?.message || t('onboarding.teamInvite.excel.error')
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(i18n.language?.substring(0, 2) || 'en');
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {t('onboarding.teamInvite.helperText')}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {t('onboarding.teamInvite.optional')}
          </p>
        </div>
      </div>

      {/* Email Input Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          {t('onboarding.teamInvite.email')}
        </label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t('onboarding.teamInvite.emailPlaceholder')}
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setInputError('');
            }}
            onKeyPress={handleKeyPress}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="button"
            onClick={handleAddEmail}
            variant="outline"
            className="gap-1.5 min-w-[100px]"
          >
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </Button>
        </div>
        {inputError && (
          <div className="flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="h-3 w-3" />
            {inputError}
          </div>
        )}
      </div>

      {/* Bulk import */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-foreground">
            {t('onboarding.teamInvite.bulk.title')}
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkInput('');
                setBulkMessage(null);
              }}
            >
              {t('onboarding.teamInvite.bulk.clear')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleImportBulk}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t('onboarding.teamInvite.bulk.import')}
            </Button>
          </div>
        </div>

        <Textarea
          value={bulkInput}
          onChange={(e) => {
            setBulkInput(e.target.value);
            setBulkMessage(null);
          }}
          placeholder={t('onboarding.teamInvite.bulk.placeholder')}
          className="min-h-[110px]"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          {t('onboarding.teamInvite.bulk.hint')}
        </p>
        {bulkMessage && (
          <p className="text-xs text-muted-foreground">{bulkMessage}</p>
        )}
      </div>

      {/* Excel Import */}
      <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <label className="text-sm font-medium text-foreground">
              {t('onboarding.teamInvite.excel.title')}
            </label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            {t('onboarding.teamInvite.excel.downloadTemplate')}
          </Button>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelImport}
            disabled={isImporting}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="gap-1.5 flex-1"
          >
            {isImporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {t('onboarding.teamInvite.excel.importing')}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {t('onboarding.teamInvite.excel.importButton')}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('onboarding.teamInvite.excel.hint')}
        </p>

        {excelMessage && (
          <div className={cn(
            'flex items-start gap-2 text-xs p-2 rounded',
            excelMessage.includes(t('onboarding.teamInvite.excel.added') || 'added')
              ? 'text-success/80 bg-success/5'
              : 'text-muted-foreground bg-muted/30'
          )}>
            {excelMessage}
          </div>
        )}
      </div>
      {data.teamInvites.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            {t('onboarding.teamInvite.invitedList')} 
            <span className="text-muted-foreground font-normal ml-1">
              {data.teamInvites.length}
            </span>
          </label>
          <div className="space-y-2">
            {data.teamInvites.map((invite, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  invite.error
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-muted/30'
                )}
              >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Mail className={cn(
                  'h-4 w-4 shrink-0',
                  invite.error ? 'text-destructive' : 'text-primary'
                )} />
                <span className="text-sm text-foreground truncate">{invite.email}</span>
                {!invite.error && invite.department && (
                  <span className="text-xs text-muted-foreground truncate">{invite.department}</span>
                )}
                {!invite.error && (
                  <Check className="h-4 w-4 text-success shrink-0" />
                )}
              </div>
                <button
                  onClick={() => handleRemoveEmail(invite.email)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={t('common.remove')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('onboarding.teamInvite.benefit1')}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('onboarding.teamInvite.benefit2')}
          </p>
        </div>
      </div>
    </div>
  );
}
