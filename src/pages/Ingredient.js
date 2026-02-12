import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Ingredient.css";
import { FiPlus, FiTrash2, FiArrowLeft } from "react-icons/fi";

import {
  getMainFridgeApi,
  getFridgeItemsApi,
  getFreezerItemsApi,
  createFridgeItemApi,
  createFreezerItemApi,
  deleteFridgeItemApi,
  deleteFreezerItemApi,
} from "../api/refrigerator";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken } from "../utils/jwt";

const Ingredient = () => {
  const navigate = useNavigate();
  const [userNickname, setUserNickname] = useState("");
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

        const fridge = await getMainFridgeApi();
        setFridgeId(fridge.id);
        await loadItems(fridge.id);
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity) {
      alert("재료명과 수량을 입력해주세요.");
      return;
    }
    if (!fridgeId) return;

    const payload = {
      name: itemName,
      quantity: parseInt(quantity, 10),
      unit,
      expirationDate: expirationDate || null,
      manufactureDate: manufactureDate || null,
      memo: memo || null,
    };

    try {
      if (activeTab === "fridge") {
        await createFridgeItemApi(fridgeId, payload);
      } else {
        await createFreezerItemApi(fridgeId, payload);
      }
      await loadItems(fridgeId);
      setItemName("");
      setQuantity("");
      setUnit("개");
      setExpirationDate("");
      setManufactureDate("");
      setMemo("");
    } catch (error) {
      console.error("재료 추가 에러:", error);
      alert(error.message || "재료 추가에 실패했습니다.");
    }
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
          <p className="ingredient-subtitle">
            {activeTab === "fridge" ? "냉장실" : "냉동실"} 재료를 추가/수정하세요.
          </p>
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
            <div className="ingredient-empty-state">아직 등록된 재료가 없습니다.</div>
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
    </div>
  );
};

export default Ingredient;
