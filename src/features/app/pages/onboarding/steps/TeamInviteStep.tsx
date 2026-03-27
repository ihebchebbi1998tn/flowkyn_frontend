import { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Plus, X, AlertCircle, Check, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { parseExcelFile, downloadExcelTemplate } from '../utils/excelImport';
import type { OnboardingData, TeamInvite } from '../types';

interface TeamInviteStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
  inviteResults?: { success: string[]; failed: Array<{ email: string; reason: string }> } | null;
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

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const existingEmailsLower = useMemo(
    () => new Set(data.teamInvites.map(i => i.email.toLowerCase())),
    [data.teamInvites]
  );

  const parseBulkInvites = (text: string) => {
    const lines = text.split(/\r?\n/g).map(l => l.trim()).filter(Boolean);
    const uniqueLower = new Set<string>();
    const valid: TeamInvite[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];

    for (const line of lines) {
      const parts = line.split(/[,\t;]+/g).map(p => p.trim()).filter(Boolean);
      const email = parts[0] || '';
      const department = (parts[1] || '').trim() || 'General';
      if (!email) continue;
      const lower = email.toLowerCase();
      if (existingEmailsLower.has(lower) || uniqueLower.has(lower)) { duplicates.push(email); continue; }
      uniqueLower.add(lower);
      if (!validateEmail(email)) { invalid.push(email); continue; }
      valid.push({ email, department } as TeamInvite);
    }
    return { valid, invalid, duplicates };
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email) { setInputError(t('onboarding.teamInvite.emailRequired')); return; }
    if (!validateEmail(email)) { setInputError(t('onboarding.teamInvite.invalidEmail')); return; }
    if (data.teamInvites.some(i => i.email.toLowerCase() === email.toLowerCase())) {
      setInputError(t('onboarding.teamInvite.alreadyAdded')); return;
    }
    onChange({ teamInvites: [...data.teamInvites, { email, department: 'General' }] });
    setEmailInput('');
    setInputError('');
  };

  const handleImportBulk = () => {
    const text = bulkInput.trim();
    if (!text) { setBulkMessage(t('onboarding.teamInvite.bulk.empty')); return; }
    const { valid, invalid, duplicates } = parseBulkInvites(text);
    if (valid.length === 0) {
      if (invalid.length > 0) setBulkMessage(t('onboarding.teamInvite.bulk.noneAddedInvalid', { count: invalid.length }));
      else if (duplicates.length > 0) setBulkMessage(t('onboarding.teamInvite.bulk.noneAddedDuplicates', { count: duplicates.length }));
      else setBulkMessage(t('onboarding.teamInvite.bulk.empty'));
      return;
    }
    onChange({ teamInvites: [...data.teamInvites, ...valid] });
    const parts: string[] = [t('onboarding.teamInvite.bulk.added', { count: valid.length })];
    if (duplicates.length) parts.push(t('onboarding.teamInvite.bulk.duplicates', { count: duplicates.length }));
    if (invalid.length) parts.push(t('onboarding.teamInvite.bulk.invalid', { count: invalid.length }));
    setBulkMessage(parts.join(' · '));
    setBulkInput('');
  };

  const handleRemoveEmail = (email: string) => {
    onChange({ teamInvites: data.teamInvites.filter(i => i.email !== email) });
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
        if (result.invalid.length > 0) parts.push(t('onboarding.teamInvite.excel.invalid', { count: result.invalid.length }));
        if (result.duplicates.length > 0) parts.push(t('onboarding.teamInvite.excel.duplicates', { count: result.duplicates.length }));
        setExcelMessage(parts.join(' · ') || t('onboarding.teamInvite.excel.noValid'));
        return;
      }
      const existingLower = new Set(data.teamInvites.map(i => i.email.toLowerCase()));
      const newInvites = result.valid.filter(v => !existingLower.has(v.email.toLowerCase()));
      onChange({
        teamInvites: [...data.teamInvites, ...newInvites.map(row => ({ email: row.email, department: row.department || 'General' }) as TeamInvite)],
      });
      const parts: string[] = [t('onboarding.teamInvite.excel.added', { count: newInvites.length })];
      if (result.invalid.length) parts.push(t('onboarding.teamInvite.excel.invalid', { count: result.invalid.length }));
      if (result.duplicates.length) parts.push(t('onboarding.teamInvite.excel.duplicates', { count: result.duplicates.length }));
      setExcelMessage(parts.join(' · '));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      setExcelMessage(error?.message || t('onboarding.teamInvite.excel.error'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Single email add */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t('onboarding.teamInvite.emailPlaceholder')}
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setInputError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddEmail} className="gap-1 shrink-0">
            <Plus className="h-3.5 w-3.5" /> {t('common.add')}
          </Button>
        </div>
        {inputError && (
          <p className="flex items-center gap-1.5 text-destructive text-xs">
            <AlertCircle className="h-3 w-3" /> {inputError}
          </p>
        )}
      </div>

      {/* Bulk paste */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">{t('onboarding.teamInvite.bulk.title')}</label>
          <Button type="button" size="sm" variant="ghost" onClick={handleImportBulk} className="h-6 text-[11px] gap-1">
            <Plus className="h-3 w-3" /> {t('onboarding.teamInvite.bulk.import')}
          </Button>
        </div>
        <Textarea
          value={bulkInput}
          onChange={(e) => { setBulkInput(e.target.value); setBulkMessage(null); }}
          placeholder={t('onboarding.teamInvite.bulk.placeholder')}
          className="min-h-[60px] text-xs"
          spellCheck={false}
        />
        {bulkMessage && <p className="text-xs text-muted-foreground">{bulkMessage}</p>}
      </div>

      {/* Excel import */}
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} disabled={isImporting} className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          {isImporting ? t('onboarding.teamInvite.excel.importing') : t('onboarding.teamInvite.excel.importButton')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => downloadExcelTemplate(i18n.language?.substring(0, 2) || 'en')} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> {t('onboarding.teamInvite.excel.downloadTemplate')}
        </Button>
      </div>
      {excelMessage && <p className="text-xs text-muted-foreground">{excelMessage}</p>}

      {/* Invite list */}
      {data.teamInvites.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {t('onboarding.teamInvite.invitedList')} ({data.teamInvites.length})
          </label>
          <div className="max-h-[160px] overflow-y-auto space-y-1">
            {data.teamInvites.map((invite, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{invite.email}</span>
                </div>
                <button onClick={() => handleRemoveEmail(invite.email)} className="text-muted-foreground hover:text-foreground p-0.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
