import apiClient from "./apiClient";

/** @returns {Promise<Record<string, string>>} name(lower) → 공개 이미지 URL */
export const getIngredientImageMapApi = async () => {
  const { data } = await apiClient.get("/ingredient-images/map");
  return data && typeof data === "object" ? data : {};
};

export const uploadIngredientImageApi = async (ingredientName, file) => {
  const form = new FormData();
  form.append("ingredientName", ingredientName);
  form.append("file", file);
  // Content-Type 을 수동 지정하면 boundary 가 빠져 Spring multipart 파싱이 실패합니다.
  await apiClient.post("/ingredient-images", form);
};

export const deleteIngredientImageApi = async (ingredientName) => {
  await apiClient.delete("/ingredient-images", {
    params: { ingredientName },
  });
};
