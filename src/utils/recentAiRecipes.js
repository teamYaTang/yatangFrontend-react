import { getUserIdFromToken, isLoggedIn } from "./jwt";

const BASE_KEY = "yatang_recent_ai_recipes";
const MAX = 15;

const getStorageKey = () => {
  if (isLoggedIn()) {
    const userId = getUserIdFromToken();
    if (userId) return `${BASE_KEY}:user:${userId}`;
  }
  return `${BASE_KEY}:guest`;
};

/** AI 추천으로 받은 레시피를 최대 15개까지 로컬에 누적 저장 */
export function pushRecentAiRecipes(recipes) {
  if (!recipes?.length) return;
  const key = getStorageKey();
  let prev = [];
  try {
    prev = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(prev)) prev = [];
  } catch {
    prev = [];
  }
  const at = new Date().toISOString();
  const stamped = recipes.map((r) => ({ ...r, suggestedAt: at }));
  const merged = [...stamped, ...prev].slice(0, MAX);
  localStorage.setItem(key, JSON.stringify(merged));
}

export function getRecentAiRecipes() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** AI에 넘겨 이전 추천과 겹치지 않게 할 요리 제목 (최신순, 중복 제거, 최대 24개) */
export function getRecentAiRecipeTitleHints() {
  const recipes = getRecentAiRecipes();
  const titles = [];
  const seen = new Set();
  for (const r of recipes) {
    const t = (r.title || "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    titles.push(t);
    if (titles.length >= 24) break;
  }
  return titles;
}
