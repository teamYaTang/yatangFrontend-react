import apiClient from "./apiClient";
import { getUserIdFromToken } from "../utils/jwt";

const ensureUser = () => {
  const userId = getUserIdFromToken();
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }
  return userId;
};

// 메인 냉장고 조회
export const getMainFridgeApi = async () => {
  const userId = ensureUser();
  const { data } = await apiClient.get(`/fridges/main?userId=${userId}`);
  return data;
};

// 냉장고 목록 조회
export const getUserFridgesApi = async () => {
  const userId = ensureUser();
  const { data } = await apiClient.get(`/fridges?userId=${userId}`);
  return data;
};

// 냉장고 상세 조회
export const getFridgeByIdApi = async (fridgeId) => {
  const userId = ensureUser();
  const { data } = await apiClient.get(`/fridges/${fridgeId}?userId=${userId}`);
  return data;
};

// 냉장실 아이템 조회
export const getFridgeItemsApi = async (fridgeId) => {
  const userId = ensureUser();
  const { data } = await apiClient.get(
    `/fridges/${fridgeId}/items?userId=${userId}`,
  );
  return data;
};

// 냉장실 아이템 추가
export const createFridgeItemApi = async (fridgeId, itemData) => {
  const userId = ensureUser();
  const { data } = await apiClient.post(
    `/fridges/${fridgeId}/items?userId=${userId}`,
    itemData,
  );
  return data;
};

// 냉장실 아이템 수정
export const updateFridgeItemApi = async (fridgeId, itemId, itemData) => {
  const userId = ensureUser();
  const { data } = await apiClient.patch(
    `/fridges/${fridgeId}/items/${itemId}?userId=${userId}`,
    itemData,
  );
  return data;
};

// 냉장실 아이템 삭제
export const deleteFridgeItemApi = async (fridgeId, itemId) => {
  const userId = ensureUser();
  const { data } = await apiClient.delete(
    `/fridges/${fridgeId}/items/${itemId}?userId=${userId}`,
  );
  return data;
};

// 냉동실 아이템 조회
export const getFreezerItemsApi = async (fridgeId) => {
  const userId = ensureUser();
  const { data } = await apiClient.get(
    `/fridges/${fridgeId}/freezer-items?userId=${userId}`,
  );
  return data;
};

// 냉동실 아이템 추가
export const createFreezerItemApi = async (fridgeId, itemData) => {
  const userId = ensureUser();
  const { data } = await apiClient.post(
    `/fridges/${fridgeId}/freezer-items?userId=${userId}`,
    itemData,
  );
  return data;
};

// 냉동실 아이템 수정
export const updateFreezerItemApi = async (fridgeId, itemId, itemData) => {
  const userId = ensureUser();
  const { data } = await apiClient.patch(
    `/fridges/${fridgeId}/freezer-items/${itemId}?userId=${userId}`,
    itemData,
  );
  return data;
};

// 냉동실 아이템 삭제
export const deleteFreezerItemApi = async (fridgeId, itemId) => {
  const userId = ensureUser();
  const { data } = await apiClient.delete(
    `/fridges/${fridgeId}/freezer-items/${itemId}?userId=${userId}`,
  );
  return data;
};
