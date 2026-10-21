import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { initNativeApp } from "./utils/nativeApp";

initNativeApp();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

function hideBootSplash() {
  const splash = document.getElementById("boot-splash");
  if (!splash) return;
  splash.classList.add("is-hidden");
  window.setTimeout(() => splash.remove(), 400);
}

// 첫 페인트 직후 스플래시 제거 (원격 URL 로드 대기 UI)
if (document.readyState === "complete") {
  window.requestAnimationFrame(hideBootSplash);
} else {
  window.addEventListener("load", () => window.requestAnimationFrame(hideBootSplash));
}
// 네트워크가 느려도 최대 대기 후 제거
window.setTimeout(hideBootSplash, 4000);

reportWebVitals();
