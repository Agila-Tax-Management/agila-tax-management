// src/context/ToastContext.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ── Types ────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error';

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  /** internal – marks toast as exiting so the slide-out animation plays */
  exiting?: boolean;
}

interface ToastContextValue {
  /** Show a toast notification */
  toast: (opts: Omit<Toast, 'id' | 'exiting'>) => void;
  /** Shorthand: success toast */
  success: (title: string, message?: string) => void;
  /** Shorthand: error toast */
  error: (title: string, message?: string) => void;
  /** Dismiss a specific toast by id */
  dismiss: (id: string) => void;
}

// ── Context ──────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ── Icons (inline SVGs – no external dependency) ─────────────────────
function CheckCircleIcon(): React.ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XCircleIcon(): React.ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XMarkIcon(): React.ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

// ── Variant config ───────────────────────────────────────────────────
const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: () => React.ReactNode; progressBar: string }
> = {
  success: {
    container:
      'border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-400/30',
    icon: CheckCircleIcon,
    progressBar: 'bg-emerald-500 dark:bg-emerald-400',
  },
  error: {
    container:
      'border-red-500/30 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-100 dark:border-red-400/30',
    icon: XCircleIcon,
    progressBar: 'bg-red-500 dark:bg-red-400',
  },
};

const DEFAULT_DURATION = 5000; // ms

// ── Single toast item ────────────────────────────────────────────────
function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}): React.ReactNode {
  const style = VARIANT_STYLES[t.variant];
  const Icon = style.icon;
  const duration = t.duration ?? DEFAULT_DURATION;

  return (
    <div
      className={`pointer-events-auto relative flex w-80 max-w-sm items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 ${
        t.exiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100 animate-[slideIn_0.3s_ease-out]'
      } ${style.container}`}
      role="alert"
    >
      {/* Icon */}
      <div className="mt-0.5">
        <Icon />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{t.title}</p>
        {t.message && (
          <p className="mt-0.5 text-xs opacity-80 leading-relaxed">
            {t.message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        className="mt-0.5 shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-1"
        aria-label="Dismiss notification"
      >
        <XMarkIcon />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/10">
        <div
          className={`h-full ${style.progressBar} animate-[shrink_linear_forwards]`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────────────────
export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);

    // Clear the auto-dismiss timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (opts: Omit<Toast, 'id' | 'exiting'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = opts.duration ?? DEFAULT_DURATION;

      setToasts((prev) => [...prev, { ...opts, id }]);

      // Auto-dismiss
      const timer = setTimeout(() => {
        dismiss(id);
        timersRef.current.delete(id);
      }, duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ variant: 'success', title, message });
    },
    [addToast],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ variant: 'error', title, message });
    },
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, dismiss }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-4 right-4 z-9999 flex flex-col-reverse items-end gap-3"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
