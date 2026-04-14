const KEY = "yatang_recent_ai_recipes";
const MAX = 15;

/** AI 추천으로 받은 레시피를 최대 15개까지 로컬에 누적 저장 */
export function pushRecentAiRecipes(recipes) {
  if (!recipes?.length) return;
  let prev = [];
  try {
    prev = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(prev)) prev = [];
  } catch {
    prev = [];
  }
  const at = new Date().toISOString();
  const stamped = recipes.map((r) => ({ ...r, suggestedAt: at }));
  const merged = [...stamped, ...prev].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(merged));
}

export function getRecentAiRecipes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
