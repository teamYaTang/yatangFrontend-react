import apiClient from "./apiClient";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";

export const getIngredientCatalogApi = async (q, userId, category) => {
  const params = new URLSearchParams();
  if (q != null && String(q).trim() !== "") params.set("q", String(q).trim());
  if (userId != null) params.set("userId", String(userId));
  if (category != null && String(category).trim() !== "" && category !== "전체") {
    params.set("category", String(category).trim());
  }
  const qs = params.toString();
  const { data } = await apiClient.get(`/ingredients-catalog${qs ? `?${qs}` : ""}`);
  return data;
};

export const postCustomIngredientCatalogApi = async (name, defaultUnit = "개") => {
  if (!isLoggedIn()) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  const { data } = await apiClient.post(`/ingredients-catalog?userId=${userId}`, {
    name,
    defaultUnit,
  });
  return data;
};

export const deleteCustomIngredientCatalogApi = async (entryId) => {
  if (!isLoggedIn()) {
    throw new Error("로그인이 필요합니다.");
  }
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  await apiClient.delete(`/ingredients-catalog/${entryId}?userId=${userId}`);
};
