import apiClient from "./apiClient";

//ex
let id = 1;

//재료조회
export const getIngredientApi = async () => {
  return apiClient.get(`/account/${id}/refrigerator`);
};

// 재료추가
export const createIngredientApi = async (ingredient) => {
  return apiClient.post(`/account/${id}/refrigerator`, { ingredient });
};

// 재료삭제
export const deleteTodoApi = async (id) => {
  return apiClient.delete(`/account/${id}/refrigerator`);
};
