import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Ingredient.css";
import { FiPlus, FiTrash2, FiArrowLeft, FiX } from "react-icons/fi";

import {
  getUserFridgesApi,
  getFridgeItemsApi,
  getFreezerItemsApi,
  createFridgeItemApi,
  createFreezerItemApi,
  updateFridgeItemApi,
  updateFreezerItemApi,
  deleteFridgeItemApi,
  deleteFreezerItemApi,
  getAllItemsAcrossFridgesApi,
  getPantryItemsApi,
  createPantryItemApi,
  updatePantryItemApi,
  deletePantryItemApi,
} from "../api/refrigerator";
import {
  getIngredientCatalogApi,
  getIngredientCatalogIconMapApi,
  postCustomIngredientCatalogApi,
  deleteCustomIngredientCatalogApi,
} from "../api/ingredientCatalog";
import { getIngredientImageMapApi } from "../api/ingredientImages";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { getGuestCatalogExtras, addGuestCatalogExtra, removeGuestCatalogExtra } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { ITEM_SORT_OPTIONS, sortItems, normalizeSortKey } from "../utils/itemSort";
import { formatRegisteredAt } from "../utils/ddayLabel";
import { INGREDIENT_CATALOG_CATEGORIES } from "../constants/ingredientCatalogCategories";
import { CatalogIngredientGlyph } from "../constants/ingredientCatalogVisuals";
import { uploadIngredientImageApi } from "../api/ingredientImages";
import {
  getGuestIngredientImageMap,
  getGuestIngredientImageMapForCustomCatalogOnly,
  setGuestIngredientImage,
} from "../utils/guestIngredientImages";

const UNIT_PRESETS = ["개", "팩", "병", "봉지", "캔", "g", "kg", "ml", "L"];

const LS_ING_TAB = "yatang_ingredient_tab";
const LS_ING_SORT = "yatang_ingredient_sort";
const LS_CATALOG_STORAGE = "yatang_catalog_storage";
const UNIT_CUSTOM = "__CUSTOM__";

const defaultPayload = (name, unit) => ({
  name: name.trim(),
  quantity: 1,
  unit: (unit || "개").trim(),
  expirationDate: null,
  manufactureDate: null,
  memo: null,
});

/** 검색/목록이 바뀌어도 선택이 유지되도록 이름+기본단위로 키 고정 */
const catalogStableKey = (name, defaultUnit) =>
  `${String(name || "").trim()}::${String(defaultUnit || "개").trim()}`;

const parseCatalogStableKey = (key) => {
  const i = key.indexOf("::");
  if (i === -1) return { name: key.trim(), unit: "개" };
  return { name: key.slice(0, i).trim(), unit: key.slice(i + 2).trim() || "개" };
};

const isPresetUnit = (u) => UNIT_PRESETS.includes(u);

