import apiClient from "./apiClient";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";

export const getIngredientCatalogApi = async (q, userId) => {
  const params = new URLSearchParams();
  if (q != null && String(q).trim() !== "") params.set("q", String(q).trim());
  if (userId != null) params.set("userId", String(userId));
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
