/** @typedef {'name_asc'|'name_desc'|'created_asc'|'created_desc'|'exp_asc'|'exp_desc'} ItemSortKey */

export const ITEM_SORT_OPTIONS = [
  { value: "name_desc", label: "이름▼" },
  { value: "name_asc", label: "이름▲" },
  { value: "created_desc", label: "등록일▼" },
  { value: "created_asc", label: "등록일▲" },
  { value: "exp_desc", label: "소비기한▼" },
  { value: "exp_asc", label: "소비기한▲" },
];

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

  arr.sort((a, b) => {
    switch (sortKey) {
      case "name_desc":
        return cmpStr(b.name, a.name);
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
      case "exp_desc": {
        const ea = expSortValue(a);
        const eb = expSortValue(b);
        if (ea == null && eb == null) return cmpStr(a.name, b.name);
        if (ea == null) return 1;
        if (eb == null) return -1;
        return eb - ea;
      }
      case "name_asc":
      default:
        return cmpStr(a.name, b.name);
    }
  });
  return arr;
}
