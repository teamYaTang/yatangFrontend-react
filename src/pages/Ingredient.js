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
} from "../api/refrigerator";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken } from "../utils/jwt";

const Ingredient = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userNickname, setUserNickname] = useState("");
  const [fridges, setFridges] = useState([]);
  const [fridgeId, setFridgeId] = useState(null);

  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);

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

  const loadItems = async (targetFridgeId) => {
    const [fridgeData, freezerData] = await Promise.all([
      getFridgeItemsApi(targetFridgeId),
      getFreezerItemsApi(targetFridgeId),
    ]);
    setFridgeItems(fridgeData ?? []);
    setFreezerItems(freezerData ?? []);
  };

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const userId = getUserIdFromToken();
        if (!userId) {
          navigate("/");
          return;
        }

        const profile = await getUserProfile(userId);
        setUserNickname(profile.nickname || profile.username || "");

        const userFridges = await getUserFridgesApi();
        setFridges(userFridges);

        let initialFridgeId = location.state?.selectedFridgeId;
        let selectedFridge = userFridges.find(f => f.id === initialFridgeId);

        if (!selectedFridge) {
          selectedFridge = userFridges.find(f => f.isMain) || userFridges[0];
          initialFridgeId = selectedFridge?.id;
        }

        setFridgeId(initialFridgeId);
        if (initialFridgeId) {
          await loadItems(initialFridgeId);
        }
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleFridgeChange = async (e) => {
    const selectedId = Number(e.target.value);
    setFridgeId(selectedId);
    setLoading(true);
    await loadItems(selectedId);
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
    if (!itemName || !quantity) {
      alert("재료명과 수량을 입력해주세요.");
      return;
    }
    if (!fridgeId) return;

    const requestedQty = parseInt(quantity, 10);
    if (Number.isNaN(requestedQty) || requestedQty <= 0) {
      alert("수량은 1 이상의 숫자여야 합니다.");
      return;
    }

    const payload = {
      name: itemName.trim(),
      quantity: requestedQty,
      unit,
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

  const handleDeleteItem = async (itemId) => {
    if (!fridgeId) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    try {
      if (activeTab === "fridge") {
        await deleteFridgeItemApi(fridgeId, itemId);
      } else {
        await deleteFreezerItemApi(fridgeId, itemId);
      }
      await loadItems(fridgeId);
    } catch (error) {
      console.error("재료 삭제 에러:", error);
      alert(error.message || "재료 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="ingredient-loading">재료 정보를 불러오는 중입니다...</div>;
  }

  const currentItems = activeTab === "fridge" ? fridgeItems : freezerItems;

  return (
    <div className="ingredient-page-wrapper">
      <div className="ingredient-header">
        <button className="ingredient-back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
          뒤로가기
        </button>
        <div className="ingredient-header-text">
          <h1 className="ingredient-title">{userNickname}의 재료 관리</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            {fridges.length > 1 ? (
              <select
                className="ingredient-select"
                style={{ padding: '6px 12px', fontSize: '0.9rem', width: 'auto' }}
                value={fridgeId || ""}
                onChange={handleFridgeChange}
              >
                {fridges.sort(
                    (a, b) =>
                      Number(b.isMain === true) -
                      Number(a.isMain === true)
                )
                    .map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
              </select>
            ) : (
              <div className="ingredient-fridge-line">
                <p className="ingredient-subtitle ingredient-fridge-name-only">
                  {fridges[0]?.name}
                </p>
                {fridges[0]?.isMain === true && (
                  <span className="badge-main" title="메인 냉장고">main</span>
                )}
              </div>
            )}
            {fridges.length > 1 &&
              fridges.find((f) => f.id === fridgeId)?.isMain === true && (
                <span className="badge-main" title="메인 냉장고">main</span>
              )}
          </div>
        </div>
      </div>

      <div className="ingredient-tab-bar">
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
      </div>

      <div className="ingredient-cards-grid">
        <form className="ingredient-card-base ingredient-form-card" onSubmit={handleAddItem}>
          <h2 className="ingredient-card-title">재료 추가</h2>
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
              <select className="ingredient-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {["개", "팩", "병", "봉지", "g", "kg", "ml", "L"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
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
          <button className="ingredient-submit-button" type="submit">
            <FiPlus /> 재료 추가
          </button>
        </form>

        <div className="ingredient-card-base ingredient-list-card">
          <div className="ingredient-list-header">
            <h2 className="ingredient-card-title">
              현재 {activeTab === "fridge" ? "냉장실" : "냉동실"} 재료
            </h2>
            <span className="ingredient-chip">{currentItems.length}개</span>
          </div>
          {currentItems.length === 0 ? (
            <div className="ingredient-empty-state">해당 냉장고에 등록된 재료가 없습니다.</div>
          ) : (
            <div className="ingredient-item-list">
              {currentItems.map((item) => (
                <div className="ingredient-item" key={item.id}>
                  <div className="ingredient-item-info">
                    <span className="ingredient-item-name">{item.name}</span>
                    <span className="ingredient-item-meta">
                      {item.quantity} {item.unit}
                      {item.expirationDate && (
                        <>
                          {" "}
                          · 유통기한 {item.expirationDate}
                          {item.daysUntilExpiration != null &&
                            ` (D${item.daysUntilExpiration >= 0 ? "-" : "+"}${Math.abs(
                              item.daysUntilExpiration,
                            )})`}
                        </>
                      )}
                    </span>
                    {item.memo && <span className="ingredient-item-memo">{item.memo}</span>}
                  </div>
                  <button className="ingredient-delete-button" onClick={() => handleDeleteItem(item.id)}>
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
              <span className="ingredient-duplicate-existing-name">
                {duplicateDecision.existingItem.name}
              </span>
              ({duplicateDecision.existingItem.unit})에 추가하시겠습니까?
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
              <button
                className="ingredient-modal-button"
                onClick={handleDuplicateCancel}
                disabled={duplicateProcessing}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredient;
