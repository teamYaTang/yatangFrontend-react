import apiClient from "./apiClient";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import {
  getLocalFridges,
  createLocalFridge,
  updateLocalFridge,
  deleteLocalFridge,
  getLocalFridgeItems,
  createLocalFridgeItem,
  updateLocalFridgeItem,
  deleteLocalFridgeItem,
  getLocalFreezerItems,
  createLocalFreezerItem,
  updateLocalFreezerItem,
  deleteLocalFreezerItem,
  getLocalPantryItems,
  createLocalPantryItem,
  updateLocalPantryItem,
  deleteLocalPantryItem,
} from "../utils/storage";

const getUserId = () => {
  const userId = getUserIdFromToken();
  if (!userId) throw new Error("로그인이 필요합니다.");
  return userId;
};

// ───────── 냉장고 ─────────

export const getMainFridgeApi = async () => {
  if (!isLoggedIn()) {
    const fridges = getLocalFridges();
    return fridges.find((f) => f.isMain) || fridges[0];
  }
  const userId = getUserId();
  const { data } = await apiClient.get(`/fridges/main?userId=${userId}`);
  return data;
};

export const getUserFridgesApi = async () => {
  if (!isLoggedIn()) return getLocalFridges();
  const userId = getUserId();
  const { data } = await apiClient.get(`/fridges?userId=${userId}`);
  return data;
};

export const createFridgeApi = async (name, isMain) => {
  if (!isLoggedIn()) return createLocalFridge(name, isMain);
  const userId = getUserId();
  const { data } = await apiClient.post(`/fridges?userId=${userId}`, { name, isMain });
  return data;
};

export const updateFridgeApi = async (fridgeId, updateData) => {
  if (!isLoggedIn()) return updateLocalFridge(fridgeId, updateData);
  const userId = getUserId();
  const { data } = await apiClient.patch(`/fridges/${fridgeId}?userId=${userId}`, updateData);
  return data;
};

export const getFridgeByIdApi = async (fridgeId) => {
  if (!isLoggedIn()) {
    const fridges = getLocalFridges();
    return fridges.find((f) => f.id === fridgeId);
  }
  const userId = getUserId();
  const { data } = await apiClient.get(`/fridges/${fridgeId}?userId=${userId}`);
  return data;
};

export const deleteFridgeApi = async (fridgeId) => {
  if (!isLoggedIn()) return deleteLocalFridge(fridgeId);
  const userId = getUserId();
  const { data } = await apiClient.delete(`/fridges/${fridgeId}?userId=${userId}`);
  return data;
};

// ───────── 게스트 데이터 마이그레이션 ─────────
export const importGuestDataApi = async (guestData) => {
  const userId = getUserId();
  const { data } = await apiClient.post(`/users/${userId}/guest-import`, guestData);
  return data;
};

// ───────── 상온보관 (사용자당 하나의 목록) ─────────

export const getPantryItemsApi = async () => {
  if (!isLoggedIn()) return getLocalPantryItems();
  const userId = getUserId();
  const { data } = await apiClient.get(`/pantry/items?userId=${userId}`);
  return data;
};

export const createPantryItemApi = async (itemData) => {
  if (!isLoggedIn()) return createLocalPantryItem(itemData);
  const userId = getUserId();
  const { data } = await apiClient.post(`/pantry/items?userId=${userId}`, itemData);
  return data;
};

export const updatePantryItemApi = async (itemId, itemData) => {
  if (!isLoggedIn()) return updateLocalPantryItem(itemId, itemData);
  const userId = getUserId();
  const { data } = await apiClient.patch(`/pantry/items/${itemId}?userId=${userId}`, itemData);
  return data;
};

export const deletePantryItemApi = async (itemId) => {
  if (!isLoggedIn()) return deleteLocalPantryItem(itemId);
  const userId = getUserId();
  const { data } = await apiClient.delete(`/pantry/items/${itemId}?userId=${userId}`);
  return data;
};

// ───────── 냉장실 아이템 ─────────

