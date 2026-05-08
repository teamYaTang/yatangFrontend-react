import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import "../styles/Toast.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [action, setAction] = useState(null); // { label: string, onClick: () => void } | null
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setVisible(false);
    setAction(null);
  }, []);

  /**
   * @param {string} msg
   * @param {number} durationMs
   * @param {{label: string, onClick: () => void}=} actionOpt
   */
  const toast = useCallback(
    (msg, durationMs = 1000, actionOpt) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      setAction(actionOpt && actionOpt.label && typeof actionOpt.onClick === "function" ? actionOpt : null);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        hide();
      }, durationMs);
    },
    [hide],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={`app-toast ${visible ? "app-toast--visible" : ""}`} role="status" aria-live="polite">
        <span className="app-toast__content">{message}</span>
        {action ? (
          <button
            type="button"
            className="app-toast__action"
            onClick={() => {
              try {
                action.onClick();
              } finally {
                hide();
              }
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx.toast;
}
