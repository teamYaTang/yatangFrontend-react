import apiClient from "./apiClient";
import { isLoggedIn } from "../utils/jwt";
import { aiSuggestRequestHeaders } from "../utils/guestAiSession";
import {
  addGuestRecipeBook,
  addGuestShoppingBatch,
  deleteGuestRecipeBook,
  deleteGuestShoppingItem,
  getGuestRecipeBook,
  getGuestShoppingList,
  toggleGuestShoppingItem,
} from "../utils/storage";

/** 오늘(기기 로컬 날짜 기준) AI 추천 남은 횟수 등 */
export const getRecipeSuggestQuotaApi = async () => {
  const { data } = await apiClient.get("/recipes/suggest-quota", { headers: { ...aiSuggestRequestHeaders() } });
  return data;
};

/**
 * 보유 재료로 AI 레시피 3개 (비회원은 X-Guest-Session-Id, 회원은 JWT)
 * @param {Array} ingredients
 * @param {{ recentRecipeTitles?: string[] }} [options]
 */
export const postRecipeSuggestApi = async (ingredients, options = {}) => {
  const body = {
    ingredients,
    ...(options.recentRecipeTitles?.length ? { recentRecipeTitles: options.recentRecipeTitles } : {}),
  };
  const { data } = await apiClient.post("/recipes/suggest", body, { headers: { ...aiSuggestRequestHeaders() } });
  return data;
};

/** 장바구니 목록 */
export const getShoppingListApi = async () => {
  if (!isLoggedIn()) return getGuestShoppingList();
  const { data } = await apiClient.get("/shopping-list");
  return data;
};

/** 부족 재료 일괄 추가 */
export const addShoppingBatchApi = async (lines) => {
  if (!isLoggedIn()) return addGuestShoppingBatch(lines);
  const { data } = await apiClient.post("/shopping-list/batch", lines);
  return data;
};

/** 장바구니 한 줄 추가 (직접 담기) */
export const addShoppingItemApi = async (line) => {
  if (!isLoggedIn()) return addGuestShoppingBatch([line]);
  const { data } = await apiClient.post("/shopping-list", line);
  return data;
};

export const toggleShoppingItemApi = async (itemId) => {
  if (!isLoggedIn()) return toggleGuestShoppingItem(itemId);
  const { data } = await apiClient.patch(`/shopping-list/${itemId}/toggle`);
  return data;
};

export const deleteShoppingItemApi = async (itemId) => {
  if (!isLoggedIn()) return deleteGuestShoppingItem(itemId);
  await apiClient.delete(`/shopping-list/${itemId}`);
};

/** 레시피북 목록 */
export const getRecipeBookListApi = async () => {
  if (!isLoggedIn()) return getGuestRecipeBook();
  const { data } = await apiClient.get("/recipe-book");
  return data;
};

export const getRecipeBookDetailApi = async (id) => {
  if (!isLoggedIn()) {
    const row = getGuestRecipeBook().find((x) => String(x.id) === String(id));
    if (!row) throw new Error("레시피를 찾을 수 없습니다.");
    return {
      id: row.id,
      title: row.title,
      servings: row.servings,
      cookMinutes: row.cookMinutes,
      payloadJson: row.payloadJson,
      createdAt: row.createdAt,
    };
  }
  const { data } = await apiClient.get(`/recipe-book/${id}`);
  return data;
};

export const saveRecipeToBookApi = async (recipe) => {
  if (!isLoggedIn()) return addGuestRecipeBook(recipe);
  const { data } = await apiClient.post("/recipe-book", { recipe });
  return data;
};

export const deleteRecipeFromBookApi = async (id) => {
  if (!isLoggedIn()) return deleteGuestRecipeBook(id);
  await apiClient.delete(`/recipe-book/${id}`);
};
