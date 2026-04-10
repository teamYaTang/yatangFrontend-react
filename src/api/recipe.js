import apiClient from "./apiClient";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import {
  addGuestRecipeBook,
  addGuestShoppingBatch,
  deleteGuestRecipeBook,
  deleteGuestShoppingItem,
  getGuestRecipeBook,
  getGuestShoppingList,
  toggleGuestShoppingItem,
} from "../utils/storage";

const getUserId = () => {
  const id = getUserIdFromToken();
  if (!id) throw new Error("로그인이 필요합니다.");
  return id;
};

/** 보유 재료로 AI 레시피 3개 (서버에서 OpenAI 호출, 로그인 필요) */
export const postRecipeSuggestApi = async (ingredients) => {
  const { data } = await apiClient.post("/recipes/suggest", { ingredients });
  return data;
};

/** 장바구니 목록 */
export const getShoppingListApi = async () => {
  if (!isLoggedIn()) return getGuestShoppingList();
  const userId = getUserId();
  const { data } = await apiClient.get(`/shopping-list?userId=${userId}`);
  return data;
};

/** 부족 재료 일괄 추가 */
export const addShoppingBatchApi = async (lines) => {
  if (!isLoggedIn()) return addGuestShoppingBatch(lines);
  const userId = getUserId();
  const { data } = await apiClient.post(`/shopping-list/batch?userId=${userId}`, lines);
  return data;
};

export const toggleShoppingItemApi = async (itemId) => {
  if (!isLoggedIn()) return toggleGuestShoppingItem(itemId);
  const userId = getUserId();
  const { data } = await apiClient.patch(`/shopping-list/${itemId}/toggle?userId=${userId}`);
  return data;
};

export const deleteShoppingItemApi = async (itemId) => {
  if (!isLoggedIn()) return deleteGuestShoppingItem(itemId);
  const userId = getUserId();
  await apiClient.delete(`/shopping-list/${itemId}?userId=${userId}`);
};

/** 레시피북 목록 */
export const getRecipeBookListApi = async () => {
  if (!isLoggedIn()) return getGuestRecipeBook();
  const userId = getUserId();
  const { data } = await apiClient.get(`/recipe-book?userId=${userId}`);
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
  const userId = getUserId();
  const { data } = await apiClient.get(`/recipe-book/${id}?userId=${userId}`);
  return data;
};

export const saveRecipeToBookApi = async (recipe) => {
  if (!isLoggedIn()) return addGuestRecipeBook(recipe);
  const userId = getUserId();
  const { data } = await apiClient.post(`/recipe-book?userId=${userId}`, { recipe });
  return data;
};

export const deleteRecipeFromBookApi = async (id) => {
  if (!isLoggedIn()) return deleteGuestRecipeBook(id);
  const userId = getUserId();
  await apiClient.delete(`/recipe-book/${id}?userId=${userId}`);
};
