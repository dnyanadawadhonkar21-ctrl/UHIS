import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toastMethods = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  const contextValue = {
    ...toastMethods,
    toast: toastMethods,
    toasts,
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="toast-container"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          return (
            <div
              key={t.id}
              role="alert"
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                background: isSuccess
                  ? 'var(--color-signal-normal-bg)'
                  : isError
                  ? 'var(--color-signal-critical-bg)'
                  : isWarning
                  ? 'var(--color-signal-warning-bg)'
                  : 'var(--color-signal-info-bg)',
                border: `1px solid ${
                  isSuccess
                    ? 'var(--color-signal-normal-border)'
                    : isError
                    ? 'var(--color-signal-critical-border)'
                    : isWarning
                    ? 'var(--color-signal-warning-border)'
                    : 'var(--color-signal-info-border)'
                }`,
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '1px' }}>
                {isSuccess && <CheckCircle2 size={16} color="var(--color-signal-normal)" />}
                {isError && <AlertCircle size={16} color="var(--color-signal-critical)" />}
                {isWarning && <AlertTriangle size={16} color="var(--color-signal-warning)" />}
                {!isSuccess && !isError && !isWarning && <Info size={16} color="var(--color-signal-info)" />}
              </div>
              <span
                style={{
                  flex: 1,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: 'var(--color-ink)',
                  lineHeight: 1.5,
                }}
              >
                {t.message}
              </span>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-ink-muted)',
                  padding: '1px',
                  flexShrink: 0,
                  display: 'flex',
                  borderRadius: '4px',
                }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
