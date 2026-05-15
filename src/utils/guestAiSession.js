const LS_KEY = "yatang_guest_ai_session_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomUUIDv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** 비회원 AI 한도 집계용 기기(브라우저) 단위 ID — 서버 X-Guest-Session-Id 헤더로 전달 */
export function getOrCreateGuestAiSessionId() {
  if (typeof window === "undefined" || !window.localStorage) return "";
  let id = localStorage.getItem(LS_KEY);
  if (id && UUID_RE.test(id)) return id;
  const gen = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : randomUUIDv4();
  localStorage.setItem(LS_KEY, gen);
  return gen;
}

export function guestAiSuggestHeaders() {
  const id = getOrCreateGuestAiSessionId();
  return id ? { "X-Guest-Session-Id": id } : {};
}

/** AI 추천 일일 한도 집계용 — 브라우저/기기의 로컬 달력 날짜(YYYY-MM-DD) */
export function clientLocalDateHeader() {
  if (typeof window === "undefined") return {};
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { "X-Client-Local-Date": `${y}-${m}-${day}` };
}

export function aiSuggestRequestHeaders() {
  return { ...guestAiSuggestHeaders(), ...clientLocalDateHeader() };
}
