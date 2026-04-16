import apiClient from "./apiClient";

/** @returns {Promise<Record<string, string>>} name(lower) → 공개 이미지 URL */
export const getIngredientImageMapApi = async (userId) => {
  const { data } = await apiClient.get(`/ingredient-images/map?userId=${userId}`);
  return data && typeof data === "object" ? data : {};
};

export const uploadIngredientImageApi = async (userId, ingredientName, file) => {
  const form = new FormData();
  form.append("userId", String(userId));
  form.append("ingredientName", ingredientName);
  form.append("file", file);
  await apiClient.post("/ingredient-images", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteIngredientImageApi = async (userId, ingredientName) => {
  await apiClient.delete("/ingredient-images", {
    params: { userId, ingredientName },
  });
};
