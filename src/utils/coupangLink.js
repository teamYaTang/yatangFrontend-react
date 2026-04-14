/**
 * 쿠팡 파트너스 구매(검색) 링크.
 * 파트너스에서 발급한 URL 템플릿을 .env에 설정하세요.
 *
 * REACT_APP_COUPANG_PARTNER_URL_TEMPLATE — {keyword} 또는 {q} 자리에 URL 인코딩된 검색어가 들어갑니다.
 * 미설정 시 일반 쿠팡 검색 페이지로 연결됩니다(제휴 미적용).
 */
export function coupangPurchaseUrl(ingredientName) {
  const raw = ingredientName?.trim() || "";
  if (!raw) return "https://www.coupang.com";
  const encoded = encodeURIComponent(raw);
  const template =
    process.env.REACT_APP_COUPANG_PARTNER_URL_TEMPLATE ||
    process.env.REACT_APP_COUPANG_PARTNER_SEARCH_TEMPLATE;
  if (template && (template.includes("{keyword}") || template.includes("{q}"))) {
    return template.replace(/\{keyword\}/g, encoded).replace(/\{q\}/g, encoded);
  }
  return `https://www.coupang.com/np/search?q=${encoded}`;
}
