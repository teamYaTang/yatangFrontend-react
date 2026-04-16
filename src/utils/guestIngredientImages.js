import { getGuestCatalogExtras } from "./storage";

const KEY = "yatang_guest_ingredient_images";

/** @returns {Record<string, string>} name(lower) → data URL 또는 http(s) URL */
export function getGuestIngredientImageMap() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

export function setGuestIngredientImage(name, dataUrl) {
  const key = String(name || "").trim().toLowerCase();
  if (!key || !dataUrl) return;
  const map = { ...getGuestIngredientImageMap() };
  map[key] = dataUrl;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function removeGuestIngredientImage(name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return;
  const map = { ...getGuestIngredientImageMap() };
  delete map[key];
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** 직접 추가(게스트 카탈로그 extras) 재료에만 해당하는 이미지 — 시스템 재료명에 붙은 사진은 제외 */
export function getGuestIngredientImageMapForCustomCatalogOnly() {
  const full = getGuestIngredientImageMap();
  const allowed = new Set(
    getGuestCatalogExtras()
      .map((x) => String(x.name || "").trim().toLowerCase())
      .filter(Boolean),
  );
  /** @type {Record<string, string>} */
  const out = {};
  for (const [k, v] of Object.entries(full)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}
