// JWT 토큰에서 userId 추출
export const getUserIdFromToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    // JWT는 base64로 인코딩된 3부분으로 구성: header.payload.signature
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    // subject에 userId가 저장되어 있음
    return decoded.sub ? parseInt(decoded.sub) : null;
  } catch (error) {
    console.error("JWT 디코딩 에러:", error);
    return null;
  }
};

