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
  await apiClient.post("/ingredient-images", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteIngredientImageApi = async (ingredientName) => {
  await apiClient.delete("/ingredient-images", {
    params: { ingredientName },
  });
};
