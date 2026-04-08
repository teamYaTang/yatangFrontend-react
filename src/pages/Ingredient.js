import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Ingredient.css";
import { FiPlus, FiTrash2, FiArrowLeft } from "react-icons/fi";

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
} from "../api/refrigerator";
import { getIngredientCatalogApi, postCustomIngredientCatalogApi } from "../api/ingredientCatalog";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { getGuestCatalogExtras, addGuestCatalogExtra } from "../utils/storage";

const UNIT_PRESETS = ["개", "팩", "병", "봉지", "캔", "g", "kg", "ml", "L"];
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

  const [userNickname, setUserNickname] = useState("");
  const [fridges, setFridges] = useState([]);
  const [fridgeId, setFridgeId] = useState(null);

  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [allItems, setAllItems] = useState([]);

  const [activeTab, setActiveTab] = useState("fridge");

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
  const [customCatalogName, setCustomCatalogName] = useState("");
  const [catalogAdding, setCatalogAdding] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [moveProcessing, setMoveProcessing] = useState(false);

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
        await loadAllItems();
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate, location.state, loadAllItems]);

  useEffect(() => {
    if (activeTab === "all") {
      loadAllItems();
    }
  }, [activeTab, loadAllItems]);

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
      alert("재료 추가는 '냉장실' 또는 '냉동실' 탭에서 해주세요.");
      return;
    }
    if (!itemName || !quantity) {
      alert("재료명과 수량을 입력해주세요.");
      return;
    }
    const unitTrim = (unit || "").trim();
    if (!unitTrim) {
      alert("단위를 입력하거나 선택해주세요.");
      return;
    }
    if (fridgeId == null) return;

    const requestedQty = parseInt(quantity, 10);
    if (Number.isNaN(requestedQty) || requestedQty <= 0) {
      alert("수량은 1 이상의 숫자여야 합니다.");
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

    const itemsInThisTab = activeTab === "fridge" ? fridgeItems : freezerItems;
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
      } else {
        await createFreezerItemApi(fridgeId, payload);
      }
      await loadItems(fridgeId);
      await loadAllItems();
      resetItemForm();
    } catch (error) {
      console.error("재료 추가 에러:", error);
      alert(error.message || "재료 추가에 실패했습니다.");
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
      } else {
        await updateFreezerItemApi(fridgeId, existingItem.id, { quantity: nextQuantity });
      }
      await loadItems(fridgeId);
      await loadAllItems();
      resetItemForm();
      setDuplicateDecision(null);
    } catch (error) {
      console.error("중복 아이템 처리 에러:", error);
      alert(error.message || "기존 아이템에 수량 추가에 실패했습니다.");
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
      } else {
        await createFreezerItemApi(fridgeId, payload);
      }
      await loadItems(fridgeId);
      await loadAllItems();
      resetItemForm();
      setDuplicateDecision(null);
    } catch (error) {
      console.error("중복 아이템 새로 등록 에러:", error);
      alert(error.message || "새 아이템 등록에 실패했습니다.");
    } finally {
      setDuplicateProcessing(false);
    }
  };

  const handleDuplicateCancel = () => {
    setDuplicateDecision(null);
  };

  const openEditFromFridgeItem = (item, storage) => {
    setEditModal({
      fridgeId,
      itemId: item.id,
      storageType: storage,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expirationDate || "",
      manufactureDate: item.manufactureDate || "",
      memo: item.memo || "",
    });
  };

  const openEditFromAggregated = (row) => {
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
        alert("수량은 1 이상이어야 합니다.");
        setEditSaving(false);
        return;
      }
      if (!body.name) {
        alert("이름을 입력해주세요.");
        setEditSaving(false);
        return;
      }
      if (editModal.storageType === "fridge") {
        await updateFridgeItemApi(editModal.fridgeId, editModal.itemId, body);
      } else {
        await updateFreezerItemApi(editModal.fridgeId, editModal.itemId, body);
      }
      setEditModal(null);
      if (fridgeId != null) await loadItems(fridgeId);
      await loadAllItems();
    } catch (error) {
      console.error(error);
      alert(error.message || "저장에 실패했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  const moveEditItemToOtherStorage = async () => {
    if (!editModal) return;
    setMoveProcessing(true);
    try {
      const body = buildItemBodyFromEdit(editModal);
      if (Number.isNaN(body.quantity) || body.quantity <= 0 || !body.name) {
        alert("이름·수량을 확인해주세요.");
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
    } catch (e) {
      console.error(e);
      alert(e.message || "이동에 실패했습니다.");
    } finally {
      setMoveProcessing(false);
    }
  };

  const handleDeleteItem = async (itemId, override) => {
    if (!override && fridgeId == null) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    try {
      if (override) {
        const { fridgeId: fid, itemId: iid, storageType } = override;
        if (storageType === "fridge") {
          await deleteFridgeItemApi(fid, iid);
        } else {
          await deleteFreezerItemApi(fid, iid);
        }
      } else if (activeTab === "fridge") {
        await deleteFridgeItemApi(fridgeId, itemId);
      } else {
        await deleteFreezerItemApi(fridgeId, itemId);
      }
      if (fridgeId != null) await loadItems(fridgeId);
      await loadAllItems();
    } catch (error) {
      console.error("재료 삭제 에러:", error);
      alert(error.message || "재료 삭제에 실패했습니다.");
    }
  };

  const deleteAggregated = (row) => {
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
      const server = await getIngredientCatalogApi(catalogSearch, uid);
      const extras = getGuestCatalogExtras().map((x, i) => ({
        id: `guest-extra-${i}-${x.name}`,
        name: x.name,
        defaultUnit: x.defaultUnit || "개",
        custom: true,
      }));
      setCatalogRows([...(server || []), ...extras]);
    } catch (err) {
      console.error(err);
      alert(err.message || "카탈로그를 불러오지 못했습니다.");
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogSearch]);

  useEffect(() => {
    if (!catalogOpen) return;
    const t = setTimeout(() => {
      refreshCatalog();
    }, 200);
    return () => clearTimeout(t);
  }, [catalogOpen, catalogSearch, refreshCatalog]);

  const toggleCatalogSelect = (row) => {
    const sk = catalogStableKey(row.name, row.defaultUnit || "개");
    setCatalogSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk);
      else next.add(sk);
      return next;
    });
  };

  const handleAddCustomCatalogName = async () => {
    const name = customCatalogName.trim();
    if (!name) {
      alert("추가할 재료 이름을 입력해주세요.");
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
      alert(e.message || "추가에 실패했습니다.");
    }
  };

  /** 검색어에 맞는 항목이 없을 때 검색어 그대로 내 목록에 넣고 선택 */
  const handleQuickAddSearchAsIngredient = async () => {
    const name = catalogSearch.trim();
    if (!name) return;
    try {
      if (isLoggedIn()) {
        await postCustomIngredientCatalogApi(name, "개");
      } else {
        addGuestCatalogExtra(name, "개");
      }
      setCatalogSelected((prev) => new Set(prev).add(catalogStableKey(name, "개")));
      await refreshCatalog();
    } catch (e) {
      alert(e.message || "추가에 실패했습니다.");
    }
  };

  const handleCatalogAddSelected = async () => {
    const targetFid = catalogTargetFridgeId ?? fridgeId;
    if (targetFid == null) {
      alert("냉장고를 선택해주세요.");
      return;
    }
    const keys = [...catalogSelected];
    if (keys.length === 0) {
      alert("추가할 재료를 선택해주세요.");
      return;
    }
    setCatalogAdding(true);
    try {
      const fridgeItemsNow = await getFridgeItemsApi(targetFid);
      const freezerItemsNow = await getFreezerItemsApi(targetFid);
      let compartment = catalogTargetStorage === "fridge" ? fridgeItemsNow : freezerItemsNow;

      for (const key of keys) {
        const { name, unit } = parseCatalogStableKey(key);
        const payload = defaultPayload(name, unit);
        const dup = compartment.some(
          (it) => it.name?.trim() === payload.name && it.unit === payload.unit,
        );
        if (dup) continue;
        if (catalogTargetStorage === "fridge") {
          await createFridgeItemApi(targetFid, payload);
        } else {
          await createFreezerItemApi(targetFid, payload);
        }
        compartment = [...compartment, { name: payload.name, unit: payload.unit }];
      }
      setCatalogSelected(new Set());
      setCatalogOpen(false);
      if (String(targetFid) === String(fridgeId)) {
        await loadItems(targetFid);
      }
      await loadAllItems();
    } catch (e) {
      console.error(e);
      alert(e.message || "재료를 추가하지 못했습니다.");
    } finally {
      setCatalogAdding(false);
    }
  };

  if (loading) {
    return <div className="ingredient-loading">재료 정보를 불러오는 중입니다...</div>;
  }

  const currentItems =
    activeTab === "fridge" ? fridgeItems : activeTab === "freezer" ? freezerItems : allItems;

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
            <button type="button" className="ingredient-catalog-open-button" onClick={() => setCatalogOpen(true)}>
              <FiPlus size={16} /> 재료 추가
            </button>
          </div>
        </div>
      </div>

      <div className="ingredient-tab-bar ingredient-tab-bar-three">
        <button
          className={`ingredient-tab-button ${activeTab === "fridge" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveTab("fridge")}
        >
          냉장실
        </button>
        <button
          className={`ingredient-tab-button ${activeTab === "freezer" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveTab("freezer")}
        >
          냉동실
        </button>
        <button
          className={`ingredient-tab-button ${activeTab === "all" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveTab("all")}
        >
          전체 보기
        </button>
      </div>

      <div className="ingredient-cards-grid">
        {activeTab !== "all" && (
          <div className="ingredient-card-base ingredient-form-card ingredient-add-primary-card">
            <h2 className="ingredient-card-title">재료 추가</h2>
            <p className="ingredient-add-lead">
              목록에서 재료를 고른 뒤 한 번에 담습니다. 수량·단위·유통기한은 추가한 다음 목록에서 항목을 눌러 수정하면 됩니다.
            </p>
            <button
              type="button"
              className="ingredient-submit-button ingredient-add-main-button"
              onClick={() => setCatalogOpen(true)}
            >
              <FiPlus /> 재료 추가
            </button>
            <details className="ingredient-manual-details">
              <summary className="ingredient-manual-summary">직접 입력으로 추가하기 (수량·유통기한을 처음부터 넣을 때)</summary>
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
                    <label>유통기한</label>
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
              모든 냉장고의 냉장실·냉동실 재료를 한 목록으로 봅니다. 항목을 눌러 수량·유통기한을 수정할 수 있습니다.
              새 재료는 <strong>냉장실/냉동실</strong> 탭에서 <strong>재료 추가</strong>를 이용해주세요.
            </p>
          </div>
        )}

        <div className="ingredient-card-base ingredient-list-card">
          <div className="ingredient-list-header">
            <h2 className="ingredient-card-title">
              {activeTab === "fridge" && "현재 냉장실 재료"}
              {activeTab === "freezer" && "현재 냉동실 재료"}
              {activeTab === "all" && "전체 재료"}
            </h2>
            <span className="ingredient-chip">{currentItems.length}개</span>
          </div>
          {currentItems.length === 0 ? (
            <div className="ingredient-empty-state">등록된 재료가 없습니다.</div>
          ) : activeTab === "all" ? (
            <div className="ingredient-item-list">
              {allItems.map((row) => (
                <div className="ingredient-item ingredient-item-clickable" key={`${row.fridgeId}-${row.storageType}-${row.itemId ?? row.id}`}>
                  <button
                    type="button"
                    className="ingredient-item-main"
                    onClick={() => openEditFromAggregated(row)}
                  >
                    <span className="ingredient-item-name">{row.name}</span>
                    <span className="ingredient-item-meta">
                      {row.quantity} {row.unit}
                      {row.expirationDate && (
                        <>
                          {" "}
                          · 유통기한 {row.expirationDate}
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
                            : "ingredient-badge-storage fridge"
                        }
                      >
                        {row.storageType}
                      </span>
                    </span>
                    {row.memo && <span className="ingredient-item-memo">{row.memo}</span>}
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
                <div className="ingredient-item ingredient-item-clickable" key={item.id}>
                  <button
                    type="button"
                    className="ingredient-item-main"
                    onClick={() => openEditFromFridgeItem(item, activeTab === "fridge" ? "fridge" : "freezer")}
                  >
                    <span className="ingredient-item-name">{item.name}</span>
                    <span className="ingredient-item-meta">
                      {item.quantity} {item.unit}
                      {item.expirationDate && (
                        <>
                          {" "}
                          · 유통기한 {item.expirationDate}
                          {item.daysUntilExpiration != null &&
                            ` (D${item.daysUntilExpiration >= 0 ? "-" : "+"}${Math.abs(item.daysUntilExpiration)})`}
                        </>
                      )}
                    </span>
                    {item.memo && <span className="ingredient-item-memo">{item.memo}</span>}
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
            <div className="ingredient-catalog-modal-title">재료 추가</div>
            <p className="ingredient-catalog-hint">
              냉장고와 냉장/냉동을 고른 뒤 목록에서 선택하세요. 검색해도 선택은 유지됩니다. 추가 후 목록에서 수량·유통기한을 수정할 수 있습니다.
            </p>
            <div className="ingredient-catalog-target-row">
              <label>
                냉장고
                <select
                  className="ingredient-select"
                  value={catalogTargetFridgeId != null ? String(catalogTargetFridgeId) : ""}
                  onChange={(e) => setCatalogTargetFridgeId(e.target.value)}
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
                    onChange={() => setCatalogTargetStorage("fridge")}
                  />
                  냉장실
                </label>
                <label>
                  <input
                    type="radio"
                    name="catalogStorage"
                    checked={catalogTargetStorage === "freezer"}
                    onChange={() => setCatalogTargetStorage("freezer")}
                  />
                  냉동실
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
              >
                「{catalogSearch.trim()}」을(를) 내 목록에 넣고 선택
              </button>
            )}
            <div className="ingredient-catalog-list">
              {catalogLoading ? (
                <div className="ingredient-catalog-loading">불러오는 중…</div>
              ) : catalogRows.length === 0 ? (
                <div className="ingredient-catalog-empty">
                  {catalogSearch.trim() ? (
                    <p>목록에 없습니다. 위의 「{catalogSearch.trim()}」버튼으로 내 재료 목록에 넣고 선택할 수 있습니다.</p>
                  ) : (
                    <p>검색어를 입력해 보세요.</p>
                  )}
                </div>
              ) : (
                catalogRows.map((row) => {
                  const sk = catalogStableKey(row.name, row.defaultUnit || "개");
                  return (
                    <label key={sk} className="ingredient-catalog-row">
                      <input
                        type="checkbox"
                        checked={catalogSelected.has(sk)}
                        onChange={() => toggleCatalogSelect(row)}
                      />
                      <span className="ingredient-catalog-name">{row.name}</span>
                      <span className="ingredient-catalog-unit">({row.defaultUnit || "개"})</span>
                      {row.custom && <span className="ingredient-catalog-custom">내 목록</span>}
                    </label>
                  );
                })
              )}
            </div>
            <div className="ingredient-catalog-custom-row">
              <input
                className="ingredient-input"
                placeholder="목록에 없으면 직접 추가 (이름)"
                value={customCatalogName}
                onChange={(e) => setCustomCatalogName(e.target.value)}
              />
              <button type="button" className="ingredient-catalog-add-name-button" onClick={handleAddCustomCatalogName}>
                내 목록에 추가
              </button>
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
            <div className="ingredient-duplicate-modal-title">재료 수정</div>
            <div className="ingredient-edit-fields">
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
                  유통기한
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
              {editModal.storageType === "fridge" ? (
                <button
                  type="button"
                  className="ingredient-move-storage-button"
                  onClick={moveEditItemToOtherStorage}
                  disabled={editSaving || moveProcessing}
                >
                  냉동실로 이동
                </button>
              ) : (
                <button
                  type="button"
                  className="ingredient-move-storage-button"
                  onClick={moveEditItemToOtherStorage}
                  disabled={editSaving || moveProcessing}
                >
                  냉장실로 이동
                </button>
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
