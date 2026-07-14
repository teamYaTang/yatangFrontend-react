import React, { useEffect } from "react";
import Router from "./shared/Router";
import { ToastProvider } from "./context/ToastContext";
import { setupOAuthDeepLinkListener } from "./utils/oauthDeepLink";
import "./styles/App.css";

function App() {
  useEffect(() => setupOAuthDeepLinkListener(), []);

  return (
    <div className="app-container">
      <ToastProvider>
        <Router />
      </ToastProvider>
    </div>
  );
}

export default App;
