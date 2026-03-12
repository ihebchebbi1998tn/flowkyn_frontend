import React, { useState } from 'react';
import { FileUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { bugReportsApi } from '../../api/bugReports';

type ReportType = 'bug_report' | 'feature_request' | 'issue' | 'general_feedback';
type Priority = 'low' | 'medium' | 'high' | 'critical';

export const BugReportForm: React.FC = () => {
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
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Limit to 5 files, max 5MB each
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) {
      setError('Some files exceed 5MB limit');
    }
    setAttachments(valid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }

      // Create the report
      const report = await bugReportsApi.create(formData);

      // Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          
          const attached = await bugReportsApi.addAttachment(report.data.id, formDataFile);
          setUploadedAttachments(prev => [...prev, attached.data]);
        }
      }

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        type: 'bug_report',
        priority: 'medium',
      });
      setAttachments([]);

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-3xl font-bold mb-2">{t('bugReports.title')}</h1>
      <p className="text-gray-600 mb-6">
        {t('bugReports.subtitle')}
      </p>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">{t('bugReports.successMessage')}</h3>
            <p className="text-green-700 text-sm">
              {t('bugReports.successDescription')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">{t('bugReports.errorTitle')}</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t('bugReports.reportType')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'bug_report' as ReportType, label: t('bugReports.bugReport') },
              { value: 'feature_request' as ReportType, label: t('bugReports.featureRequest') },
              { value: 'issue' as ReportType, label: t('bugReports.issue') },
              { value: 'general_feedback' as ReportType, label: t('bugReports.generalFeedback') },
            ].map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  formData.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('bugReports.titleLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            maxLength={300}
            placeholder={t('bugReports.titlePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/300</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('bugReports.descriptionLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            maxLength={10000}
            placeholder={t('bugReports.descriptionPlaceholder')}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/10000</p>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('bugReports.priorityLabel')}
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          >
            <option value="low">{t('bugReports.priorityLow')}</option>
            <option value="medium">{t('bugReports.priorityMedium')}</option>
            <option value="high">{t('bugReports.priorityHigh')}</option>
            <option value="critical">{t('bugReports.priorityCritical')}</option>
          </select>
        </div>

        {/* Attachments */}
        <div>
          <label htmlFor="attachments" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('bugReports.attachmentsLabel')}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              id="attachments"
              multiple
              onChange={handleFileSelect}
              disabled={submitting}
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            />
            <label htmlFor="attachments" className="cursor-pointer">
              <span className="text-sm font-medium text-gray-700">
                {t('bugReports.attachmentsHint')}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {t('bugReports.attachmentsDesc')}
              </p>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-sm text-gray-700">
                    {file.name} ({(file.size / 1024).toFixed(1)}KB)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments(attachments.filter((_, i) => i !== idx))
                    }
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    {t('bugReports.removeAttachment')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !formData.title.trim() || !formData.description.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {t('bugReports.submitting')}
            </>
          ) : (
            t('bugReports.submitButton')
          )}
        </button>
      </form>
    </div>
  );
};

export default BugReportForm;
