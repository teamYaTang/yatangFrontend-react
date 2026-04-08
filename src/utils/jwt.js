// JWT 토큰에서 userId 추출
export const getUserIdFromToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ? parseInt(decoded.sub) : null;
  } catch (error) {
    console.error("JWT 디코딩 에러:", error);
    return null;
  }
};

// 로그인 여부 확인
export const isLoggedIn = () => !!localStorage.getItem("accessToken");