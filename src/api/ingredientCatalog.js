import apiClient from "./apiClient";
import { isLoggedIn } from "../utils/jwt";

/** 시스템 카탈로그: 재료명(소문자) → 아이콘 파일명(영문). 인증 불필요. */
export const getIngredientCatalogIconMapApi = async () => {
  const { data } = await apiClient.get("/ingredients-catalog/icon-map");
  return data;
};

export const getIngredientCatalogApi = async (q, category) => {
  const params = new URLSearchParams();
  if (q != null && String(q).trim() !== "") params.set("q", String(q).trim());
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
  const { data } = await apiClient.post("/ingredients-catalog", {
    name,
    defaultUnit,
  });
  return data;
};

export const deleteCustomIngredientCatalogApi = async (entryId) => {
  if (!isLoggedIn()) {
    throw new Error("로그인이 필요합니다.");
  }
  await apiClient.delete(`/ingredients-catalog/${entryId}`);
};
