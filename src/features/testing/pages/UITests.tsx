import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, CheckCircle, XCircle, Loader2, Clock,
  ChevronDown, ChevronRight, Shield, Database, Users,
  Calendar, Gamepad2, Bell, BarChart3, Mail,
  Server, AlertTriangle, Copy, Trash2, Eye, EyeOff,
  Wifi, Trophy, Upload, Download, FileJson, FileSpreadsheet,
  UserPlus, LogIn, SkipForward, Send, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/flowkyn-logo.png';

import type { TestCase, TestContext, TestState, TestStatus } from '@/features/testing/types';
import { API_BASE, API_ROOT, exportAsJSON, exportAsCSV, startRequestCollection, getCollectedRequests } from '@/features/testing/helpers';
import { buildAllTests } from '@/features/testing/suites';

const HEADING_FONT = "'Space Grotesk', 'Inter', system-ui, sans-serif";

/* ─── Category config ─── */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  System: <Server className="h-3.5 w-3.5" />,
  Auth: <Shield className="h-3.5 w-3.5" />,
  Users: <Users className="h-3.5 w-3.5" />,
  Organizations: <Database className="h-3.5 w-3.5" />,
  Events: <Calendar className="h-3.5 w-3.5" />,
  Games: <Gamepad2 className="h-3.5 w-3.5" />,
  Leaderboards: <Trophy className="h-3.5 w-3.5" />,
  Files: <Upload className="h-3.5 w-3.5" />,
  Notifications: <Bell className="h-3.5 w-3.5" />,
  Analytics: <BarChart3 className="h-3.5 w-3.5" />,
  Contact: <Mail className="h-3.5 w-3.5" />,
  Emails: <Mail className="h-3.5 w-3.5" />,
  WebSockets: <Wifi className="h-3.5 w-3.5" />,
  Admin: <Shield className="h-3.5 w-3.5" />,
  Cleanup: <Trash2 className="h-3.5 w-3.5" />,
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-success bg-success/10',
  POST: 'text-info bg-info/10',
  PATCH: 'text-warning bg-warning/10',
  PUT: 'text-warning bg-warning/10',
  DELETE: 'text-destructive bg-destructive/10',
  WS: 'text-primary bg-primary/10',
};

/* ─── SMTP Issue Detection ─── */
interface SmtpDiagnostic {
  hasIssue: boolean;
  errorType: string;
  details: string;
  troubleshooting: string[];
}

