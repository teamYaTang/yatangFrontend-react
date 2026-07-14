/**
 * OAuth 딥링크 유틸 (네이티브 플러그인 없이 동작).
 * 주 경로: allowNavigation으로 WebView 안에서 OAuth 완료 → 앱 localStorage에 토큰 저장.
 * 보조: 외부 브라우저로 새어 나간 경우 커스텀 스킴으로 앱 복귀 시도.
 */

export const APP_OAUTH_DEEP_LINK_BASE = "com.kaya.yatang://oauth/callback";

export function isNativeApp() {
  try {
    // Capacitor 전역은 런타임에 bridge가 주입함
    const Cap = window.Capacitor;
    return !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  } catch {
    return false;
  }
}

/**
 * 외부 브라우저에서 OAuth가 끝났을 때만 앱으로 토큰을 넘깁니다.
 * 앱 WebView 안이면 false → 그 자리에서 로그인 처리.
 */
export function tryHandOffOAuthToApp(searchParams) {
  if (isNativeApp()) return false;

  const accessToken = searchParams.get("accessToken") || searchParams.get("token");
  const err = searchParams.get("error");
  if (!accessToken && !err) return false;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (!/Android|iPhone|iPad|iPod/i.test(ua)) return false;

  const q = new URLSearchParams();
  if (accessToken) q.set("accessToken", accessToken);
  const refresh = searchParams.get("refreshToken");
  if (refresh) q.set("refreshToken", refresh);
  if (err) q.set("error", err);

  window.location.href = `${APP_OAUTH_DEEP_LINK_BASE}?${q.toString()}`;
  return true;
}

/**
 * @capacitor/app 없이 동작 — URL 스킴으로 앱이 열리면 OS가 앱을 띄우고
 * remote WebView가 서버를 로드합니다. 콜백 쿼리는 보통 launch URL로 오지 않을 수 있어
 * 주 경로는 WebView 내 OAuth(allowNavigation)입니다.
 */
export function setupOAuthDeepLinkListener() {
  return () => {};
}
