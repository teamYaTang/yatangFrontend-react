/** Spring Security 기본 OAuth2 시작 URL (프록시로 백엔드 전달) */
export function startOAuthLogin(provider) {
  const id = provider === "google" || provider === "kakao" ? provider : "";
  if (!id) return;
  window.location.href = `/oauth2/authorization/${id}`;
}
