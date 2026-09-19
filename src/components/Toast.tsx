import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  /** Anzeigedauer in ms */
  duration?: number;
}

interface ToastApi {
  show: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

/** Kurze Meldung am unteren Rand, optional mit Aktion (z.B. „Rückgängig“). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((opts: ToastOptions) => {
    window.clearTimeout(timer.current);
    setToast(opts);
    timer.current = window.setTimeout(() => setToast(null), opts.duration ?? 5000);
  }, []);

  function act() {
    window.clearTimeout(timer.current);
    const t = toast;
    setToast(null);
    void t?.onAction?.();
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.actionLabel && (
            <button className="btn-link toast-action" onClick={act}>
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}
