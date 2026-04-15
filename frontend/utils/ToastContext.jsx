import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...styles[t.type] }} className="toast-anim">
            <div style={{...styles.hex, ...(t.type === 'error' ? styles.hexError : t.type === 'success' ? styles.hexSuccess : styles.hexInfo)}}>
              {t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'i'}
            </div>
            <div style={styles.msg}>{t.message}</div>
          </div>
        ))}
      </div>
      <style>{`
        .toast-anim {
          animation: slideUpToast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUpToast {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

const styles = {
  toastContainer: {
    position: 'fixed',
    bottom: 'clamp(20px, 4vw, 40px)',
    right: 'clamp(20px, 4vw, 40px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    background: 'rgba(12, 24, 18, 0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    minWidth: '280px',
    maxWidth: '420px',
    borderRadius: '4px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    pointerEvents: 'auto',
  },
  success: {
    borderLeft: '4px solid var(--g)',
  },
  error: {
    borderLeft: '4px solid var(--danger)',
  },
  info: {
    borderLeft: '4px solid var(--gold)',
  },
  hex: {
    width: '28px',
    height: '28px',
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    flexShrink: 0,
  },
  hexSuccess: {
    background: 'rgba(0, 255, 106, 0.1)',
    color: 'var(--g)',
    border: '1px solid var(--g)',
  },
  hexError: {
    background: 'rgba(255, 59, 59, 0.1)',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
  },
  hexInfo: {
    background: 'rgba(232, 184, 75, 0.1)',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
  },
  msg: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    color: 'var(--text)',
    letterSpacing: '0.5px',
    lineHeight: 1.5,
  }
};
