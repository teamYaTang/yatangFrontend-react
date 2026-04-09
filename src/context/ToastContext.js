import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import "../styles/Toast.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const toast = useCallback((msg, durationMs = 1000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={`app-toast ${visible ? "app-toast--visible" : ""}`} role="status" aria-live="polite">
        {message}
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
