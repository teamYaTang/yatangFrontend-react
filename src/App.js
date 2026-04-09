import React from "react";
import Router from "./shared/Router";
import { ToastProvider } from "./context/ToastContext";
import "./styles/App.css";

function App() {
  return (
    <div className="app-container">
      <ToastProvider>
        <Router />
      </ToastProvider>
    </div>
  );
}

export default App;
