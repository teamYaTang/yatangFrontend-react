import React from "react";
import "../styles/Loading.css";

/**
 * 인앱 로딩(냉장고 불러오기 등)용 화면
 * public/boot-logo.png 사용 — 번들 대용량 PNG는 WKWebView에서 안 뜨는 경우가 있음
 */
const Loading = ({ message = "집밥부자를 준비하는 중…" } = {}) => {
  return (
    <div className="loading-page" role="status" aria-live="polite">
      <img
        src={`${process.env.PUBLIC_URL || ""}/boot-logo.png`}
        className="loading-logo"
        alt=""
        width={148}
        height={148}
        decoding="async"
      />
      <div className="loading-brand">집밥부자</div>
      <div className="loading-title">{message}</div>
      <div className="loading-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

export default Loading;
