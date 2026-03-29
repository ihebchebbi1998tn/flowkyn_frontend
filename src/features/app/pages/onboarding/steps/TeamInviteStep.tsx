import { useMemo, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Plus, X, AlertCircle, Upload, Download, FileSpreadsheet, Users, UserPlus, ClipboardPaste, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

type ImportMethod = 'single' | 'bulk' | 'file';

export function TeamInviteStep({ data, onChange, inviteResults }: TeamInviteStepProps) {
  const { t, i18n } = useTranslation();
  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMessage, setBulkMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [excelMessage, setExcelMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeMethod, setActiveMethod] = useState<ImportMethod>('single');
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
    if (!text) { setBulkMessage({ text: t('onboarding.teamInvite.bulk.empty'), type: 'error' }); return; }
    const { valid, invalid, duplicates } = parseBulkInvites(text);
    if (valid.length === 0) {
      if (invalid.length > 0) setBulkMessage({ text: t('onboarding.teamInvite.bulk.noneAddedInvalid', { count: invalid.length }), type: 'error' });
      else if (duplicates.length > 0) setBulkMessage({ text: t('onboarding.teamInvite.bulk.noneAddedDuplicates', { count: duplicates.length }), type: 'error' });
      else setBulkMessage({ text: t('onboarding.teamInvite.bulk.empty'), type: 'error' });
      return;
    }
    onChange({ teamInvites: [...data.teamInvites, ...valid] });
    const parts: string[] = [t('onboarding.teamInvite.bulk.added', { count: valid.length })];
    if (duplicates.length) parts.push(t('onboarding.teamInvite.bulk.duplicates', { count: duplicates.length }));
    if (invalid.length) parts.push(t('onboarding.teamInvite.bulk.invalid', { count: invalid.length }));
    setBulkMessage({ text: parts.join(' · '), type: 'success' });
    setBulkInput('');
  };

  const handleRemoveEmail = (email: string) => {
    onChange({ teamInvites: data.teamInvites.filter(i => i.email !== email) });
  };

  const handleClearAll = () => {
    onChange({ teamInvites: [] });
  };

  const processFile = async (file: File) => {
    setIsImporting(true);
    setExcelMessage(null);
    try {
      const result = await parseExcelFile(file);
      if (result.valid.length === 0) {
        const parts: string[] = [];
        if (result.invalid.length > 0) parts.push(t('onboarding.teamInvite.excel.invalid', { count: result.invalid.length }));
        if (result.duplicates.length > 0) parts.push(t('onboarding.teamInvite.excel.duplicates', { count: result.duplicates.length }));
        setExcelMessage({ text: parts.join(' · ') || t('onboarding.teamInvite.excel.noValid'), type: 'error' });
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
      setExcelMessage({ text: parts.join(' · '), type: 'success' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      setExcelMessage({ text: error?.message || t('onboarding.teamInvite.excel.error'), type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
      await processFile(file);
    } else {
      setExcelMessage({ text: 'Please drop an Excel (.xlsx, .xls) or CSV file', type: 'error' });
    }
  }, [data.teamInvites]);

  const methods: { key: ImportMethod; icon: typeof UserPlus; label: string }[] = [
    { key: 'single', icon: UserPlus, label: t('onboarding.teamInvite.methods.single', { defaultValue: 'Add email' }) },
    { key: 'bulk', icon: ClipboardPaste, label: t('onboarding.teamInvite.methods.bulk', { defaultValue: 'Paste list' }) },
    { key: 'file', icon: FileSpreadsheet, label: t('onboarding.teamInvite.methods.file', { defaultValue: 'Import file' }) },
  ];

  return (
    <div className="space-y-5">
      {/* Method selector tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
        {methods.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveMethod(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200",
              activeMethod === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Single email input */}
      <AnimatePresence mode="wait">
        {activeMethod === 'single' && (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t('onboarding.teamInvite.emailPlaceholder')}
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setInputError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                  className="pl-9"
                />
              </div>
              <Button type="button" onClick={handleAddEmail} size="sm" className="gap-1.5 shrink-0 h-9">
                <Plus className="h-3.5 w-3.5" /> {t('common.add')}
              </Button>
            </div>
            {inputError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-destructive text-xs"
              >
                <AlertCircle className="h-3 w-3" /> {inputError}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Bulk paste */}
        {activeMethod === 'bulk' && (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <Textarea
              value={bulkInput}
              onChange={(e) => { setBulkInput(e.target.value); setBulkMessage(null); }}
              placeholder={t('onboarding.teamInvite.bulk.placeholder')}
              className="min-h-[100px] text-xs font-mono"
              spellCheck={false}
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                {t('onboarding.teamInvite.bulk.hint', { defaultValue: 'One email per line. Optionally add department after a comma.' })}
              </p>
              <Button type="button" size="sm" onClick={handleImportBulk} disabled={!bulkInput.trim()} className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" /> {t('onboarding.teamInvite.bulk.import')}
              </Button>
            </div>
            {bulkMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg text-xs",
                  bulkMessage.type === 'success' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  bulkMessage.type === 'error' && "bg-destructive/10 text-destructive",
                  bulkMessage.type === 'info' && "bg-primary/10 text-primary"
                )}
              >
                {bulkMessage.type === 'error' ? <AlertCircle className="h-3.5 w-3.5 shrink-0" /> : null}
                {bulkMessage.text}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* File import with drag & drop */}
        {activeMethod === 'file' && (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelImport}
                disabled={isImporting}
                className="hidden"
              />
              <div className={cn(
                "p-3 rounded-full transition-colors",
                isDragOver ? "bg-primary/10" : "bg-muted/50"
              )}>
                <Upload className={cn("h-6 w-6 transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isImporting
                    ? t('onboarding.teamInvite.excel.importing')
                    : t('onboarding.teamInvite.excel.dropzone', { defaultValue: 'Drop your file here or click to browse' })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('onboarding.teamInvite.excel.formats', { defaultValue: 'Supports .xlsx, .xls, and .csv files' })}
                </p>
              </div>
              {isImporting && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl backdrop-blur-sm">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => downloadExcelTemplate(i18n.language?.substring(0, 2) || 'en')}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full"
            >
              <Download className="h-3.5 w-3.5" /> {t('onboarding.teamInvite.excel.downloadTemplate')}
            </Button>

            {excelMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg text-xs",
                  excelMessage.type === 'success' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  excelMessage.type === 'error' && "bg-destructive/10 text-destructive",
                  excelMessage.type === 'info' && "bg-primary/10 text-primary"
                )}
              >
                {excelMessage.type === 'error' ? <AlertCircle className="h-3.5 w-3.5 shrink-0" /> : null}
                {excelMessage.text}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite list */}
      <AnimatePresence>
        {data.teamInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t('onboarding.teamInvite.invitedList')}
                </span>
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                  {data.teamInvites.length}
                </span>
              </div>
              {data.teamInvites.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  {t('onboarding.teamInvite.clearAll', { defaultValue: 'Clear all' })}
                </button>
              )}
            </div>

            <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              <AnimatePresence initial={false}>
                {data.teamInvites.map((invite, idx) => (
                  <motion.div
                    key={invite.email}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
                        {invite.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate text-foreground">{invite.email}</p>
                        {invite.department && invite.department !== 'General' && (
                          <p className="text-[11px] text-muted-foreground truncate">{invite.department}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(invite.email)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {data.teamInvites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="p-2.5 rounded-full bg-muted/50 mb-2">
            <Users className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('onboarding.teamInvite.emptyState', { defaultValue: 'No team members added yet. Start by adding emails above.' })}
          </p>
        </div>
      )}
    </div>
  );
}