function detectSmtpIssues(states: Record<string, TestState>): SmtpDiagnostic | null {
  const emailStates = Object.entries(states).filter(([id]) => id.startsWith('Emails::'));
  if (emailStates.length === 0) return null;

  for (const [, state] of emailStates) {
    if (!state.result) continue;
    const resp = state.result.response as any;
    if (!resp) continue;

    const errorStr = JSON.stringify(resp).toLowerCase();

    if (resp._deliveryStatus === 'smtp_failure' || errorStr.includes('smtp')) {
      const troubleshooting: string[] = [];
      let errorType = 'SMTP Configuration Error';
      let details = resp.error || resp.errorMessage || 'SMTP connection failed';

      if (errorStr.includes('auth') || errorStr.includes('535')) {
        errorType = 'SMTP Authentication Failed (535)';
        details = 'The SMTP server rejected the credentials. Check SMTP_USER and SMTP_PASS in your .env file.';
        troubleshooting.push('Verify SMTP_PASS is correct for noreply@flowkyn.com');
        troubleshooting.push('Try logging into OVH webmail to confirm the password works');
        troubleshooting.push('Check if the account is locked or requires a password reset');
      } else if (errorStr.includes('getaddrinfo') || errorStr.includes('dns')) {
        errorType = 'DNS Resolution Failed';
        details = 'Cannot resolve SMTP hostname. Check SMTP_HOST value.';
        troubleshooting.push('Verify SMTP_HOST is set to ssl0.ovh.ca');
        troubleshooting.push('Check server DNS configuration');
      } else if (errorStr.includes('connection') && errorStr.includes('refused')) {
        errorType = 'Connection Refused';
        details = 'SMTP server rejected the connection.';
        troubleshooting.push('Check SMTP_HOST and SMTP_PORT values');
        troubleshooting.push('Ensure firewall allows outbound port 587');
      } else if (errorStr.includes('tls') || errorStr.includes('ssl') || errorStr.includes('certificate')) {
        errorType = 'TLS/SSL Error';
        details = 'SSL/TLS handshake failed with SMTP server.';
        troubleshooting.push('Try toggling SMTP_SECURE between true and false');
        troubleshooting.push('For port 587, SMTP_SECURE should be false (STARTTLS)');
        troubleshooting.push('For port 465, SMTP_SECURE should be true (SSL)');
      } else if (errorStr.includes('timeout')) {
        errorType = 'SMTP Timeout';
        details = 'Connection to SMTP server timed out.';
        troubleshooting.push('Check if SMTP server is reachable from your deployment');
        troubleshooting.push('Try increasing timeout values');
      } else {
        troubleshooting.push('Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
        troubleshooting.push('Verify the SMTP service is running and reachable');
      }

      return { hasIssue: true, errorType, details, troubleshooting };
    }

    // Check for 500 errors on email tests (likely SMTP related)
    if (state.result.statusCode === 500 && state.result.status === 'failed') {
      return {
        hasIssue: true,
        errorType: 'Email Delivery Error (500)',
        details: resp.error || 'Server returned 500 on email endpoint — likely SMTP misconfiguration',
        troubleshooting: [
          'Check server logs for detailed SMTP error',
          'Verify SMTP credentials in .env file',
          'Ensure SMTP_HOST is ssl0.ovh.ca for OVH Canada',
        ],
      };
    }
  }

  return null;
}

/* ─── Email Test Modal ─── */
const EMAIL_TEMPLATES = [
  { id: 'forgot_password' as const, label: 'Forgot Password', endpoint: '/auth/forgot-password', method: 'POST', requiresAuth: false },
  { id: 'event_invitation' as const, label: 'Event Invitation', endpoint: '/events/{eventId}/invitations', method: 'POST', requiresAuth: true },
  { id: 'org_invitation' as const, label: 'Organization Invitation', endpoint: '/organizations/{orgId}/invitations', method: 'POST', requiresAuth: true },
];

const SMTP_CONFIGS = [
  { host: 'ssl0.ovh.net', port: 587, secure: false, label: 'ssl0.ovh.net:587 (STARTTLS)', priority: 1 },
  { host: 'ssl0.ovh.net', port: 465, secure: true, label: 'ssl0.ovh.net:465 (SSL)', priority: 2 },
  { host: 'ssl0.ovh.ca', port: 587, secure: false, label: 'ssl0.ovh.ca:587 (STARTTLS)', priority: 3 },
  { host: 'ssl0.ovh.ca', port: 465, secure: true, label: 'ssl0.ovh.ca:465 (SSL)', priority: 4 },
  { host: 'smtp.mail.ovh.net', port: 587, secure: false, label: 'smtp.mail.ovh.net:587', priority: 5 },
  { host: 'mxplan1.mail.ovh.ca', port: 587, secure: false, label: 'mxplan1.mail.ovh.ca:587', priority: 6 },
  { host: 'mail.ovh.net', port: 587, secure: false, label: 'mail.ovh.net:587', priority: 7 },
  { host: 'smtp.ovh.net', port: 587, secure: false, label: 'smtp.ovh.net:587', priority: 8 },
  { host: 'smtp.mail.ovh.ca', port: 587, secure: false, label: 'smtp.mail.ovh.ca:587', priority: 9 },
  { host: 'smtp.mail.ovh.eu', port: 587, secure: false, label: 'smtp.mail.ovh.eu:587', priority: 10 },
];

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'de', label: '🇩🇪 DE' },
];

interface SmtpTestResult {
  host: string;
  port: number;
  secure: boolean;
  success: boolean;
  connectionOk?: boolean;
  step?: string;
  duration?: number;
  error?: string;
  diagnosis?: string;
  messageId?: string;
  response?: string;
}

type ModalTab = 'template' | 'smtp';

