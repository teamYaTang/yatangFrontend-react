/** AI 레시피 부족 재료 → 장바구니 API/표시 공통 */

export const inventoryRowKey = (row) =>
  `${row.storageType || ""}-${row.fridgeId ?? "p"}-${row.itemId ?? row.id}`;

export function normalizeMissingItems(recipe) {
  let raw = recipe?.missingIngredients ?? recipe?.missing_ingredients;
  if (raw == null) return [];
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) {
    raw = typeof raw === "object" && raw !== null ? [raw] : [];
  }
  const out = [];
  for (const m of raw) {
    if (m == null) continue;
    if (typeof m === "string") {
      const name = m.trim();
      if (name) out.push({ name, amount: "", note: "", substitute: "" });
      continue;
    }
    if (typeof m !== "object") continue;
    const name = String(m.name ?? m.ingredient ?? m.ingredientName ?? "").trim();
    if (!name) continue;
    out.push({
      name,
      amount: String(m.amount ?? m.quantity ?? "").trim(),
      note: String(m.note ?? m.description ?? "").trim(),
      substitute: String(m.substitute ?? "").trim(),
    });
  }
  return out;
}

export function missingItemsToShoppingLines(items, recipeTitle) {
  const src = (recipeTitle || "").trim();
  return items.map((m) => ({
    ingredientName: m.name,
    quantityNote: "",
    unit: "",
    sourceRecipeTitle: src || undefined,
  }));
}

export function shoppingBatchErrorMessage(e, fallback) {
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    if (data.message) return String(data.message);
    if (data.detail) return String(data.detail);
    if (data.error) return String(data.error);
    if (Array.isArray(data.errors) && data.errors[0]) {
      const x = data.errors[0];
      if (x?.defaultMessage) return String(x.defaultMessage);
    }
  }
  return e?.message || fallback;
}