export const getFridgeItemsApi = async (fridgeId) => {
  if (!isLoggedIn()) return getLocalFridgeItems(fridgeId);
  const userId = getUserId();
  const { data } = await apiClient.get(`/fridges/${fridgeId}/items?userId=${userId}`);
  return data;
};

export const createFridgeItemApi = async (fridgeId, itemData) => {
  if (!isLoggedIn()) return createLocalFridgeItem(fridgeId, itemData);
  const userId = getUserId();
  const { data } = await apiClient.post(`/fridges/${fridgeId}/items?userId=${userId}`, itemData);
  return data;
};

export const updateFridgeItemApi = async (fridgeId, itemId, itemData) => {
  if (!isLoggedIn()) return updateLocalFridgeItem(fridgeId, itemId, itemData);
  const userId = getUserId();
  const { data } = await apiClient.patch(
      `/fridges/${fridgeId}/items/${itemId}?userId=${userId}`,
      itemData
  );
  return data;
};

export const deleteFridgeItemApi = async (fridgeId, itemId) => {
  if (!isLoggedIn()) return deleteLocalFridgeItem(fridgeId, itemId);
  const userId = getUserId();
  const { data } = await apiClient.delete(
      `/fridges/${fridgeId}/items/${itemId}?userId=${userId}`
  );
  return data;
};

// ───────── 냉동실 아이템 ─────────

export const getFreezerItemsApi = async (fridgeId) => {
  if (!isLoggedIn()) return getLocalFreezerItems(fridgeId);
  const userId = getUserId();
  const { data } = await apiClient.get(`/fridges/${fridgeId}/freezer-items?userId=${userId}`);
  return data;
};

export const createFreezerItemApi = async (fridgeId, itemData) => {
  if (!isLoggedIn()) return createLocalFreezerItem(fridgeId, itemData);
  const userId = getUserId();
  const { data } = await apiClient.post(
      `/fridges/${fridgeId}/freezer-items?userId=${userId}`,
      itemData
  );
  return data;
};

export const updateFreezerItemApi = async (fridgeId, itemId, itemData) => {
  if (!isLoggedIn()) return updateLocalFreezerItem(fridgeId, itemId, itemData);
  const userId = getUserId();
  const { data } = await apiClient.patch(
      `/fridges/${fridgeId}/freezer-items/${itemId}?userId=${userId}`,
      itemData
  );
  return data;
};

export const deleteFreezerItemApi = async (fridgeId, itemId) => {
  if (!isLoggedIn()) return deleteLocalFreezerItem(fridgeId, itemId);
  const userId = getUserId();
  const { data } = await apiClient.delete(
      `/fridges/${fridgeId}/freezer-items/${itemId}?userId=${userId}`
  );
  return data;
};

/** 모든 냉장고의 냉장·냉동 재료를 한 목록으로 (게스트는 로컬 병합) */
export const getAllItemsAcrossFridgesApi = async () => {
  if (!isLoggedIn()) {
    const fridges = getLocalFridges();
    const rows = [];
    for (const f of fridges) {
      const fname = f.name || "냉장고";
      getLocalFridgeItems(f.id).forEach((item) => {
        rows.push({
          ...item,
          createdAt: item.createdAt || null,
          itemId: item.id,
          fridgeId: f.id,
          fridgeName: fname,
          storageType: "냉장실",
        });
      });
      getLocalFreezerItems(f.id).forEach((item) => {
        rows.push({
          ...item,
          createdAt: item.createdAt || null,
          itemId: item.id,
          fridgeId: f.id,
          fridgeName: fname,
          storageType: "냉동실",
        });
      });
    }
    getLocalPantryItems().forEach((item) => {
      rows.push({
        ...item,
        createdAt: item.createdAt || null,
        itemId: item.id,
        fridgeId: null,
        fridgeName: "상온보관",
        storageType: "상온보관",
      });
    });
    rows.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
    return rows;
  }
  const userId = getUserId();
  const { data } = await apiClient.get(`/fridges/all-items?userId=${userId}`);
  return data;
};