const Ingredient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [userNickname, setUserNickname] = useState("");
  const [fridges, setFridges] = useState([]);
  const [fridgeId, setFridgeId] = useState(null);

  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [allItems, setAllItems] = useState([]);

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(LS_ING_TAB) || "fridge");
  const [sortKey, setSortKey] = useState(() => normalizeSortKey(localStorage.getItem(LS_ING_SORT)));

  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("개");
  const [expirationDate, setExpirationDate] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [memo, setMemo] = useState("");

  const [loading, setLoading] = useState(true);
  const [duplicateDecision, setDuplicateDecision] = useState(null);
  const [duplicateProcessing, setDuplicateProcessing] = useState(false);

  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSelected, setCatalogSelected] = useState(() => new Set());
  const [catalogTargetFridgeId, setCatalogTargetFridgeId] = useState(null);
  const [catalogTargetStorage, setCatalogTargetStorage] = useState("fridge");
  const [catalogCategory, setCatalogCategory] = useState("전체");
  const [customCatalogName, setCustomCatalogName] = useState("");
  const [catalogAdding, setCatalogAdding] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [moveProcessing, setMoveProcessing] = useState(false);
  const [bulkSelected, setBulkSelected] = useState(() => new Set());
  const [, setGuestImageTick] = useState(0);
  /** 전체 탭: false면 선택된 냉장고의 냉장·냉동 + 상온만 */
  const [showAllFridgesInAllTab, setShowAllFridgesInAllTab] = useState(false);

  /** 재료명(소문자) → 시스템 카탈로그 아이콘 파일명 */
  const [systemIconFileByNameLower, setSystemIconFileByNameLower] = useState({});
  /** 재료명(소문자) → 사용자 업로드 이미지 URL */
  const [userIngredientImageMap, setUserIngredientImageMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await getIngredientCatalogIconMapApi();
        if (!cancelled) setSystemIconFileByNameLower(m && typeof m === "object" ? m : {});
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncGuest = () => {
      if (!isLoggedIn()) {
        setUserIngredientImageMap(getGuestIngredientImageMapForCustomCatalogOnly());
      }
    };
    syncGuest();
    window.addEventListener("yatang-guest-images-changed", syncGuest);
    return () => window.removeEventListener("yatang-guest-images-changed", syncGuest);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isLoggedIn()) {
        setUserIngredientImageMap(getGuestIngredientImageMapForCustomCatalogOnly());
        return;
      }
      const uid = getUserIdFromToken();
      if (!uid) return;
      try {
        const m = await getIngredientImageMapApi(uid);
        if (!cancelled) setUserIngredientImageMap(m || {});
      } catch (e) {
        console.error(e);
      }
    };
    load();
    window.addEventListener("yatang-ingredient-images-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("yatang-ingredient-images-changed", load);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_ING_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(LS_ING_SORT, sortKey);
  }, [sortKey]);

  useLayoutEffect(() => {
    if (location.state?.fromRefrigerator) {
      setActiveTab("fridge");
      localStorage.setItem(LS_ING_TAB, "fridge");
    }
  }, [location.state]);

  const setTabAndPersistStorage = (tab) => {
    setActiveTab(tab);
    if (tab === "fridge") localStorage.setItem(LS_CATALOG_STORAGE, "fridge");
    else if (tab === "freezer") localStorage.setItem(LS_CATALOG_STORAGE, "freezer");
    else if (tab === "pantry") localStorage.setItem(LS_CATALOG_STORAGE, "pantry");
  };

  const openCatalog = () => {
    setCatalogTargetStorage("fridge");
    if (fridgeId != null) {
      setCatalogTargetFridgeId(fridgeId);
    }
    setCatalogOpen(true);
  };

  const loadItems = async (targetFridgeId) => {
    const [fridgeData, freezerData] = await Promise.all([
      getFridgeItemsApi(targetFridgeId),
      getFreezerItemsApi(targetFridgeId),
    ]);
    setFridgeItems(fridgeData ?? []);
    setFreezerItems(freezerData ?? []);
  };

  const loadAllItems = useCallback(async () => {
    const data = await getAllItemsAcrossFridgesApi();
    setAllItems(data ?? []);
  }, []);

  const loadPantry = useCallback(async () => {
    const data = await getPantryItemsApi();
    setPantryItems(data ?? []);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (isLoggedIn()) {
          const userId = getUserIdFromToken();
          if (userId) {
            const profile = await getUserProfile(userId);
            setUserNickname(profile.nickname || profile.username || "");
          } else {
            setUserNickname("");
          }
        } else {
          setUserNickname("게스트");
        }

        const userFridges = await getUserFridgesApi();
        setFridges(userFridges);

        let initialFridgeId = location.state?.selectedFridgeId;
        let selectedFridge = userFridges.find((f) => String(f.id) === String(initialFridgeId));

        if (!selectedFridge) {
          selectedFridge = userFridges.find((f) => f.isMain) || userFridges[0];
          initialFridgeId = selectedFridge?.id;
        }

        setFridgeId(initialFridgeId ?? null);
        setCatalogTargetFridgeId(initialFridgeId ?? null);
        if (initialFridgeId != null) {
          await loadItems(initialFridgeId);
        }
        await loadPantry();
        await loadAllItems();
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        toast("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate, location.state, loadAllItems, loadPantry, toast]);

  useEffect(() => {
    if (activeTab === "all") {
      loadAllItems();
    }
    if (activeTab === "pantry") {
      loadPantry();
    }
    if (activeTab !== "all") {
      setShowAllFridgesInAllTab(false);
    }
  }, [activeTab, loadAllItems, loadPantry]);

  const handleFridgeChange = async (e) => {
    const selectedRaw = e.target.value;
    const match = fridges.find((f) => String(f.id) === String(selectedRaw));
    const id = match ? match.id : selectedRaw;
    setFridgeId(id);
    setCatalogTargetFridgeId(id);
    setLoading(true);
    await loadItems(id);
    setLoading(false);
  };

  const resetItemForm = () => {
    setItemName("");
    setQuantity("");
    setUnit("개");
    setExpirationDate("");
    setManufactureDate("");
    setMemo("");
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (activeTab === "all") {
      toast("재료 추가는 냉장실·냉동실·상온보관 탭에서 해주세요.");
      return;
    }
    if (!itemName || !quantity) {
      toast("재료명과 수량을 입력해주세요.");
      return;
    }
    const unitTrim = (unit || "").trim();
    if (!unitTrim) {
      toast("단위를 입력하거나 선택해주세요.");
      return;
    }
    if (activeTab !== "pantry" && fridgeId == null) return;

    const requestedQty = parseInt(quantity, 10);
    if (Number.isNaN(requestedQty) || requestedQty <= 0) {
      toast("수량은 1 이상의 숫자여야 합니다.");
      return;
    }

    const payload = {
      name: itemName.trim(),
      quantity: requestedQty,
      unit: unitTrim,
      expirationDate: expirationDate || null,
      manufactureDate: manufactureDate || null,
      memo: memo || null,
    };

    const itemsInThisTab =
      activeTab === "fridge" ? fridgeItems : activeTab === "freezer" ? freezerItems : pantryItems;
    const existingItem = itemsInThisTab.find(
      (it) => it.name?.trim() === payload.name && it.unit === payload.unit,
    );

    if (existingItem) {
      setDuplicateDecision({
        existingItem,
        payload,
        requestedQty,
        targetTab: activeTab,
      });
      return;
    }

    try {
      if (activeTab === "fridge") {
        await createFridgeItemApi(fridgeId, payload);
        await loadItems(fridgeId);
      } else if (activeTab === "freezer") {
        await createFreezerItemApi(fridgeId, payload);
        await loadItems(fridgeId);
      } else {
        await createPantryItemApi(payload);
        await loadPantry();
      }
      await loadAllItems();
      resetItemForm();
      toast("추가했습니다.");
    } catch (error) {
      console.error("재료 추가 에러:", error);
      toast(error.message || "재료 추가에 실패했습니다.");
    }
  };

  const handleDuplicateConfirmAddQuantity = async () => {
    if (!duplicateDecision) return;
    const { existingItem, requestedQty, targetTab } = duplicateDecision;

    setDuplicateProcessing(true);
    try {
      const nextQuantity = (existingItem.quantity ?? 0) + requestedQty;
      if (targetTab === "fridge") {
        await updateFridgeItemApi(fridgeId, existingItem.id, { quantity: nextQuantity });
        await loadItems(fridgeId);
      } else if (targetTab === "freezer") {
        await updateFreezerItemApi(fridgeId, existingItem.id, { quantity: nextQuantity });
        await loadItems(fridgeId);
      } else {
        await updatePantryItemApi(existingItem.id, { quantity: nextQuantity });
        await loadPantry();
      }
      await loadAllItems();
      resetItemForm();
      setDuplicateDecision(null);
      toast("수량을 반영했습니다.");
    } catch (error) {
      console.error("중복 아이템 처리 에러:", error);
      toast(error.message || "기존 아이템에 수량 추가에 실패했습니다.");
    } finally {
      setDuplicateProcessing(false);
    }
  };

  const handleDuplicateConfirmAddNewItem = async () => {
    if (!duplicateDecision) return;
    const { payload, targetTab } = duplicateDecision;

    setDuplicateProcessing(true);
    try {
      if (targetTab === "fridge") {
        await createFridgeItemApi(fridgeId, payload);
        await loadItems(fridgeId);
      } else if (targetTab === "freezer") {
        await createFreezerItemApi(fridgeId, payload);
        await loadItems(fridgeId);
      } else {
        await createPantryItemApi(payload);
        await loadPantry();
      }
      await loadAllItems();
      resetItemForm();
      setDuplicateDecision(null);
      toast("추가했습니다.");
    } catch (error) {
      console.error("중복 아이템 새로 등록 에러:", error);
      toast(error.message || "새 아이템 등록에 실패했습니다.");
    } finally {
      setDuplicateProcessing(false);
    }
  };

  const handleDuplicateCancel = () => {
    setDuplicateDecision(null);
  };

  const openEditFromFridgeItem = (item, storage) => {
    setEditModal({
      fridgeId: storage === "pantry" ? null : fridgeId,
      itemId: item.id,
      storageType: storage,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expirationDate || "",
      manufactureDate: item.manufactureDate || "",
      memo: item.memo || "",
      createdAt: item.createdAt,
    });
  };

  const openEditFromAggregated = (row) => {
    if (row.storageType === "상온보관") {
      setEditModal({
        fridgeId: null,
        itemId: row.itemId ?? row.id,
        storageType: "pantry",
        name: row.name,
        quantity: row.quantity,
        unit: row.unit,
        expirationDate: row.expirationDate || "",
        manufactureDate: row.manufactureDate || "",
        memo: row.memo || "",
        createdAt: row.createdAt,
      });
      return;
    }
    const sid = row.storageType === "냉장실" ? "fridge" : "freezer";
    setEditModal({
      fridgeId: row.fridgeId,
      itemId: row.itemId ?? row.id,
      storageType: sid,
      name: row.name,
      quantity: row.quantity,
      unit: row.unit,
      expirationDate: row.expirationDate || "",
      manufactureDate: row.manufactureDate || "",
      memo: row.memo || "",
      createdAt: row.createdAt,
    });
  };

  const buildItemBodyFromEdit = (em) => {
    const q = parseInt(em.quantity, 10);
    const unitTrim = (em.unit || "").trim() || "개";
    return {
      name: em.name?.trim(),
      quantity: q,
      unit: unitTrim,
      expirationDate: em.expirationDate || null,
      manufactureDate: em.manufactureDate || null,
      memo: em.memo || null,
    };
  };

  const saveEditModal = async () => {
    if (!editModal) return;
    setEditSaving(true);
    try {
      const body = buildItemBodyFromEdit(editModal);
      if (Number.isNaN(body.quantity) || body.quantity <= 0) {
        toast("수량은 1 이상이어야 합니다.");
        setEditSaving(false);
        return;
      }
      if (!body.name) {
        toast("이름을 입력해주세요.");
        setEditSaving(false);
        return;
      }
      if (editModal.storageType === "pantry") {
        await updatePantryItemApi(editModal.itemId, body);
        await loadPantry();
      } else if (editModal.storageType === "fridge") {
        await updateFridgeItemApi(editModal.fridgeId, editModal.itemId, body);
        if (fridgeId != null) await loadItems(fridgeId);
      } else {
        await updateFreezerItemApi(editModal.fridgeId, editModal.itemId, body);
        if (fridgeId != null) await loadItems(fridgeId);
      }
      setEditModal(null);
      await loadAllItems();
      toast("저장했습니다.");
    } catch (error) {
      console.error(error);
      toast(error.message || "저장에 실패했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  const moveEditBetweenFridgeFreezer = async () => {
    if (!editModal) return;
    setMoveProcessing(true);
    try {
      const body = buildItemBodyFromEdit(editModal);
      if (Number.isNaN(body.quantity) || body.quantity <= 0 || !body.name) {
        toast("이름·수량을 확인해주세요.");
        setMoveProcessing(false);
        return;
      }
      const { fridgeId: fid, itemId: iid, storageType: st } = editModal;
      if (st === "fridge") {
        await deleteFridgeItemApi(fid, iid);
        await createFreezerItemApi(fid, body);
      } else {
        await deleteFreezerItemApi(fid, iid);
        await createFridgeItemApi(fid, body);
      }
      setEditModal(null);
      if (String(fid) === String(fridgeId)) {
        await loadItems(fid);
      }
      await loadAllItems();
      toast("이동했습니다.");
    } catch (e) {
      console.error(e);
      toast(e.message || "이동에 실패했습니다.");
    } finally {
      setMoveProcessing(false);
    }
  };

  const moveEditFridgeOrFreezerToPantry = async () => {
    if (!editModal) return;
    setMoveProcessing(true);
    try {
      const body = buildItemBodyFromEdit(editModal);
      if (Number.isNaN(body.quantity) || body.quantity <= 0 || !body.name) {
        toast("이름·수량을 확인해주세요.");
        setMoveProcessing(false);
        return;
      }
      const { fridgeId: fid, itemId: iid, storageType: st } = editModal;
      if (fid == null) {
        toast("냉장고 정보를 찾을 수 없습니다.");
        setMoveProcessing(false);
        return;
      }
      if (st === "fridge") {
        await deleteFridgeItemApi(fid, iid);
      } else if (st === "freezer") {
        await deleteFreezerItemApi(fid, iid);
      } else {
        return;
      }
      await createPantryItemApi(body);
      setEditModal(null);
      await loadItems(fid);
      await loadPantry();
      await loadAllItems();
      toast("상온보관으로 옮겼습니다.");
    } catch (e) {
      console.error(e);
      toast(e.message || "이동에 실패했습니다.");
    } finally {
      setMoveProcessing(false);
    }
  };

  const moveEditPantryToFridge = async () => {
    if (!editModal || editModal.storageType !== "pantry" || !fridgeId) return;
    setMoveProcessing(true);
    try {
      const body = buildItemBodyFromEdit(editModal);
      if (Number.isNaN(body.quantity) || body.quantity <= 0 || !body.name) {
        toast("이름·수량을 확인해주세요.");
        setMoveProcessing(false);
        return;
      }
      await deletePantryItemApi(editModal.itemId);
      await createFridgeItemApi(fridgeId, body);
      setEditModal(null);
      await loadPantry();
      await loadItems(fridgeId);
      await loadAllItems();
      toast("냉장실로 옮겼습니다.");
    } catch (e) {
      console.error(e);
      toast(e.message || "이동에 실패했습니다.");
    } finally {
      setMoveProcessing(false);
    }
  };

  const moveEditPantryToFreezer = async () => {
    if (!editModal || editModal.storageType !== "pantry" || !fridgeId) return;
    setMoveProcessing(true);
    try {
      const body = buildItemBodyFromEdit(editModal);
      if (Number.isNaN(body.quantity) || body.quantity <= 0 || !body.name) {
        toast("이름·수량을 확인해주세요.");
        setMoveProcessing(false);
        return;
      }
      await deletePantryItemApi(editModal.itemId);
      await createFreezerItemApi(fridgeId, body);
      setEditModal(null);
      await loadPantry();
      await loadItems(fridgeId);
      await loadAllItems();
      toast("냉동실로 옮겼습니다.");
    } catch (e) {
      console.error(e);
      toast(e.message || "이동에 실패했습니다.");
    } finally {
      setMoveProcessing(false);
    }
  };

  const handleDeleteItem = async (itemId, override) => {
    if (!override && activeTab !== "pantry" && fridgeId == null) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    try {
      if (override) {
        const { fridgeId: fid, itemId: iid, storageType } = override;
        if (storageType === "fridge") {
          await deleteFridgeItemApi(fid, iid);
        } else if (storageType === "freezer") {
          await deleteFreezerItemApi(fid, iid);
        } else if (storageType === "pantry") {
          await deletePantryItemApi(iid);
        }
      } else if (activeTab === "fridge") {
        await deleteFridgeItemApi(fridgeId, itemId);
      } else if (activeTab === "freezer") {
        await deleteFreezerItemApi(fridgeId, itemId);
      } else if (activeTab === "pantry") {
        await deletePantryItemApi(itemId);
      }
      if (fridgeId != null) await loadItems(fridgeId);
      if (activeTab === "pantry" || override?.storageType === "pantry") await loadPantry();
      await loadAllItems();
      setBulkSelected((prev) => {
        const next = new Set(prev);
        if (override) {
          if (activeTab === "all") {
            const storageLabel =
              override.storageType === "fridge"
                ? "냉장실"
                : override.storageType === "freezer"
                  ? "냉동실"
                  : "상온보관";
            const fid = override.fridgeId != null ? String(override.fridgeId) : "x";
            next.delete(`all-${fid}-${storageLabel}-${override.itemId}`);
          } else {
            next.delete(String(override.itemId));
          }
        } else if (itemId != null) {
          next.delete(String(itemId));
        }
        return next;
      });
      toast("삭제했습니다.");
    } catch (error) {
      console.error("재료 삭제 에러:", error);
      toast(error.message || "재료 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    setBulkSelected(new Set());
  }, [activeTab]);

  const bulkKeyForRow = (item, allRow) => {
    if (activeTab === "all" && allRow) {
      return `all-${allRow.fridgeId ?? "x"}-${allRow.storageType}-${allRow.itemId ?? allRow.id}`;
    }
    return String(item.id);
  };

  const toggleBulkOne = (item, allRow) => {
    const k = bulkKeyForRow(item, allRow);
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (bulkSelected.size === 0) return;
    if (!window.confirm(`${bulkSelected.size}개 항목을 삭제할까요?`)) return;
    try {
      if (activeTab === "fridge") {
        for (const id of bulkSelected) {
          await deleteFridgeItemApi(fridgeId, id);
        }
        await loadItems(fridgeId);
      } else if (activeTab === "freezer") {
        for (const id of bulkSelected) {
          await deleteFreezerItemApi(fridgeId, id);
        }
        await loadItems(fridgeId);
      } else if (activeTab === "pantry") {
        for (const id of bulkSelected) {
          await deletePantryItemApi(id);
        }
        await loadPantry();
      } else if (activeTab === "all") {
        for (const key of bulkSelected) {
          const row = allItems.find(
            (r) => `all-${r.fridgeId ?? "x"}-${r.storageType}-${r.itemId ?? r.id}` === key,
          );
          if (!row) continue;
          if (row.storageType === "상온보관") {
            await deletePantryItemApi(row.itemId ?? row.id);
          } else if (row.storageType === "냉장실") {
            await deleteFridgeItemApi(row.fridgeId, row.itemId ?? row.id);
          } else {
            await deleteFreezerItemApi(row.fridgeId, row.itemId ?? row.id);
          }
        }
        if (fridgeId != null) await loadItems(fridgeId);
        await loadPantry();
      }
      await loadAllItems();
      setBulkSelected(new Set());
      toast("삭제했습니다.");
    } catch (error) {
      console.error(error);
      toast(error.message || "삭제에 실패했습니다.");
    }
  };

  const deleteAggregated = (row) => {
    if (row.storageType === "상온보관") {
      handleDeleteItem(null, {
        fridgeId: null,
        itemId: row.itemId ?? row.id,
        storageType: "pantry",
      });
      return;
    }
    handleDeleteItem(null, {
      fridgeId: row.fridgeId,
      itemId: row.itemId ?? row.id,
      storageType: row.storageType === "냉장실" ? "fridge" : "freezer",
    });
  };

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const uid = isLoggedIn() ? getUserIdFromToken() : null;
      const server = await getIngredientCatalogApi(catalogSearch, uid, catalogCategory);
      const extras = getGuestCatalogExtras().map((x, i) => ({
        id: `guest-extra-${i}-${x.name}`,
        name: x.name,
        defaultUnit: x.defaultUnit || "개",
        custom: true,
        category: "직접 추가",
      }));
      setCatalogRows([...(server || []), ...extras]);
    } catch (err) {
      console.error(err);
      toast(err.message || "카탈로그를 불러오지 못했습니다.");
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogSearch, catalogCategory, toast]);

  useEffect(() => {
    if (!catalogOpen) return;
    const t = setTimeout(() => {
      refreshCatalog();
    }, 200);
    return () => clearTimeout(t);
  }, [catalogOpen, catalogSearch, catalogCategory, refreshCatalog]);

  const visibleCatalogRows = useMemo(() => {
    if (catalogCategory === "전체") return catalogRows;
    return catalogRows.filter((r) => {
      if (catalogCategory === "직접 추가") return r.custom === true;
      const c = r.category || (r.custom ? "직접 추가" : "기타");
      if (catalogCategory === "기타") {
        return !r.custom && (!r.category || r.category === "기타");
      }
      return !r.custom && c === catalogCategory;
    });
  }, [catalogRows, catalogCategory]);

  const customCatalogNameDuplicate = useMemo(() => {
    const t = customCatalogName.trim();
    if (!t) return false;
    const lower = t.toLowerCase();
    return catalogRows.some((r) => (r.name || "").trim().toLowerCase() === lower);
  }, [customCatalogName, catalogRows]);

  const catalogSearchDuplicate = useMemo(() => {
    const t = catalogSearch.trim();
    if (!t) return false;
    const lower = t.toLowerCase();
    return catalogRows.some((r) => (r.name || "").trim().toLowerCase() === lower);
  }, [catalogSearch, catalogRows]);

  const toggleCatalogSelect = (row) => {
    const sk = catalogStableKey(row.name, row.defaultUnit || "개");
    setCatalogSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk);
      else next.add(sk);
      return next;
    });
  };

  const handleCatalogImageUpload = async (row, file) => {
    if (!file || !row?.name) return;
    if (!row.custom) {
      toast("직접 추가한 재료에만 사진을 등록할 수 있습니다.");
      return;
    }
    const name = row.name.trim();
    try {
      if (isLoggedIn()) {
        const uid = getUserIdFromToken();
        if (!uid) throw new Error("로그인이 필요합니다.");
        await uploadIngredientImageApi(uid, name, file);
        await refreshCatalog();
        window.dispatchEvent(new Event("yatang-ingredient-images-changed"));
        toast("재료 사진을 등록했습니다.");
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setGuestIngredientImage(name, reader.result);
          setGuestImageTick((t) => t + 1);
          window.dispatchEvent(new Event("yatang-guest-images-changed"));
          toast("이 기기에 재료 사진을 저장했습니다.");
        };
        reader.readAsDataURL(file);
      }
    } catch (e) {
      toast(e.message || "업로드에 실패했습니다.");
    }
  };

  const handleAddCustomCatalogName = async () => {
    const name = customCatalogName.trim();
    if (!name) {
      toast("추가할 재료 이름을 입력해주세요.");
      return;
    }
    if (customCatalogNameDuplicate) {
      return;
    }
    try {
      if (isLoggedIn()) {
        await postCustomIngredientCatalogApi(name, "개");
      } else {
        addGuestCatalogExtra(name, "개");
      }
      const sk = catalogStableKey(name, "개");
      setCatalogSelected((prev) => new Set(prev).add(sk));
      setCustomCatalogName("");
      await refreshCatalog();
    } catch (e) {
      toast(e.message || "추가에 실패했습니다.");
    }
  };

  const handleRemoveCustomCatalogRow = async (row) => {
    if (!row?.custom) return;
    const sk = catalogStableKey(row.name, row.defaultUnit || "개");
    try {
      if (isLoggedIn() && typeof row.id === "number") {
        await deleteCustomIngredientCatalogApi(row.id);
      } else {
        removeGuestCatalogExtra(row.name);
      }
      setCatalogSelected((prev) => {
        const next = new Set(prev);
        next.delete(sk);
        return next;
      });
      await refreshCatalog();
    } catch (e) {
      toast(e.message || "목록에서 제거하지 못했습니다.");
    }
  };

  /** 검색어에 맞는 항목이 없을 때 검색어 그대로 내 목록에 넣고 선택 */
  const handleQuickAddSearchAsIngredient = async () => {
    const name = catalogSearch.trim();
    if (!name) return;
    if (catalogSearchDuplicate) {
      toast("이미 목록에 있는 재료입니다.");
      return;
    }
    try {
      if (isLoggedIn()) {
        await postCustomIngredientCatalogApi(name, "개");
      } else {
        addGuestCatalogExtra(name, "개");
      }
      setCatalogSelected((prev) => new Set(prev).add(catalogStableKey(name, "개")));
      await refreshCatalog();
    } catch (e) {
      toast(e.message || "추가에 실패했습니다.");
    }
  };

  const handleCatalogAddSelected = async () => {
    const keys = [...catalogSelected];
    if (keys.length === 0) {
      toast("추가할 재료를 선택해주세요.");
      return;
    }

    if (catalogTargetStorage === "pantry") {
      setCatalogAdding(true);
      try {
        for (const key of keys) {
          const { name, unit } = parseCatalogStableKey(key);
          const payload = defaultPayload(name, unit);
          await createPantryItemApi(payload);
        }
        setCatalogSelected(new Set());
        setCatalogOpen(false);
        await loadPantry();
        await loadAllItems();
        toast("추가했습니다.");
      } catch (e) {
        console.error(e);
        toast(e.message || "재료를 추가하지 못했습니다.");
      } finally {
        setCatalogAdding(false);
      }
      return;
    }

    const targetFid = catalogTargetFridgeId ?? fridgeId;
    if (targetFid == null) {
      toast("냉장고를 선택해주세요.");
      return;
    }
    setCatalogAdding(true);
    try {
      for (const key of keys) {
        const { name, unit } = parseCatalogStableKey(key);
        const payload = defaultPayload(name, unit);
        if (catalogTargetStorage === "fridge") {
          await createFridgeItemApi(targetFid, payload);
        } else {
          await createFreezerItemApi(targetFid, payload);
        }
      }
      setCatalogSelected(new Set());
      setCatalogOpen(false);
      if (String(targetFid) === String(fridgeId)) {
        await loadItems(targetFid);
      }
      await loadAllItems();
      toast("추가했습니다.");
    } catch (e) {
      console.error(e);
      toast(e.message || "재료를 추가하지 못했습니다.");
    } finally {
      setCatalogAdding(false);
    }
  };

  const sortedFridgeItems = useMemo(() => sortItems(fridgeItems, sortKey), [fridgeItems, sortKey]);
  const sortedFreezerItems = useMemo(() => sortItems(freezerItems, sortKey), [freezerItems, sortKey]);
  const sortedPantryItems = useMemo(() => sortItems(pantryItems, sortKey), [pantryItems, sortKey]);
  const sortedAllItems = useMemo(() => sortItems(allItems, sortKey), [allItems, sortKey]);

  const ownedIngredientNameLowerSet = useMemo(() => {
    const s = new Set();
    const add = (name) => {
      const t = (name || "").trim().toLowerCase();
      if (t) s.add(t);
    };
    (pantryItems || []).forEach((it) => add(it.name));
    (fridgeItems || []).forEach((it) => add(it.name));
    (freezerItems || []).forEach((it) => add(it.name));
    (allItems || []).forEach((it) => add(it.name));
    return s;
  }, [pantryItems, fridgeItems, freezerItems, allItems]);

  const filteredAllItemsForAllTab = useMemo(() => {
    if (fridges.length <= 1 || showAllFridgesInAllTab) {
      return sortedAllItems;
    }
    const fid = fridgeId != null ? String(fridgeId) : null;
    return sortedAllItems.filter((row) => {
      if (row.storageType === "상온보관") return true;
      if (fid == null) return false;
      return String(row.fridgeId ?? "") === fid;
    });
  }, [sortedAllItems, showAllFridgesInAllTab, fridges.length, fridgeId]);

  const currentItems =
    activeTab === "fridge"
      ? sortedFridgeItems
      : activeTab === "freezer"
        ? sortedFreezerItems
        : activeTab === "pantry"
          ? sortedPantryItems
          : filteredAllItemsForAllTab;

  const renderIngredientListGlyph = (name) => {
    const trimmed = (name || "").trim();
    const lower = trimmed.toLowerCase();
    const imgUrl = userIngredientImageMap[lower];
    const iconFile = systemIconFileByNameLower[lower];
    return (
      <div className="ingredient-item-glyph-wrap" aria-hidden>
        <CatalogIngredientGlyph
          name={name}
          userImageUrl={imgUrl || undefined}
          iconImageFile={iconFile || undefined}
          className="ingredient-list-glyph"
        />
      </div>
    );
  };

  if (loading) {
    return <div className="ingredient-loading">재료 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className="ingredient-page-wrapper">
      <div className="ingredient-header">
        <button className="ingredient-back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
          뒤로가기
        </button>
        <div className="ingredient-header-text">
          <h1 className="ingredient-title">{userNickname}의 재료 관리</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
            {fridges.length > 1 ? (
              <select
                className="ingredient-select"
                style={{ padding: "6px 12px", fontSize: "0.9rem", width: "auto" }}
                value={fridgeId != null ? String(fridgeId) : ""}
                onChange={handleFridgeChange}
              >
                {fridges
                  .sort(
                    (a, b) =>
                      Number(b.isMain === true) - Number(a.isMain === true),
                  )
                  .map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))}
              </select>
            ) : (
              <div className="ingredient-fridge-line">
                <p className="ingredient-subtitle ingredient-fridge-name-only">{fridges[0]?.name}</p>
                {fridges[0]?.isMain === true && (
                  <span className="badge-main" title="메인 냉장고">
                    main
                  </span>
                )}
              </div>
            )}
            {fridges.length > 1 &&
              fridges.find((f) => String(f.id) === String(fridgeId))?.isMain === true && (
                <span className="badge-main" title="메인 냉장고">
                  main
                </span>
              )}
            {/*<button type="button" className="ingredient-catalog-open-button" onClick={openCatalog}>*/}
            {/*  <FiPlus size={16} /> 재료 추가*/}
            {/*</button>*/}
          </div>
        </div>
      </div>

      <div className="ingredient-tab-bar ingredient-tab-bar-four">
        <button
          className={`ingredient-tab-button ${activeTab === "fridge" ? "active" : ""}`}
          type="button"
          onClick={() => setTabAndPersistStorage("fridge")}
        >
          냉장실
        </button>
        <button
          className={`ingredient-tab-button ${activeTab === "freezer" ? "active" : ""}`}
          type="button"
          onClick={() => setTabAndPersistStorage("freezer")}
        >
          냉동실
        </button>
        <button
          className={`ingredient-tab-button ${activeTab === "pantry" ? "active" : ""}`}
          type="button"
          onClick={() => setTabAndPersistStorage("pantry")}
        >
          상온보관
        </button>
        <button
          className={`ingredient-tab-button ${activeTab === "all" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveTab("all")}
        >
          전체 보기
        </button>
      </div>

      {/*{bulkSelected.size > 0 && (*/}
      {/*  <div className="ingredient-bulk-bar">*/}
      {/*    <span className="ingredient-bulk-count">{bulkSelected.size}개 선택됨</span>*/}
      {/*    <button type="button" className="ingredient-bulk-delete" onClick={handleBulkDelete}>*/}
      {/*      선택 항목 삭제*/}
      {/*    </button>*/}
      {/*    <button type="button" className="ingredient-bulk-clear" onClick={() => setBulkSelected(new Set())}>*/}
      {/*      선택 해제*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*)}*/}

      <div className="ingredient-cards-grid">
        {activeTab !== "all" && (
          <div className="ingredient-card-base ingredient-form-card ingredient-add-primary-card">
            <h2 className="ingredient-card-title">재료 추가</h2>
            <p className="ingredient-add-lead">
              목록에서 재료를 고른 뒤 한 번에 담습니다. 수량·단위·소비기한은 재료를 추가한 뒤 목록에서 항목을 눌러 수정하면 됩니다.
            </p>
            <button
              type="button"
              className="ingredient-submit-button ingredient-add-main-button"
              onClick={openCatalog}
            >
              <FiPlus /> 재료 추가
            </button>
            <details className="ingredient-manual-details">
              <summary className="ingredient-manual-summary">직접 입력으로 추가하기 (수량·소비기한을 처음부터 등록)</summary>
              <form className="ingredient-manual-form-inner" onSubmit={handleAddItem}>
                <div className="ingredient-input-group">
                  <label>재료명</label>
                  <input
                    className="ingredient-input"
                    placeholder="예: 우유"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div className="ingredient-input-row">
                  <div className="ingredient-input-group">
                    <label>수량</label>
                    <input
                      className="ingredient-input"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="ingredient-input-group">
                    <label>단위</label>
                    <select
                      className="ingredient-select"
                      value={isPresetUnit(unit) ? unit : UNIT_CUSTOM}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === UNIT_CUSTOM) setUnit("");
                        else setUnit(v);
                      }}
                    >
                      {UNIT_PRESETS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      <option value={UNIT_CUSTOM}>직접입력</option>
                    </select>
                    {!isPresetUnit(unit) && (
                      <input
                        className="ingredient-input ingredient-unit-custom"
                        placeholder="단위 직접 입력"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <div className="ingredient-input-row">
                  <div className="ingredient-input-group">
                    <label>소비기한</label>
                    <input
                      className="ingredient-input"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>
                  <div className="ingredient-input-group">
                    <label>제조일자</label>
                    <input
                      className="ingredient-input"
                      type="date"
                      value={manufactureDate}
                      onChange={(e) => setManufactureDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="ingredient-input-group">
                  <label>메모</label>
                  <input
                    className="ingredient-input"
                    placeholder="보관 위치, 특이 사항 등을 기록하세요."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>
                <button className="ingredient-secondary-button ingredient-manual-submit" type="submit">
                  직접 입력으로 추가
                </button>
              </form>
            </details>
          </div>
        )}

        {activeTab === "all" && (
          <div className="ingredient-card-base ingredient-form-card ingredient-all-hint">
            <h2 className="ingredient-card-title">전체 보기</h2>
            <p className="ingredient-all-hint-text">
              기본으로는 위에서 고른 <strong>냉장고</strong>의 냉장·냉동 재료와, 사용자 공통인 <strong>상온보관</strong> 재료를
              한 목록으로 봅니다. 항목을 눌러 수량·소비기한을 수정할 수 있습니다.
              새 재료는 <strong>냉장실·냉동실·상온보관</strong> 탭에서 <strong>재료 추가</strong>를 이용해주세요.
            </p>
            {fridges.length > 1 && (
              <label className="ingredient-all-fridges-toggle">
                <input
                  type="checkbox"
                  checked={showAllFridgesInAllTab}
                  onChange={(e) => setShowAllFridgesInAllTab(e.target.checked)}
                />
                모든 냉장고 보기
              </label>
            )}
          </div>
        )}

        {bulkSelected.size > 0 && (
            <div className="ingredient-bulk-bar">
              <span className="ingredient-bulk-count">{bulkSelected.size}개 선택됨</span>
              <button type="button" className="ingredient-bulk-delete" onClick={handleBulkDelete}>
                선택 항목 삭제
              </button>
              <button type="button" className="ingredient-bulk-clear" onClick={() => setBulkSelected(new Set())}>
                선택 해제
              </button>
            </div>
        )}

        <div className="ingredient-card-base ingredient-list-card">
          <div className="ingredient-list-header">
            <div className="ingredient-list-header-left">
              <h2 className="ingredient-card-title">
                {activeTab === "fridge" && "현재 냉장실 재료"}
                {activeTab === "freezer" && "현재 냉동실 재료"}
                {activeTab === "pantry" && "상온보관 재료"}
                {activeTab === "all" && "전체 재료"}
              </h2>
              <span className="ingredient-chip">{currentItems.length}개</span>
            </div>
            <div className="ingredient-list-header-sort">
              {/*<label className="ingredient-sort-label" htmlFor="ingredient-sort-select">*/}
              {/*  정렬*/}
              {/*</label>*/}
              <select
                id="ingredient-sort-select"
                className="ingredient-sort-select ingredient-sort-select--compact"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                {ITEM_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {currentItems.length === 0 ? (
            <div className="ingredient-empty-state">등록된 재료가 없습니다.</div>
          ) : activeTab === "all" ? (
            <div className="ingredient-item-list">
              {currentItems.map((row) => (
                <div
                  className="ingredient-item ingredient-item-clickable ingredient-item-with-bulk"
                  key={`${row.storageType}-${row.itemId ?? row.id}-${row.fridgeId ?? "p"}`}
                >
                  <input
                    type="checkbox"
                    className="ingredient-item-checkbox"
                    checked={bulkSelected.has(bulkKeyForRow(row, row))}
                    onChange={() => toggleBulkOne(row, row)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="선택"
                  />
                  <button
                    type="button"
                    className="ingredient-item-main ingredient-item-main--with-glyph"
                    onClick={() => openEditFromAggregated(row)}
                  >
                    {renderIngredientListGlyph(row.name)}
                    <div className="ingredient-item-main-col">
                      <span className="ingredient-item-name">{row.name}</span>
                      <span className="ingredient-item-meta">
                        {row.quantity} {row.unit}
                        {row.expirationDate && (
                          <>
                            {" "}
                            · 소비기한 {row.expirationDate}
                            {row.daysUntilExpiration != null &&
                              ` (D${row.daysUntilExpiration >= 0 ? "-" : "+"}${Math.abs(row.daysUntilExpiration)})`}
                          </>
                        )}
                      </span>
                      <span className="ingredient-all-badges">
                        <span className="ingredient-badge-fridge">{row.fridgeName}</span>
                        <span
                          className={
                            row.storageType === "냉동실"
                              ? "ingredient-badge-storage freezer"
                              : row.storageType === "상온보관"
                                ? "ingredient-badge-storage pantry"
                                : "ingredient-badge-storage fridge"
                          }
                        >
                          {row.storageType}
                        </span>
                      </span>
                      {row.memo && <span className="ingredient-item-memo">{row.memo}</span>}
                      {row.createdAt && (
                        <span className="ingredient-item-registered">등록 {formatRegisteredAt(row.createdAt)}</span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="ingredient-delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAggregated(row);
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="ingredient-item-list">
              {currentItems.map((item) => (
                <div className="ingredient-item ingredient-item-clickable ingredient-item-with-bulk" key={item.id}>
                  <input
                    type="checkbox"
                    className="ingredient-item-checkbox"
                    checked={bulkSelected.has(bulkKeyForRow(item, null))}
                    onChange={() => toggleBulkOne(item, null)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="선택"
                  />
                  <button
                    type="button"
                    className="ingredient-item-main ingredient-item-main--with-glyph"
                    onClick={() =>
                      openEditFromFridgeItem(
                        item,
                        activeTab === "fridge" ? "fridge" : activeTab === "freezer" ? "freezer" : "pantry",
                      )
                    }
                  >
                    {renderIngredientListGlyph(item.name)}
                    <div className="ingredient-item-main-col">
                      <span className="ingredient-item-name">{item.name}</span>
                      <span className="ingredient-item-meta">
                        {item.quantity} {item.unit}
                        {item.expirationDate && (
                          <>
                            {" "}
                            · 소비기한 {item.expirationDate}
                            {item.daysUntilExpiration != null &&
                              ` (D${item.daysUntilExpiration >= 0 ? "-" : "+"}${Math.abs(item.daysUntilExpiration)})`}
                          </>
                        )}
                      </span>
                      {item.memo && <span className="ingredient-item-memo">{item.memo}</span>}
                      {item.createdAt && (
                        <span className="ingredient-item-registered">등록 {formatRegisteredAt(item.createdAt)}</span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="ingredient-delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ingredient-footer-actions">
        <button className="ingredient-secondary-button" onClick={() => navigate("/refrigerator")}>
          냉장고로 돌아가기
        </button>
      </div>

      {duplicateDecision && (
        <div className="ingredient-duplicate-modal-overlay" role="dialog" aria-modal="true">
          <div className="ingredient-duplicate-modal">
            <div className="ingredient-duplicate-modal-title">중복 아이템 발견</div>
            <div className="ingredient-duplicate-modal-body">
              기존에 있는{" "}
              <span className="ingredient-duplicate-existing-name">{duplicateDecision.existingItem.name}</span>(
              {duplicateDecision.existingItem.unit})에 추가하시겠습니까?
            </div>
            <div className="ingredient-duplicate-modal-actions">
              <button
                className="ingredient-modal-button ingredient-modal-button-primary"
                onClick={handleDuplicateConfirmAddQuantity}
                disabled={duplicateProcessing}
              >
                확인
              </button>
              <button
                className="ingredient-modal-button"
                onClick={handleDuplicateConfirmAddNewItem}
                disabled={duplicateProcessing}
              >
                새로 추가
              </button>
              <button className="ingredient-modal-button" onClick={handleDuplicateCancel} disabled={duplicateProcessing}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {catalogOpen && (
        <div className="ingredient-duplicate-modal-overlay" role="dialog" aria-modal="true">
          <div className="ingredient-catalog-modal">
            <div className="ingredient-catalog-modal-header">
              <div className="ingredient-catalog-modal-title">재료 추가</div>
              <button
                type="button"
                className="ingredient-modal-close-x"
                aria-label="닫기"
                onClick={() => setCatalogOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <p className="ingredient-catalog-hint">
              보관 위치는 <strong>냉장실</strong>이 기본입니다. 냉장·냉동·상온을 고른 뒤 목록에서 선택하세요. 상온보관은
              냉장고와 무관한 한 곳에 모입니다.
            </p>
            <div className="ingredient-catalog-category-row">
              {INGREDIENT_CATALOG_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`ingredient-catalog-category-chip ${catalogCategory === c ? "active" : ""}`}
                  onClick={() => setCatalogCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="ingredient-catalog-target-row">
              <label>
                냉장고
                <select
                  className="ingredient-select"
                  disabled={catalogTargetStorage === "pantry"}
                  value={catalogTargetFridgeId != null ? String(catalogTargetFridgeId) : ""}
                  onChange={(e) => setCatalogTargetFridgeId(e.target.value)}
                  title={
                    catalogTargetStorage === "pantry"
                      ? "상온보관 추가 시 냉장고 선택은 적용되지 않습니다."
                      : undefined
                  }
                >
                  {fridges.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="ingredient-catalog-storage-toggle">
                <label>
                  <input
                    type="radio"
                    name="catalogStorage"
                    checked={catalogTargetStorage === "fridge"}
                    onChange={() => {
                      setCatalogTargetStorage("fridge");
                      localStorage.setItem(LS_CATALOG_STORAGE, "fridge");
                    }}
                  />
                  냉장실
                </label>
                <label>
                  <input
                    type="radio"
                    name="catalogStorage"
                    checked={catalogTargetStorage === "freezer"}
                    onChange={() => {
                      setCatalogTargetStorage("freezer");
                      localStorage.setItem(LS_CATALOG_STORAGE, "freezer");
                    }}
                  />
                  냉동실
                </label>
                <label>
                  <input
                    type="radio"
                    name="catalogStorage"
                    checked={catalogTargetStorage === "pantry"}
                    onChange={() => {
                      setCatalogTargetStorage("pantry");
                      localStorage.setItem(LS_CATALOG_STORAGE, "pantry");
                    }}
                  />
                  상온보관
                </label>
              </div>
            </div>
            <input
              className="ingredient-input ingredient-catalog-search"
              placeholder="검색 (예: 단호박)"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
            {catalogSearch.trim() && (
              <button
                type="button"
                className="ingredient-search-quick-add"
                onClick={handleQuickAddSearchAsIngredient}
                disabled={catalogSearchDuplicate}
              >
                {catalogSearchDuplicate
                  ? "이미 목록에 있는 재료입니다."
                  : `「${catalogSearch.trim()}」을(를) 내 목록에 넣고 선택`}
              </button>
            )}
            <div className="ingredient-catalog-list">
              {catalogLoading ? (
                <div className="ingredient-catalog-loading">불러오는 중…</div>
              ) : visibleCatalogRows.length === 0 ? (
                <div className="ingredient-catalog-empty">
                  {catalogSearch.trim() ? (
                    <p>목록에 없습니다. 위의 「{catalogSearch.trim()}」버튼으로 내 재료 목록에 넣고 선택할 수 있습니다.</p>
                  ) : (
                    <p>검색어를 입력해 보세요.</p>
                  )}
                </div>
              ) : (
                (() => {
                  const guestIngredientImageMap = getGuestIngredientImageMap();
                  return visibleCatalogRows.map((row) => {
                  const sk = catalogStableKey(row.name, row.defaultUnit || "개");
                  const catLabel = row.custom ? "직접 추가" : row.category || "기타";
                  const rowKey = row.id != null ? String(row.id) : sk;
                  const ownedHere = ownedIngredientNameLowerSet.has((row.name || "").trim().toLowerCase());
                  return (
                    <div key={rowKey} className="ingredient-catalog-row">
                      <div className="ingredient-catalog-glyph-wrap" aria-hidden>
                        <CatalogIngredientGlyph
                          name={row.name}
                          category={row.category}
                          custom={row.custom}
                          iconImageFile={row.custom ? undefined : row.iconImageFile}
                          userImageUrl={
                            row.custom
                              ? row.userImageUrl ||
                                guestIngredientImageMap[row.name.trim().toLowerCase()]
                              : undefined
                          }
                        />
                      </div>
                      {row.custom && (
                        <button
                          type="button"
                          className="ingredient-catalog-photo-chip"
                          title="이 재료 사진 등록 (직접 추가한 재료만)"
                          onClick={(e) => {
                            e.preventDefault();
                            const input = e.currentTarget.querySelector("input[type=file]");
                            input?.click();
                          }}
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            tabIndex={-1}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (f) handleCatalogImageUpload(row, f);
                            }}
                          />
                          사진
                        </button>
                      )}
                      <label className="ingredient-catalog-row-label">
                        <input
                          type="checkbox"
                          checked={catalogSelected.has(sk)}
                          onChange={() => toggleCatalogSelect(row)}
                        />
                        <span className="ingredient-catalog-cat">{catLabel}</span>
                        <span className="ingredient-catalog-name">{row.name}</span>
                        <span className="ingredient-catalog-unit">({row.defaultUnit || "개"})</span>
                        {ownedHere && (
                          <span
                            className="ingredient-catalog-owned-badge"
                            title="이미 재고에 있습니다. 그래도 추가할 수 있습니다."
                          >
                            보유 중
                          </span>
                        )}
                        {row.custom && <span className="ingredient-catalog-custom">내 목록</span>}
                      </label>
                      {row.custom && (
                        <button
                          type="button"
                          className="ingredient-catalog-remove-x"
                          aria-label="내 목록에서 제거"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveCustomCatalogRow(row);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                });
                })()
              )}
            </div>
            <div className="ingredient-catalog-custom-block">
              <div className="ingredient-catalog-custom-row">
                <input
                  className="ingredient-input"
                  placeholder="목록에 없으면 직접 추가 (이름)"
                  value={customCatalogName}
                  onChange={(e) => setCustomCatalogName(e.target.value)}
                />
                <button
                  type="button"
                  className="ingredient-catalog-add-name-button"
                  onClick={handleAddCustomCatalogName}
                  disabled={customCatalogNameDuplicate}
                >
                  내 목록에 추가
                </button>
              </div>
              {customCatalogNameDuplicate && (
                <p className="ingredient-catalog-duplicate-hint">이미 목록에 있는 재료입니다.</p>
              )}
            </div>
            <div className="ingredient-catalog-modal-actions">
              <span className="ingredient-catalog-selected-count">선택 {catalogSelected.size}개</span>
              <button type="button" className="ingredient-modal-button" onClick={() => setCatalogOpen(false)}>
                닫기
              </button>
              <button
                type="button"
                className="ingredient-modal-button ingredient-modal-button-primary"
                onClick={handleCatalogAddSelected}
                disabled={catalogAdding}
              >
                선택 항목 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="ingredient-duplicate-modal-overlay" role="dialog" aria-modal="true">
          <div className="ingredient-edit-modal">
            <div className="ingredient-edit-modal-header">
              <div className="ingredient-duplicate-modal-title">재료 수정</div>
              <button
                type="button"
                className="ingredient-modal-close-x"
                aria-label="닫기"
                onClick={() => setEditModal(null)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="ingredient-edit-fields">
              <label>
                등록일
                <input
                  className="ingredient-input ingredient-input-readonly"
                  readOnly
                  value={formatRegisteredAt(editModal.createdAt)}
                />
              </label>
              <label>
                이름
                <input
                  className="ingredient-input"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                />
              </label>
              <div className="ingredient-input-row">
                <label>
                  수량
                  <input
                    className="ingredient-input"
                    type="number"
                    min="1"
                    value={editModal.quantity}
                    onChange={(e) => setEditModal({ ...editModal, quantity: e.target.value })}
                  />
                </label>
                <label>
                  단위
                  <select
                    className="ingredient-select"
                    value={isPresetUnit(editModal.unit) ? editModal.unit : UNIT_CUSTOM}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === UNIT_CUSTOM) setEditModal({ ...editModal, unit: "" });
                      else setEditModal({ ...editModal, unit: v });
                    }}
                  >
                    {UNIT_PRESETS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value={UNIT_CUSTOM}>직접입력</option>
                  </select>
                  {!isPresetUnit(editModal.unit) && (
                    <input
                      className="ingredient-input ingredient-unit-custom"
                      placeholder="단위 직접 입력"
                      value={editModal.unit}
                      onChange={(e) => setEditModal({ ...editModal, unit: e.target.value })}
                    />
                  )}
                </label>
              </div>
              <div className="ingredient-input-row">
                <label>
                  소비기한
                  <input
                    className="ingredient-input"
                    type="date"
                    value={editModal.expirationDate}
                    onChange={(e) => setEditModal({ ...editModal, expirationDate: e.target.value })}
                  />
                </label>
                <label>
                  제조일자
                  <input
                    className="ingredient-input"
                    type="date"
                    value={editModal.manufactureDate}
                    onChange={(e) => setEditModal({ ...editModal, manufactureDate: e.target.value })}
                  />
                </label>
              </div>
              <label>
                메모
                <input
                  className="ingredient-input"
                  value={editModal.memo}
                  onChange={(e) => setEditModal({ ...editModal, memo: e.target.value })}
                />
              </label>
            </div>
            <div className="ingredient-edit-move-row">
              {editModal.storageType === "fridge" && (
                <>
                  <button
                    type="button"
                    className="ingredient-move-storage-button"
                    onClick={moveEditBetweenFridgeFreezer}
                    disabled={editSaving || moveProcessing}
                  >
                    냉동실로 이동
                  </button>
                  <button
                    type="button"
                    className="ingredient-move-storage-button"
                    onClick={moveEditFridgeOrFreezerToPantry}
                    disabled={editSaving || moveProcessing}
                  >
                    상온보관으로 이동
                  </button>
                </>
              )}
              {editModal.storageType === "freezer" && (
                <>
                  <button
                    type="button"
                    className="ingredient-move-storage-button"
                    onClick={moveEditBetweenFridgeFreezer}
                    disabled={editSaving || moveProcessing}
                  >
                    냉장실로 이동
                  </button>
                  <button
                    type="button"
                    className="ingredient-move-storage-button"
                    onClick={moveEditFridgeOrFreezerToPantry}
                    disabled={editSaving || moveProcessing}
                  >
                    상온보관으로 이동
                  </button>
                </>
              )}
              {editModal.storageType === "pantry" && fridgeId != null && (
                <>
                  <button
                    type="button"
                    className="ingredient-move-storage-button"
                    onClick={moveEditPantryToFridge}
                    disabled={editSaving || moveProcessing}
                  >
                    냉장실로 이동
                  </button>
                  <button
                    type="button"
                    className="ingredient-move-storage-button"
                    onClick={moveEditPantryToFreezer}
                    disabled={editSaving || moveProcessing}
                  >
                    냉동실로 이동
                  </button>
                </>
              )}
            </div>
            <div className="ingredient-catalog-modal-actions">
              <button type="button" className="ingredient-modal-button" onClick={() => setEditModal(null)}>
                취소
              </button>
              <button
                type="button"
                className="ingredient-modal-button ingredient-modal-button-primary"
                onClick={saveEditModal}
                disabled={editSaving || moveProcessing}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredient;
