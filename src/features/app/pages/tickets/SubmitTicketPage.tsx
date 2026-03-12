/**
 * Submit Bug Report / Ticket Page
 * 
 * Users can report bugs, request features, and report issues here.
 */

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { bugReportsApi, type BugReportType, type BugReportPriority } from '@/features/app/api/bugReports';
import { PageHeader } from '@/components/common/PageHeader';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Attachment {
  file: File;
  preview: string;
}

const typeOptions = [
  { value: 'bug_report', label: '🐛 Bug Report', description: 'Something isn\'t working correctly' },
  { value: 'feature_request', label: '✨ Feature Request', description: 'Suggest a new feature' },
  { value: 'issue', label: '⚠️ Issue', description: 'General problem or concern' },
  { value: 'general_feedback', label: '💬 General Feedback', description: 'General comment or suggestion' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

export default function SubmitTicketPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<BugReportType>('bug_report');
  const [priority, setPriority] = useState<BugReportPriority>('medium');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > maxFileSize) {
        toast.error(`File "${file.name}" is too large (max 10MB)`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type "${file.type}" not supported for "${file.name}"`);
        continue;
      }

      // Create preview for images
      let preview = '';
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      setAttachments(prev => [...prev, { file, preview }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);

    try {
      // Create the bug report
      const result = await bugReportsApi.create({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
      });

      const reportId = result.data.id;

      // Upload attachments
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          try {
            await bugReportsApi.uploadAttachment(reportId, attachment.file);
          } catch (err) {
            console.error('Failed to upload attachment:', err);
            toast.warning(`Failed to upload "${attachment.file.name}"`);
          }
        }
      }

      toast.success('Ticket submitted successfully!');
      navigate(`/app/tickets/${reportId}`);
    } catch (err: any) {
      console.error('Failed to submit ticket:', err);
      setError(err?.message || 'Failed to submit ticket');
      toast.error(err?.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Report Issue / Request Feature"
        subtitle="Help us improve by letting us know about bugs, feature requests, or general feedback"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Type of Report *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {typeOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value as BugReportType)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-colors text-left',
                  type === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Priority</label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value as BugReportPriority)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-opacity',
                  priority === option.value
                    ? option.color
                    : `${option.color} opacity-50 hover:opacity-75`,
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <Input
            placeholder="e.g., Cannot upload images larger than 5MB"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={300}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {title.length}/300
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <Textarea
            placeholder="Provide as much detail as possible:
- What did you try to do?
- What happened?
- What did you expect to happen?
- Steps to reproduce (if applicable)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={10000}
            rows={6}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {description.length}/10000
          </p>
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium mb-3">Attachments (Screenshots, Logs, etc.)</label>

          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              handleFileSelect(e.dataTransfer.files);
            }}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5',
              'border-border',
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium text-sm">Drop files here or click to select</p>
            <p className="text-xs text-muted-foreground mt-1">
              Max 10MB per file. Supported: Images, PDF, Word, Excel, Text
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={e => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={loading}
            />
          </div>

          {/* Attached files */}
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((attachment, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  {attachment.preview && (
                    <img
                      src={attachment.preview}
                      alt="attachment preview"
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-2 hover:bg-red-100 rounded transition-colors"
                    disabled={loading}
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !title.trim() || !description.trim()}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
}
