/**
 * API·OAuth 기준 URL
 * - 웹(Nginx): baseURL `/api` (상대 경로)
 * - 앱 번들(Capacitor): REACT_APP_API_BASE_URL (예: https://xxx.duckdns.org/api)
 */
export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_BASE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "/api";
}

/** OAuth2 시작 URL의 origin (백엔드와 같은 호스트) */
export function getAppOrigin() {
  const base = getApiBaseUrl();
  if (base.startsWith("http://") || base.startsWith("https://")) {
    try {
      const url = new URL(base);
      return url.origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
}
