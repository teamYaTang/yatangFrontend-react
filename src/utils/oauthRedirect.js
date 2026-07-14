import { getAppOrigin } from "../config/appApi";

/**
 * Spring Security OAuth2 로그인/가입 시작.
 * 앱(Capacitor)에서는 반드시 같은 WebView 안에서 이동해야 합니다.
 * (외부 Chrome으로 열리면 토큰이 브라우저에만 저장되고 앱은 로그인 안 됨)
 */
export function startOAuthLogin(provider) {
  const id = provider === "google" || provider === "kakao" ? provider : "";
  if (!id) return;
  window.location.href = `${getAppOrigin()}/oauth2/authorization/${id}`;
}