function EmailTestModal({ isOpen, onClose, token }: { isOpen: boolean; onClose: () => void; token: string | null }) {
  const [tab, setTab] = useState<ModalTab>('smtp');
  // Template tab
  const [selectedTemplate, setSelectedTemplate] = useState<string>(EMAIL_TEMPLATES[0].id);
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState('en');
  const [eventId, setEventId] = useState('');
  const [orgId, setOrgId] = useState('');
  const [templateResult, setTemplateResult] = useState<{ status: string; message?: string; statusCode?: number; duration?: number; response?: any }>({ status: 'idle' });

  // SMTP tab
  const [smtpEmail, setSmtpEmail] = useState('');
  const [isBulkTesting, setIsBulkTesting] = useState(false);
  const [smtpResults, setSmtpResults] = useState<SmtpTestResult[]>([]);
  const [smtpRecommendation, setSmtpRecommendation] = useState<string | null>(null);
  const [selectedSmtp, setSelectedSmtp] = useState<Set<number>>(new Set(SMTP_CONFIGS.map((_, i) => i)));

  const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)!;

  const sendTemplateEmail = async () => {
    setTemplateResult({ status: 'sending' });
    const start = performance.now();
    try {
      let url = `${API_BASE}${template.endpoint}`;
      if (template.id === 'event_invitation') url = url.replace('{eventId}', eventId);
      if (template.id === 'org_invitation') url = url.replace('{orgId}', orgId);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (template.requiresAuth && token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { method: template.method, headers, body: JSON.stringify({ email, lang }), mode: 'cors' });
      const duration = Math.round(performance.now() - start);
      const data = await res.json().catch(() => null);
      setTemplateResult({
        status: res.ok || res.status === 409 ? 'success' : 'error',
        statusCode: res.status,
        message: res.ok ? `✅ Email sent (${duration}ms)` : res.status === 409 ? '⚠️ Already invited' : `❌ Error ${res.status}: ${data?.error || 'Unknown'}`,
        response: data, duration,
      });
    } catch (err: any) {
      setTemplateResult({ status: 'error', message: `❌ Network: ${err.message}`, duration: Math.round(performance.now() - start) });
    }
  };

  const runBulkSmtpTest = async () => {
    if (!smtpEmail) return;
    setIsBulkTesting(true);
    setSmtpResults([]);
    setSmtpRecommendation(null);

    const selectedConfigs = SMTP_CONFIGS.filter((_, i) => selectedSmtp.has(i)).map(c => ({
      host: c.host, port: c.port, secure: c.secure,
    }));

    try {
      const res = await fetch(`${API_BASE}/smtp-test/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Test-Runner': 'true' },
        body: JSON.stringify({
          configs: selectedConfigs,
          to: smtpEmail,
          user: 'noreply@flowkyn.com',
          pass: 'Azerty123',
          lang,
        }),
        mode: 'cors',
      });
      const data = await res.json();
      if (!res.ok || !data.results) {
        const errMsg = data.error || `HTTP ${res.status} — ${res.statusText}`;
        setSmtpResults(selectedConfigs.map(c => ({ host: c.host, port: c.port, secure: c.secure, success: false, error: errMsg, diagnosis: res.status === 404 ? 'Backend not redeployed — run npm run deploy on the server first' : errMsg, duration: 0 })));
        setSmtpRecommendation(res.status === 404 ? '⚠️ Endpoint not found — you need to redeploy the backend (npm run deploy)' : `❌ ${errMsg}`);
      } else {
        setSmtpResults(data.results || []);
        setSmtpRecommendation(data.recommendation || null);
      }
    } catch (err: any) {
      setSmtpResults(selectedConfigs.map(c => ({ host: c.host, port: c.port, secure: c.secure, success: false, error: `Network error: ${err.message}`, diagnosis: 'Network error — check if backend is running', duration: 0 })));
      setSmtpRecommendation(`❌ Network error: ${err.message}`);
    }
    setIsBulkTesting(false);
  };

  const toggleSmtpConfig = (idx: number) => {
    setSelectedSmtp(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedSmtp(new Set(SMTP_CONFIGS.map((_, i) => i)));
  const selectNone = () => setSelectedSmtp(new Set());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl mx-4 rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-foreground" style={{ fontFamily: HEADING_FONT }}>Email & SMTP Tester</h2>
              <p className="text-[10px] text-muted-foreground">Test templates or find the right SMTP server</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-accent/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border/30 shrink-0">
          <button
            onClick={() => setTab('smtp')}
            className={cn(
              "flex-1 py-2.5 text-[12px] font-semibold transition-colors border-b-2",
              tab === 'smtp' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            <Server className="h-3.5 w-3.5 inline mr-1.5" />
            SMTP Server Test
          </button>
          <button
            onClick={() => setTab('template')}
            className={cn(
              "flex-1 py-2.5 text-[12px] font-semibold transition-colors border-b-2",
              tab === 'template' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            <Mail className="h-3.5 w-3.5 inline mr-1.5" />
            Template Email
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* ═══ SMTP TAB ═══ */}
          {tab === 'smtp' && (
            <>
              <div className="p-3 rounded-xl bg-info/8 border border-info/20">
                <p className="text-[11px] text-info font-medium">
                  🔍 Tests all OVH SMTP servers in sequence with <code className="bg-info/15 px-1 rounded">noreply@flowkyn.com</code> to find which one delivers emails successfully.
                </p>
              </div>

              {/* Recipient */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/70 mb-1.5 block">Send Test Email To</label>
                <Input value={smtpEmail} onChange={e => setSmtpEmail(e.target.value)} placeholder="your-email@gmail.com" className="h-10 text-[13px] rounded-xl" />
              </div>

              {/* Language */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/70 mb-1.5 block">Language</label>
                <div className="flex gap-1.5">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)} className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                      lang === l.code ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-accent/30'
                    )}>{l.label}</button>
                  ))}
                </div>
              </div>

              {/* SMTP Server Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-foreground/70">SMTP Servers to Test</label>
                  <div className="flex gap-1.5">
                    <button onClick={selectAll} className="text-[9px] text-primary hover:underline">Select All</button>
                    <span className="text-[9px] text-muted-foreground">·</span>
                    <button onClick={selectNone} className="text-[9px] text-muted-foreground hover:underline">None</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SMTP_CONFIGS.map((config, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleSmtpConfig(idx)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-left border transition-colors",
                        selectedSmtp.has(idx)
                          ? 'bg-primary/8 border-primary/30 text-foreground'
                          : 'bg-muted/20 border-border/20 text-muted-foreground'
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        selectedSmtp.has(idx) ? 'bg-primary border-primary' : 'border-border'
                      )}>
                        {selectedSmtp.has(idx) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono font-medium truncate">{config.host}:{config.port}</p>
                        <p className="text-[9px] text-muted-foreground">{config.secure ? 'SSL' : 'STARTTLS'} · Priority #{config.priority}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Run button */}
              <Button
                onClick={runBulkSmtpTest}
                disabled={!smtpEmail || selectedSmtp.size === 0 || isBulkTesting}
                className="w-full h-10 text-[13px] font-semibold rounded-xl gap-2"
              >
                {isBulkTesting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing {selectedSmtp.size} servers...</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Test {selectedSmtp.size} SMTP Servers</>
                )}
              </Button>

              {/* Recommendation */}
              {smtpRecommendation && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl border",
                    smtpResults.some(r => r.success) ? 'bg-success/8 border-success/20' : 'bg-destructive/8 border-destructive/20'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {smtpResults.some(r => r.success) ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    <p className={cn("text-[12px] font-semibold", smtpResults.some(r => r.success) ? 'text-success' : 'text-destructive')}>
                      {smtpRecommendation}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Results grid */}
              {smtpResults.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-foreground/60">Results ({smtpResults.filter(r => r.success).length}/{smtpResults.length} successful)</p>
                  {smtpResults.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg border",
                        r.success ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/15'
                      )}
                    >
                      {r.success ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono font-medium text-foreground">
                          {r.host}:{r.port}
                          <span className="text-muted-foreground ml-1.5">({r.secure ? 'SSL' : 'STARTTLS'})</span>
                        </p>
                        {r.success ? (
                          <p className="text-[10px] text-success">
                            ✅ {r.step === 'send' ? 'Email delivered' : 'Connection verified'}
                            {r.messageId && <span className="text-success/60 ml-1">· {r.messageId}</span>}
                          </p>
                        ) : (
                          <p className="text-[10px] text-destructive/80 truncate">
                            {r.diagnosis || r.error || 'Unknown error'}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{r.duration}ms</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ TEMPLATE TAB ═══ */}
          {tab === 'template' && (
            <>
              {/* Template selector */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/70 mb-1.5 block">Email Template</label>
                <div className="flex gap-1.5">
                  {EMAIL_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setTemplateResult({ status: 'idle' }); }}
                      className={cn("flex-1 px-3 py-2 rounded-lg text-[11px] font-medium border transition-colors",
                        selectedTemplate === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-accent/30'
                      )}>{t.label}</button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/70 mb-1.5 block">Recipient Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="test@example.com" className="h-10 text-[13px] rounded-xl" />
              </div>

              {template.id === 'event_invitation' && (
                <div>
                  <label className="text-[11px] font-semibold text-foreground/70 mb-1.5 block">Event ID</label>
                  <Input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="UUID" className="h-10 text-[13px] rounded-xl font-mono" />
                  {!token && <p className="text-[10px] text-warning mt-1">⚠️ Requires auth — run login test first</p>}
                </div>
              )}
              {template.id === 'org_invitation' && (
                <div>
                  <label className="text-[11px] font-semibold text-foreground/70 mb-1.5 block">Organization ID</label>
                  <Input value={orgId} onChange={e => setOrgId(e.target.value)} placeholder="UUID" className="h-10 text-[13px] rounded-xl font-mono" />
                  {!token && <p className="text-[10px] text-warning mt-1">⚠️ Requires auth — run login test first</p>}
                </div>
              )}

              {/* Language */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/70 mb-1.5 block">Language</label>
                <div className="flex gap-1.5">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)} className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-[11px] font-medium border transition-colors",
                      lang === l.code ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-accent/30'
                    )}>{l.label}</button>
                  ))}
                </div>
              </div>

              <Button onClick={sendTemplateEmail} disabled={!email || templateResult.status === 'sending' || (template.requiresAuth && !token)}
                className="w-full h-10 text-[13px] font-semibold rounded-xl gap-2"
              >
                {templateResult.status === 'sending' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : <><Send className="h-3.5 w-3.5" /> Send Test Email</>}
              </Button>

              {templateResult.status !== 'idle' && templateResult.status !== 'sending' && (
                <div className={cn("p-3 rounded-xl border", templateResult.status === 'success' ? 'bg-success/8 border-success/20' : 'bg-destructive/8 border-destructive/20')}>
                  <div className="flex items-start gap-2">
                    {templateResult.status === 'success' ? <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[12px] font-medium", templateResult.status === 'success' ? 'text-success' : 'text-destructive')}>{templateResult.message}</p>
                      {templateResult.statusCode && <p className="text-[10px] text-muted-foreground mt-0.5">HTTP {templateResult.statusCode} · {templateResult.duration}ms</p>}
                      {templateResult.response && (
                        <details className="mt-2">
                          <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Response</summary>
                          <pre className="mt-1 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-words max-h-[100px] overflow-auto">{JSON.stringify(templateResult.response, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Component ─── */
export default function UITests() {
  const [tests] = useState<TestCase[]>(buildAllTests);
  const [states, setStates] = useState<Record<string, TestState>>({});
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set<string>(buildAllTests().map(t => t.category))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const createdIdsRef = useRef<Record<string, string>>({});
  const abortRef = useRef(false);
  const [testMode, setTestMode] = useState<'login' | 'signup'>('login');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverInfo, setServerInfo] = useState<{ uptime?: number; db?: string; latency?: number } | null>(null);

  // Pre-flight health check
  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      setServerStatus('checking');
      const start = performance.now();
      try {
        const res = await fetch(`${API_ROOT}/health`, { signal: AbortSignal.timeout(8000) });
        if (cancelled) return;
        const latency = Math.round(performance.now() - start);
        if (res.ok) {
          const data = await res.json();
          setServerStatus('online');
          setServerInfo({ uptime: Math.round(data.uptime || 0), db: data.database, latency });
        } else {
          setServerStatus('offline');
          setServerInfo(null);
        }
      } catch {
        if (!cancelled) { setServerStatus('offline'); setServerInfo(null); }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const categories = [...new Set(tests.map(t => t.category))];

  const summary = {
    total: tests.length,
    passed: Object.values(states).filter(s => s.status === 'passed').length,
    failed: Object.values(states).filter(s => s.status === 'failed').length,
    skipped: Object.values(states).filter(s => s.status === 'skipped').length,
    running: Object.values(states).filter(s => s.status === 'running').length,
  };

  const hasResults = summary.passed + summary.failed > 0;

  // Detect SMTP issues from test results
  const smtpDiagnostic = detectSmtpIssues(states);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleTest = (id: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runSingleTest = useCallback(async (test: TestCase) => {
    setStates(prev => ({ ...prev, [test.id]: { status: 'running' } }));
    const ctx: TestContext = {
      baseUrl: API_BASE,
      token: tokenRef.current,
      refreshToken: refreshTokenRef.current,
      setToken: (t) => { tokenRef.current = t; },
      setRefreshToken: (t) => { refreshTokenRef.current = t; },
      createdIds: createdIdsRef.current,
    };
    try {
      startRequestCollection();
      const result = await test.run(ctx);
      result.requests = getCollectedRequests();
      const finalStatus = result.status === 'skipped' ? 'skipped' : (result.status === 'passed' ? 'passed' : 'failed');
      setStates(prev => ({ ...prev, [test.id]: { status: finalStatus, result } }));
      if (result.status === 'failed') {
        setExpandedTests(prev => new Set([...prev, test.id]));
      }
    } catch (err: any) {
      const requests = getCollectedRequests();
      setStates(prev => ({
        ...prev,
        [test.id]: {
          status: 'failed',
          result: {
            status: 'failed',
            duration: 0,
            error: `Unhandled exception: ${err.message}`,
            response: {
              _exception: err.name || 'Error',
              _message: err.message,
              _stack: err.stack?.split('\n').slice(0, 5),
              _hint: 'This is an unhandled error in the test code itself, not an API error',
            },
            requests,
            diagnostics: {
              _test: test.id,
              _timestamp: new Date().toISOString(),
              _errorType: err.name,
              _errorMessage: err.message,
            },
          },
        },
      }));
      setExpandedTests(prev => new Set([...prev, test.id]));
    }
  }, []);

  const runAllTests = useCallback(async () => {
    abortRef.current = false;
    setIsRunning(true);
    setStates({});
    tokenRef.current = null;
    refreshTokenRef.current = null;
    createdIdsRef.current = {};

    for (const test of tests) {
      if (abortRef.current) break;
      await runSingleTest(test);
      await new Promise(r => setTimeout(r, 100));
    }
    setIsRunning(false);
  }, [tests, runSingleTest]);

  const stopTests = () => { abortRef.current = true; };

  const resetAll = () => {
    setStates({});
    tokenRef.current = null;
    refreshTokenRef.current = null;
    createdIdsRef.current = {};
  };

  const scrollToStatus = (status: TestStatus) => {
    const firstMatch = tests.find(t => states[t.id]?.status === status);
    if (!firstMatch) return;
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.add(firstMatch.category);
      return next;
    });
    setExpandedTests(prev => new Set([...prev, firstMatch.id]));
    requestAnimationFrame(() => {
      const el = document.getElementById(`test-${firstMatch.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', status === 'failed' ? 'ring-destructive/50' : 'ring-warning/50');
        setTimeout(() => el.classList.remove('ring-2', 'ring-destructive/50', 'ring-warning/50'), 2000);
      }
    });
  };

  const statusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-warning" />;
      case 'running': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground/30" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Flowkyn" className="h-8 w-8 object-contain" />
            <div>
              <h1 className="text-[14px] font-bold text-foreground" style={{ fontFamily: HEADING_FONT }}>
                API Test Runner
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                {API_BASE}
                <span className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold",
                  serverStatus === 'online' && 'bg-success/15 text-success',
                  serverStatus === 'offline' && 'bg-destructive/15 text-destructive',
                  serverStatus === 'checking' && 'bg-warning/15 text-warning',
                )}>
                  {serverStatus === 'checking' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                  {serverStatus === 'online' && <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />}
                  {serverStatus === 'offline' && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                  {serverStatus === 'checking' ? 'Checking...' : serverStatus === 'online' ? `Online${serverInfo?.latency ? ` · ${serverInfo.latency}ms` : ''}` : 'Unreachable'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {summary.passed > 0 && (
              <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                <CheckCircle className="h-3 w-3" /> {summary.passed}
              </Badge>
            )}
            {summary.skipped > 0 && (
              <Badge
                className="bg-warning/10 text-warning border-warning/20 text-[10px] gap-1 cursor-pointer hover:bg-warning/20 transition-colors"
                onClick={() => scrollToStatus('skipped')}
              >
                <SkipForward className="h-3 w-3" /> {summary.skipped}
              </Badge>
            )}
            {summary.failed > 0 && (
              <Badge
                className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1 cursor-pointer hover:bg-destructive/20 transition-colors"
                onClick={() => scrollToStatus('failed')}
              >
                <XCircle className="h-3 w-3" /> {summary.failed}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{summary.total} tests</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ═══ SMTP Error Banner ═══ */}
        <AnimatePresence>
          {smtpDiagnostic && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-xl border-2 border-warning/40 bg-warning/5 overflow-hidden"
            >
              <div className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[13px] font-bold text-warning" style={{ fontFamily: HEADING_FONT }}>
                        {smtpDiagnostic.errorType}
                      </h3>
                      <Badge className="bg-warning/15 text-warning border-warning/30 text-[9px]">SMTP</Badge>
                    </div>
                    <p className="text-[12px] text-foreground/80 mb-3">{smtpDiagnostic.details}</p>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-foreground/60">Troubleshooting:</p>
                      {smtpDiagnostic.troubleshooting.map((tip, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <span className="text-warning mt-0.5">→</span> {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-8 text-[11px] rounded-lg gap-1.5 border-warning/30 text-warning hover:bg-warning/10"
                    onClick={() => setShowEmailModal(true)}
                  >
                    <Send className="h-3 w-3" /> Test Email
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-[13px] font-bold text-foreground">Test Credentials</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Email Test button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] rounded-lg gap-1.5"
                onClick={() => setShowEmailModal(true)}
              >
                <Mail className="h-3 w-3" /> Email Tester
              </Button>
              {/* Mode toggle */}
              <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
                <button
                  onClick={() => setTestMode('login')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors",
                    testMode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <LogIn className="h-3 w-3" /> Existing Account
                </button>
                <button
                  onClick={() => setTestMode('signup')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors",
                    testMode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <UserPlus className="h-3 w-3" /> New Account
                </button>
              </div>
            </div>
          </div>

          {/* Hidden select to pass mode to tests */}
          <select id="test-mode" value={testMode} onChange={() => {}} className="hidden">
            <option value="login">login</option>
            <option value="signup">signup</option>
          </select>

          <div className={cn("grid gap-3", testMode === 'signup' ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
            {testMode === 'signup' && (
              <Input id="test-name" placeholder="Display Name" type="text" className="h-10 text-[13px] rounded-xl" defaultValue="Test User" />
            )}
            <Input id="test-email" placeholder="Email" type="email" className="h-10 text-[13px] rounded-xl" defaultValue={testMode === 'signup' ? `test-${Date.now()}@flowkyn.com` : 'support@flowkyn.com'} key={`email-${testMode}`} />
            <div className="relative">
              <Input id="test-password" placeholder="Password" type={showPassword ? 'text' : 'password'} className="h-10 text-[13px] rounded-xl pr-10" defaultValue={testMode === 'signup' ? 'TestPass1' : 'Flowkyn2026'} key={`pwd-${testMode}`} />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {testMode === 'signup' && (
            <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-warning" />
              Will register a new account, then auto-login to run all authenticated tests. Password must have 8+ chars, uppercase, lowercase, and a number.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isRunning ? (
            <Button onClick={runAllTests} className="h-10 px-5 text-[13px] font-semibold rounded-xl gap-2 bg-primary text-primary-foreground">
              <Play className="h-3.5 w-3.5" /> Run All Tests
            </Button>
          ) : (
            <Button onClick={stopTests} variant="destructive" className="h-10 px-5 text-[13px] font-semibold rounded-xl gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Stop
            </Button>
          )}
          <Button onClick={resetAll} variant="outline" size="sm" className="h-10 text-[12px] rounded-xl gap-1.5" disabled={isRunning}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>

          {/* Export buttons */}
          {hasResults && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-muted-foreground mr-1">
                <Download className="h-3 w-3 inline mr-1" />Export
              </span>
              <Button
                onClick={() => exportAsJSON(tests, states)}
                variant="outline"
                size="sm"
                className="h-8 text-[11px] rounded-lg gap-1.5 px-3"
              >
                <FileJson className="h-3.5 w-3.5" /> JSON
              </Button>
              <Button
                onClick={() => exportAsCSV(tests, states)}
                variant="outline"
                size="sm"
                className="h-8 text-[11px] rounded-lg gap-1.5 px-3"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          )}
        </div>

        {/* Progress */}
        {hasResults && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full flex">
                <div className="bg-success transition-all duration-300" style={{ width: `${(summary.passed / summary.total) * 100}%` }} />
                <div className="bg-warning transition-all duration-300" style={{ width: `${(summary.skipped / summary.total) * 100}%` }} />
                <div className="bg-destructive transition-all duration-300" style={{ width: `${(summary.failed / summary.total) * 100}%` }} />
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium tabular-nums shrink-0">
              {summary.passed + summary.failed + summary.skipped}/{summary.total}
            </span>
          </div>
        )}

        {/* Test categories */}
        <div className="space-y-2">
          {categories.map((category) => {
            const catTests = tests.filter(t => t.category === category);
            const catPassed = catTests.filter(t => states[t.id]?.status === 'passed').length;
            const catFailed = catTests.filter(t => states[t.id]?.status === 'failed').length;
            const catSkipped = catTests.filter(t => states[t.id]?.status === 'skipped').length;
            const isOpen = expandedCategories.has(category);

            return (
              <div key={category} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {CATEGORY_ICONS[category]}
                  </div>
                  <span className="text-[13px] font-semibold text-foreground">{category}</span>
                  <span className="text-[11px] text-muted-foreground">{catTests.length} tests</span>
                  <div className="flex-1" />
                  {catPassed > 0 && <Badge className="bg-success/10 text-success border-0 text-[9px] h-5">{catPassed} ✓</Badge>}
                  {catSkipped > 0 && <Badge className="bg-warning/10 text-warning border-0 text-[9px] h-5">{catSkipped} ⏭</Badge>}
                  {catFailed > 0 && <Badge className="bg-destructive/10 text-destructive border-0 text-[9px] h-5">{catFailed} ✗</Badge>}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/30">
                        {catTests.map((test) => {
                          const state = states[test.id] || { status: 'idle' as TestStatus };
                          const isExpanded = expandedTests.has(test.id);

                          return (
                            <div key={test.id} id={`test-${test.id}`} className="border-b border-border/20 last:border-0 transition-all duration-300">
                              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors">
                                {statusIcon(state.status)}
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide", METHOD_COLORS[test.method] || 'text-muted-foreground bg-muted')}>
                                  {test.method}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-medium text-foreground truncate">{test.name}</p>
                                  <p className="text-[10px] text-muted-foreground/60 font-mono truncate">{test.endpoint}</p>
                                </div>
                                {test.requiresAuth && (
                                  <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary/60">AUTH</Badge>
                                )}
                                {state.result?.duration != null && (
                                  <span className="text-[10px] text-muted-foreground tabular-nums">{state.result.duration}ms</span>
                                )}
                                {state.result?.statusCode != null && (
                                  <Badge className={cn("text-[9px] h-5 border-0", state.result.statusCode < 400 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                                    {state.result.statusCode}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg"
                                    onClick={(e) => { e.stopPropagation(); runSingleTest(test); }}
                                    disabled={isRunning}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                  {state.result && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-lg"
                                      onClick={() => toggleTest(test.id)}
                                    >
                                      <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <AnimatePresence>
                                {isExpanded && state.result && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-3 pt-1 space-y-2">
                                      {/* Error banner */}
                                      {state.result.error && (
                                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/8 border border-destructive/20">
                                          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                                          <div className="min-w-0">
                                            <p className="text-[11px] text-destructive font-semibold">Error</p>
                                            <p className="text-[11px] text-destructive/80 break-words">{state.result.error}</p>
                                            {(state.result.response as any)?.requestId && (
                                              <p className="text-[10px] text-destructive/60 mt-1 font-mono">
                                                RequestID: {(state.result.response as any).requestId} — check server logs
                                              </p>
                                            )}
                                            {(state.result.response as any)?._serverHint && (
                                              <p className="text-[10px] text-warning mt-1">💡 {(state.result.response as any)._serverHint}</p>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Success note banner */}
                                      {!state.result.error && (state.result.response as any)?._note && (
                                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-success/8 border border-success/20">
                                          <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                                          <p className="text-[11px] text-success/80">{(state.result.response as any)._note}</p>
                                        </div>
                                      )}

                                      {/* Assertions checklist */}
                                      {state.result.assertions && state.result.assertions.length > 0 && (
                                        <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
                                          <p className="text-[10px] font-semibold text-foreground/70 mb-1.5">Assertions</p>
                                          <div className="space-y-0.5">
                                            {state.result.assertions.map((assertion, i) => (
                                              <p key={i} className={cn(
                                                "text-[10px] font-mono",
                                                assertion.startsWith('✓') ? 'text-success' :
                                                assertion.startsWith('✗') ? 'text-destructive' :
                                                assertion.startsWith('⚠') ? 'text-warning' :
                                                assertion.startsWith('ℹ') ? 'text-info' :
                                                'text-muted-foreground'
                                              )}>
                                                {assertion}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Request info summary */}
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                                        <span><span className="font-semibold text-foreground/60">Status:</span> {state.result.statusCode ?? 'N/A'}</span>
                                        <span><span className="font-semibold text-foreground/60">Duration:</span> {state.result.duration}ms</span>
                                        <span><span className="font-semibold text-foreground/60">Endpoint:</span> <code className="font-mono">{test.method} {test.endpoint}</code></span>
                                        {(state.result.response as any)?.requestId && (
                                          <span><span className="font-semibold text-foreground/60">RequestID:</span> <code className="font-mono">{(state.result.response as any).requestId}</code></span>
                                        )}
                                        {state.result.statusCode === 0 && <span className="text-destructive font-medium">⚠ Network error — server unreachable or CORS blocked</span>}
                                        {state.result.statusCode && state.result.statusCode >= 500 && (
                                          <span className="text-warning font-medium">⚠ Server error — check backend logs</span>
                                        )}
                                      </div>

                                      {/* Response Headers */}
                                      {state.result.responseHeaders && Object.keys(state.result.responseHeaders).length > 0 && (
                                        <details className="rounded-lg border border-border/30 bg-muted/20 overflow-hidden">
                                          <summary className="px-2.5 py-1.5 text-[10px] font-semibold text-foreground/60 cursor-pointer hover:bg-accent/20">
                                            Response Headers ({Object.keys(state.result.responseHeaders).length})
                                          </summary>
                                          <div className="px-2.5 py-1.5 border-t border-border/20 space-y-0.5">
                                            {Object.entries(state.result.responseHeaders).map(([k, v]) => (
                                              <p key={k} className="text-[10px] font-mono text-muted-foreground">
                                                <span className="text-foreground/60">{k}:</span> {String(v)}
                                              </p>
                                            ))}
                                          </div>
                                        </details>
                                      )}

                                      {/* cURL commands */}
                                      {state.result.requests && state.result.requests.length > 0 && (
                                        <div className="space-y-2">
                                          {state.result.requests.map((req, i) => (
                                            <details key={i} className="rounded-lg border border-border/30 bg-muted/20 overflow-hidden" open={state.status === 'failed'}>
                                              <summary className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-accent/20">
                                                <div className="flex items-center gap-2">
                                                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide", METHOD_COLORS[req.method] || 'text-muted-foreground bg-muted')}>
                                                    {req.method}
                                                  </span>
                                                  <code className="text-[10px] font-mono text-muted-foreground truncate max-w-[400px]">{req.url}</code>
                                                </div>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(req.curl); }}
                                                  className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent/40 transition-colors"
                                                  title="Copy cURL"
                                                >
                                                  <Copy className="h-3 w-3" /> cURL
                                                </button>
                                              </summary>

                                              <div className="px-2.5 py-1.5 border-t border-border/10">
                                                <p className="text-[9px] font-semibold text-foreground/50 mb-1">Request Headers</p>
                                                <div className="space-y-0.5">
                                                  {Object.entries(req.headers).map(([k, v]) => (
                                                    <p key={k} className="text-[10px] font-mono text-muted-foreground">
                                                      <span className="text-foreground/60">{k}:</span>{' '}
                                                      {k === 'Authorization' ? 'Bearer ••••••' : String(v)}
                                                    </p>
                                                  ))}
                                                </div>
                                              </div>

                                              {req.body !== undefined && (
                                                <div className="px-2.5 py-1.5 border-b border-border/10">
                                                  <p className="text-[9px] font-semibold text-foreground/50 mb-1">Request Body</p>
                                                  <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-words">
                                                    {JSON.stringify(req.body, null, 2)}
                                                  </pre>
                                                </div>
                                              )}

                                              <div className="px-2.5 py-1.5">
                                                <p className="text-[9px] font-semibold text-foreground/50 mb-1">cURL Command</p>
                                                <pre className="text-[10px] font-mono text-primary/70 whitespace-pre-wrap break-all">
                                                  {req.curl}
                                                </pre>
                                              </div>
                                            </details>
                                          ))}
                                        </div>
                                      )}

                                      {/* Diagnostics */}
                                      {state.result.diagnostics && Object.keys(state.result.diagnostics).length > 0 && (
                                        <details className="rounded-lg border border-border/30 bg-muted/20 overflow-hidden">
                                          <summary className="px-2.5 py-1.5 text-[10px] font-semibold text-foreground/60 cursor-pointer hover:bg-accent/20">
                                            🔍 Diagnostics
                                          </summary>
                                          <pre className="px-2.5 py-1.5 border-t border-border/20 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-words">
                                            {JSON.stringify(state.result.diagnostics, null, 2)}
                                          </pre>
                                        </details>
                                      )}

                                      {/* Response body */}
                                      <div className="relative">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="text-[9px] font-semibold text-foreground/50">Response Body</p>
                                        </div>
                                        <pre className={cn(
                                          "text-[10px] rounded-lg p-3 overflow-auto max-h-[250px] font-mono leading-relaxed border",
                                          state.status === 'failed'
                                            ? 'text-destructive/80 bg-destructive/5 border-destructive/15'
                                            : 'text-muted-foreground bg-muted/40 border-border/30'
                                        )}>
                                          {JSON.stringify(state.result.response, null, 2) || 'No response body'}
                                        </pre>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(JSON.stringify(state.result?.response, null, 2) || '')}
                                          className="absolute top-6 right-2 h-6 w-6 rounded-md bg-background/80 flex items-center justify-center hover:bg-background text-muted-foreground"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email Test Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <EmailTestModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            token={tokenRef.current}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
