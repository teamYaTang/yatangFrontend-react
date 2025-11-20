import apiClient from "./apiClient";
import { getUserIdFromToken } from "../utils/jwt";

// 메인 냉장고 조회
export const getMainFridgeApi = async () => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.get(`/fridges/main?userId=${userId}`);
};

// 냉장고 목록 조회
export const getUserFridgesApi = async () => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.get(`/fridges?userId=${userId}`);
};

// 냉장고 상세 조회
export const getFridgeByIdApi = async (fridgeId) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.get(`/fridges/${fridgeId}?userId=${userId}`);
};

// 냉장실 아이템 조회
export const getFridgeItemsApi = async (fridgeId) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.get(`/fridges/${fridgeId}/items?userId=${userId}`);
};

// 냉장실 아이템 추가
export const createFridgeItemApi = async (fridgeId, itemData) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.post(`/fridges/${fridgeId}/items?userId=${userId}`, itemData);
};

// 냉장실 아이템 수정
export const updateFridgeItemApi = async (fridgeId, itemId, itemData) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.patch(`/fridges/${fridgeId}/items/${itemId}?userId=${userId}`, itemData);
};

// 냉장실 아이템 삭제
export const deleteFridgeItemApi = async (fridgeId, itemId) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.delete(`/fridges/${fridgeId}/items/${itemId}?userId=${userId}`);
};

// 냉동실 아이템 조회
export const getFreezerItemsApi = async (fridgeId) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.get(`/fridges/${fridgeId}/freezer-items?userId=${userId}`);
};

// 냉동실 아이템 추가
export const createFreezerItemApi = async (fridgeId, itemData) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.post(`/fridges/${fridgeId}/freezer-items?userId=${userId}`, itemData);
};

// 냉동실 아이템 수정
export const updateFreezerItemApi = async (fridgeId, itemId, itemData) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.patch(`/fridges/${fridgeId}/freezer-items/${itemId}?userId=${userId}`, itemData);
};

// 냉동실 아이템 삭제
export const deleteFreezerItemApi = async (fridgeId, itemId) => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return apiClient.delete(`/fridges/${fridgeId}/freezer-items/${itemId}?userId=${userId}`);
};
