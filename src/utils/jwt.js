/** JWT payload(base64url)를 JSON 객체로 디코딩 */
const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch (error) {
    console.error("JWT 디코딩 에러:", error);
    return null;
  }
};

/** access JWT의 exp 기준: 없음·파싱 실패·만료·곧 만료(leeway 이내)이면 true → 리프레시 시도 권장 */
export const shouldRefreshAccessToken = (leewaySeconds = 90) => {
  const token = localStorage.getItem("accessToken");
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec + leewaySeconds;
};

// JWT 토큰에서 userId 추출
export const getUserIdFromToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  const decoded = decodeJwtPayload(token);
  if (!decoded || decoded.sub == null || decoded.sub === "") return null;
  const n = parseInt(String(decoded.sub), 10);
  return Number.isFinite(n) ? n : null;
};

// 로그인 여부 확인
export const isLoggedIn = () =>
  !!localStorage.getItem("accessToken") || !!localStorage.getItem("refreshToken");