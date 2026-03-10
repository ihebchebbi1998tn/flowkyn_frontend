import { useState, useEffect, useCallback, useRef } from 'react';

const IDLE_TIMEOUT = 60_000;     // 60s before considered idle
const EDITING_TIMEOUT = 5_000;   // 5s after last form keystroke

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

export function useIdleDetection() {
  const [isIdle, setIsIdle] = useState(false);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const editTimer = useRef<ReturnType<typeof setTimeout>>();

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    // Start idle timer
    idleTimer.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);

    // Activity listeners
    ACTIVITY_EVENTS.forEach((evt) => document.addEventListener(evt, resetIdle, { passive: true }));

    // Form input listener — detect active editing
    const onInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        setIsEditingForm(true);
        clearTimeout(editTimer.current);
        editTimer.current = setTimeout(() => setIsEditingForm(false), EDITING_TIMEOUT);
      }
    };
    document.addEventListener('input', onInput, { passive: true });

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => document.removeEventListener(evt, resetIdle));
      document.removeEventListener('input', onInput);
      clearTimeout(idleTimer.current);
      clearTimeout(editTimer.current);
    };
  }, [resetIdle]);

  return {
    isIdle,
    isEditingForm,
    canSafelyReload: isIdle && !isEditingForm,
  };
}
