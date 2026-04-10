/** @typedef {'name_asc'|'created_asc'|'created_desc'|'exp_asc'} ItemSortKey */

export const ITEM_SORT_OPTIONS = [
  { value: "created_desc", label: "최근등록순" },
  { value: "exp_asc", label: "소비기한순" },
  { value: "name_asc", label: "이름순" },
  { value: "created_asc", label: "오래된순" },
];

const VALID_SORT_KEYS = new Set(["name_asc", "exp_asc", "created_asc", "created_desc"]);

/** 예전 키(name_desc 등)를 새 옵션으로 맞춥니다. */
export function normalizeSortKey(key) {
  if (key != null && VALID_SORT_KEYS.has(key)) return key;
  if (key === "name_desc") return "name_asc";
  if (key === "exp_desc") return "exp_asc";
  return "name_asc";
}

function parseCreatedMs(item) {
  if (!item?.createdAt) return 0;
  const t = item.createdAt;
  if (typeof t === "string") return Date.parse(t) || 0;
  if (typeof t === "number") return t;
  if (Array.isArray(t) && t.length >= 3) {
    return new Date(t[0], t[1] - 1, t[2] ?? 1, t[3] ?? 0, t[4] ?? 0).getTime();
  }
  return 0;
}

function expSortValue(item) {
  const d = item?.expirationDate;
  if (!d) return null;
  const ms = Date.parse(String(d).slice(0, 10));
  return Number.isNaN(ms) ? null : ms;
}

/**
 * @param {Array} items
 * @param {ItemSortKey} sortKey
 */
export function sortItems(items, sortKey) {
  if (!items?.length) return [];
  const arr = [...items];
  const cmpStr = (a, b) => String(a || "").localeCompare(String(b || ""), "ko");
  const cmpNum = (a, b) => (a ?? 0) - (b ?? 0);

  const key = normalizeSortKey(sortKey);

  arr.sort((a, b) => {
    switch (key) {
      case "created_asc":
        return cmpNum(parseCreatedMs(a), parseCreatedMs(b));
      case "created_desc":
        return cmpNum(parseCreatedMs(b), parseCreatedMs(a));
      case "exp_asc": {
        const ea = expSortValue(a);
        const eb = expSortValue(b);
        if (ea == null && eb == null) return cmpStr(a.name, b.name);
        if (ea == null) return 1;
        if (eb == null) return -1;
        return ea - eb;
      }
      case "name_asc":
      default:
        return cmpStr(a.name, b.name);
    }
  });
  return arr;
}
