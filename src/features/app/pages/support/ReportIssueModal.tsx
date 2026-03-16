import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { bugReportsApi } from '../../api/bugReports';

type ReportType = 'bug_report' | 'feature_request' | 'issue' | 'general_feedback';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'bug_report' as ReportType,
    priority: 'medium' as Priority,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value as ReportType,
    }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      priority: value as Priority,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) {
      setError(t('bugReports.attachmentsDesc'));
    }
    setAttachments(valid);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.title.trim()) {
        throw new Error(t('bugReports.titlePlaceholder'));
      }
      if (!formData.description.trim()) {
        throw new Error(t('bugReports.descriptionPlaceholder'));
      }

      const report = await bugReportsApi.create(formData);

      if (attachments.length > 0) {
        for (const file of attachments) {
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          await bugReportsApi.addAttachment(report.data.id, formDataFile);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          type: 'bug_report',
          priority: 'medium',
        });
        setAttachments([]);
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('bugReports.errorTitle'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('support.reportIssueTitle')}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900 text-sm">
                  {t('bugReports.successMessage')}
                </p>
                <p className="text-green-800 text-xs mt-1">
                  {t('bugReports.successDescription')}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 text-sm">{error}</p>
              </div>
            </div>
          )}

          {!success && (
            <>
              <div className="space-y-2">
                <Label htmlFor="type">{t('bugReports.reportType')}</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug_report">{t('bugReports.bugReport')}</SelectItem>
                    <SelectItem value="feature_request">{t('bugReports.featureRequest')}</SelectItem>
                    <SelectItem value="issue">{t('bugReports.issue')}</SelectItem>
                    <SelectItem value="general_feedback">{t('bugReports.generalFeedback')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">{t('bugReports.titleLabel')}</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder={t('bugReports.titlePlaceholder')}
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/300
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('bugReports.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t('bugReports.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/5000
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">{t('bugReports.priorityLabel')}</Label>
                <Select value={formData.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('bugReports.priorityLow')}</SelectItem>
                    <SelectItem value="medium">{t('bugReports.priorityMedium')}</SelectItem>
                    <SelectItem value="high">{t('bugReports.priorityHigh')}</SelectItem>
                    <SelectItem value="critical">{t('bugReports.priorityCritical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">{t('bugReports.attachmentsLabel')}</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                  />
                  <label htmlFor="attachments" className="cursor-pointer">
                    <FileUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      {t('bugReports.attachmentsHint')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('bugReports.attachmentsDesc')}
                    </p>
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      {t('bugReports.submitting')}
                    </>
                  ) : (
                    t('bugReports.submitButton')
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
