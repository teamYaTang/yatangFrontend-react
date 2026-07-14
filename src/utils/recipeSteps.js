/**
 * AI/저장 레시피 단계 텍스트 앞의 "1.", "1)", "1단계" 등 번호를 제거합니다.
 * UI의 <ol>이 이미 번호를 붙이므로 중복(1. 1. ...)을 막습니다.
 */
export function stripLeadingStepNumber(step) {
  const raw = String(step ?? "").trim();
  if (!raw) return "";
  return raw
    .replace(/^\s*(?:\d+\s*[.)、．]|\d+\s*단계[:：.]?|Step\s*\d+[:：.]?)\s*/i, "")
    .trim() || raw;
}
