/**
 * 소비기한까지 남은 일수(오늘 기준). API의 daysUntilExpiration 우선.
 * @returns {number|null}
 */
export function getDaysUntilExpiration(item) {
  if (item == null) return null;
  if (item.daysUntilExpiration != null && item.daysUntilExpiration !== "") {
    const n = Number(item.daysUntilExpiration);
    return Number.isNaN(n) ? null : n;
  }
  const d = item.expirationDate;
  if (!d) return null;
  const exp = new Date(String(d).slice(0, 10));
  if (Number.isNaN(exp.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

/** D-5, D-0, D+3 형식 */
export function formatDdayLabel(days) {
  if (days == null) return null;
  if (days >= 0) return `D-${days}`;
  return `D+${-days}`;
}

/** D-1·D-0·소비기한 경과(D+) 빨간색 */
export function isDdayUrgent(days) {
  if (days == null) return false;
  return days <= 1;
}

/** 등록일시 표시 (ISO 또는 배열) */
export function formatRegisteredAt(isoOrArr) {
  if (isoOrArr == null) return "—";
  try {
    if (typeof isoOrArr === "string") {
      const d = new Date(isoOrArr);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("ko-KR");
    }
    if (Array.isArray(isoOrArr) && isoOrArr.length >= 3) {
      const d = new Date(isoOrArr[0], isoOrArr[1] - 1, isoOrArr[2] ?? 1);
      return d.toLocaleDateString("ko-KR");
    }
  } catch {
    /* ignore */
  }
  return "—";
}
