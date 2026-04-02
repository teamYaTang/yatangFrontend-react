import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiPackage, FiLayers, FiPlusCircle, FiRepeat, FiSettings } from "react-icons/fi";
import "../styles/Refrigerator.css";

import {
  getUserFridgesApi,
  getFridgeItemsApi,
  getFreezerItemsApi,
  updateFridgeItemApi,
  updateFreezerItemApi,
  deleteFridgeItemApi,
  deleteFreezerItemApi,
} from "../api/refrigerator";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken } from "../utils/jwt";

const Refrigerator = () => {
  const navigate = useNavigate();
  const [userNickname, setUserNickname] = useState("");
  const [mainFridge, setMainFridge] = useState(null);
  const [fridges, setFridges] = useState([]);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // New State for Flip Effect
  const [isFlipped, setIsFlipped] = useState(false); // false = Fridge (Front), true = Freezer (Back)

  const [detailItem, setDetailItem] = useState(null);
  const [detailType, setDetailType] = useState(null); // "fridge" | "freezer"
  const [editValues, setEditValues] = useState(null);

  const navigateToIngredient = () => navigate("/ingredient", { state: { selectedFridgeId: mainFridge?.id } });
  const navigateToRecipe = () => navigate("/complete");
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const refreshItems = async (targetFridgeId) => {
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

    const loadData = async () => {
      try {
        const userId = getUserIdFromToken();
        if (!userId) {
          navigate("/");
          return;
        }

        const profile = await getUserProfile(userId);
        setUserNickname(profile.nickname || profile.username || "");

        const fridgeList = await getUserFridgesApi();
        setFridges(fridgeList);

        if (fridgeList.length > 0) {
          const main = fridgeList.find(f => f.isMain) || fridgeList[0];
          setMainFridge(main);
          await refreshItems(main.id);
        }
      } catch (error) {
        // Todo : 현재 데이터 로딩 에러가 로그인 안된 상태에서 냉장고를 조회하려고 할 때 발생. 알림이 발생하고 로그인 하는 화면으로 바로 이동하도록, 혹은 그냥 알림 없이 바로 로그인화면으로 돌아가도록 수정
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleFridgeChange = async (e) => {
    const selectedId = Number(e.target.value);
    const selected = fridges.find(f => f.id === selectedId);
    if (selected) {
      setLoading(true);
      setMainFridge(selected);
      await refreshItems(selected.id);
      setLoading(false);
    }
  };

  const totalItems = useMemo(
    () => fridgeItems.length + freezerItems.length,
    [fridgeItems.length, freezerItems.length],
  );

  const openDetail = (item, type) => {
    setDetailItem(item);
    setDetailType(type);
    setEditValues({
      name: item.name || "",
      quantity: item.quantity ?? 1,
      unit: item.unit || "개",
      expirationDate: item.expirationDate || "",
      manufactureDate: item.manufactureDate || "",
      memo: item.memo || "",
    });
  };

  const closeDetail = () => {
    setDetailItem(null);
    setDetailType(null);
    setEditValues(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) || 0 : value,
    }));
  };

  const handleUpdate = async () => {
    if (!detailItem || !detailType || !mainFridge || !editValues) return;
    try {
      if (detailType === "fridge") {
        await updateFridgeItemApi(mainFridge.id, detailItem.id, editValues);
      } else {
        await updateFreezerItemApi(mainFridge.id, detailItem.id, editValues);
      }
      await refreshItems(mainFridge.id);
      closeDetail();
    } catch (error) {
      console.error("아이템 수정 에러:", error);
      alert(error.message || "아이템 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!detailItem || !detailType || !mainFridge) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      if (detailType === "fridge") {
        await deleteFridgeItemApi(mainFridge.id, detailItem.id);
      } else {
        await deleteFreezerItemApi(mainFridge.id, detailItem.id);
      }
      await refreshItems(mainFridge.id);
      closeDetail();
    } catch (error) {
      console.error("아이템 삭제 에러:", error);
      alert(error.message || "아이템 삭제에 실패했습니다.");
    }
  };

  const renderGridItems = (items, type) => (
    items.map((item) => (
      <div
        className="fridge-item-slot"
        key={`${type}-${item.id}`}
        onClick={() => openDetail(item, type)}
      >
        <div className={`fridge-item-icon ${type}`}>
          {type === 'fridge' ? <FiPackage /> : <FiLayers />}
          {/* Simple badge if expiring soon could be added here */}
        </div>
        <div className="fridge-item-name">{item.name}</div>
      </div>
    ))
  );

  if (loading) {
    return <div className="fridge-loading">냉장고 불러오는 중...</div>;
  }

  return (
    <div className="fridge-page-wrapper">
      <header className="fridge-header">
        <div className="fridge-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {fridges.length > 1 ? (
              <div className="fridge-header-title-row">
                <select
                  className="fridge-select-dropdown"
                  value={mainFridge?.id || ""}
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
                {mainFridge?.isMain === true && (
                  <span className="badge-main" title="메인 냉장고">main</span>
                )}
              </div>
            ) : (
              <h1 className="fridge-title">
                <span>{mainFridge?.name || `${userNickname}의 냉장고`}</span>
                {mainFridge?.isMain === true && (
                  <span className="badge-main" title="메인 냉장고">main</span>
                )}
              </h1>
            )}
          </div>
          <p className="fridge-subtitle">
            {mainFridge?.description || "등록된 재료를 한눈에 관리해보세요."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="fridge-logout-button"
            onClick={() => navigate("/settings")}
            title="설정"
          >
            <FiSettings size={18} />
          </button>
          <button className="fridge-logout-button" onClick={handleLogout}>
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      {/* 3D Flip Container */}
      <div className="fridge-flip-container">
        <div className={`fridge-flip-card ${isFlipped ? 'flipped' : ''}`}>

          {/* Front Face: Fridge */}
          <div className="fridge-face front">
            <div className="fridge-face-header">
              <div className="fridge-face-title">
                <FiPackage size={24} color="#4c6ef5" /> 냉장실
              </div>
              <button className="fridge-switch-button" onClick={() => setIsFlipped(true)}>
                <FiRepeat /> 냉동실 보기
              </button>
            </div>
            <div className="fridge-grid-content">
              {fridgeItems.length === 0 ? (
                <div className="fridge-empty-text">냉장실이 비어있습니다.</div>
              ) : (
                renderGridItems(fridgeItems, "fridge")
              )}
            </div>
          </div>

          {/* Back Face: Freezer */}
          <div className="fridge-face back">
            <div className="fridge-face-header">
              <div className="fridge-face-title">
                <FiLayers size={24} color="#06b6d4" /> 냉동실
              </div>
              <button className="fridge-switch-button" onClick={() => setIsFlipped(false)}>
                <FiRepeat /> 냉장실 보기
              </button>
            </div>
            <div className="fridge-grid-content">
              {freezerItems.length === 0 ? (
                <div className="fridge-empty-text">냉동실이 비어있습니다.</div>
              ) : (
                renderGridItems(freezerItems, "freezer")
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="fridge-action-row">
        <button className="fridge-primary-button" onClick={navigateToIngredient}>
          재료 추가 / 수정
        </button>
        <button className="fridge-secondary-button" onClick={navigateToRecipe}>
          메뉴 추천 받기
        </button>
      </div>

      <div className="fridge-summary-row">
        <div className="fridge-summary-card">
          <div className="fridge-summary-icon variant-fridge">
            <FiPackage size={28} />
          </div>
          <div className="fridge-summary-text">
            <span>냉장실</span>
            <strong>{fridgeItems.length}개</strong>
          </div>
        </div>
        <div className="fridge-summary-card">
          <div className="fridge-summary-icon variant-freezer">
            <FiLayers size={28} />
          </div>
          <div className="fridge-summary-text">
            <span>냉동실</span>
            <strong>{freezerItems.length}개</strong>
          </div>
        </div>
        <div className="fridge-summary-card">
          <div className="fridge-summary-icon variant-all">
            <FiPlusCircle size={28} />
          </div>
          <div className="fridge-summary-text">
            <span>전체 재료</span>
            <strong>{totalItems}개</strong>
          </div>
        </div>
      </div>

      {detailItem && editValues && (
        <div className="fridge-modal-backdrop" onClick={closeDetail}>
          <div className="fridge-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="fridge-modal-title">
              {detailType === "fridge" ? "냉장실" : "냉동실"} 재료 상세
            </h2>
            <div className="fridge-modal-field">
              <label className="fridge-modal-label">이름</label>
              <input
                className="fridge-modal-input"
                name="name"
                value={editValues.name}
                onChange={handleEditChange}
              />
            </div>
            <div className="fridge-modal-row">
              <div className="fridge-modal-field">
                <label className="fridge-modal-label">수량</label>
                <input
                  className="fridge-modal-input"
                  type="number"
                  name="quantity"
                  min="1"
                  value={editValues.quantity}
                  onChange={handleEditChange}
                />
              </div>
              <div className="fridge-modal-field">
                <label className="fridge-modal-label">단위</label>
                <select
                  className="fridge-modal-select"
                  name="unit"
                  value={editValues.unit}
                  onChange={handleEditChange}
                >
                  {["개", "팩", "병", "봉지", "g", "kg", "ml", "L"].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fridge-modal-row">
              <div className="fridge-modal-field">
                <label className="fridge-modal-label">유통기한</label>
                <input
                  className="fridge-modal-input"
                  type="date"
                  name="expirationDate"
                  value={editValues.expirationDate || ""}
                  onChange={handleEditChange}
                />
              </div>
              <div className="fridge-modal-field">
                <label className="fridge-modal-label">제조일자</label>
                <input
                  className="fridge-modal-input"
                  type="date"
                  name="manufactureDate"
                  value={editValues.manufactureDate || ""}
                  onChange={handleEditChange}
                />
              </div>
            </div>
            <div className="fridge-modal-field">
              <label className="fridge-modal-label">메모</label>
              <input
                className="fridge-modal-input"
                name="memo"
                placeholder="보관 위치나 메모를 입력하세요."
                value={editValues.memo}
                onChange={handleEditChange}
              />
            </div>
            <div className="fridge-modal-actions">
              <button className="fridge-modal-delete-btn" type="button" onClick={handleDelete}>
                삭제
              </button>
              <button className="fridge-modal-primary-btn" type="button" onClick={handleUpdate}>
                수정 사항 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Refrigerator;
