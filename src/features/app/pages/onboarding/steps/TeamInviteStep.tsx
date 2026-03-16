/**
 * @fileoverview Team Invite Step — Optional fifth step for onboarding.
 * 
 * Allows users to invite teammates by email during onboarding.
 * Invitations are sent immediately and teammates can join when launching events.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Plus, X, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  const { t } = useTranslation();
  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      teamInvites: [...data.teamInvites, { email }]
    });

    setEmailInput('');
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

      {/* Invited List */}
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
