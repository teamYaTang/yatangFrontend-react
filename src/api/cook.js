import apiClient from "./apiClient";

//ex
let id = 1;

//재료선택 후 전송
export const postCookApi = async () => {
  return apiClient.post(`/cook`);
};

// 레시피 조회
export const getRecipeApi = async (cook) => {
  return apiClient.get(`/recipe`, { cook });
};
