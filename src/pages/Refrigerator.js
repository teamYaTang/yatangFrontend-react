import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiPackage, FiLayers, FiPlusCircle, FiRepeat, FiSettings, FiBox, FiX } from "react-icons/fi";
import "../styles/Refrigerator.css";

import {
  getUserFridgesApi,
  getFridgeItemsApi,
  getFreezerItemsApi,
  updateFridgeItemApi,
  updateFreezerItemApi,
  deleteFridgeItemApi,
  deleteFreezerItemApi,
  createFridgeItemApi,
  createFreezerItemApi,
  getPantryItemsApi,
  createPantryItemApi,
  updatePantryItemApi,
  deletePantryItemApi,
} from "../api/refrigerator";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { useToast } from "../context/ToastContext";
import { ITEM_SORT_OPTIONS, sortItems, normalizeSortKey } from "../utils/itemSort";
import { formatDdayLabel, formatRegisteredAt, getDaysUntilExpiration, isDdayUrgent } from "../utils/ddayLabel";

const UNIT_OPTIONS = ["개", "팩", "병", "봉지", "캔", "g", "kg", "ml", "L"];
const LS_FRIDGE_SORT = "yatang_fridge_sort";

const Refrigerator = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [userNickname, setUserNickname] = useState("");
  const [mainFridge, setMainFridge] = useState(null);
  const [fridges, setFridges] = useState([]);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFlipped, setIsFlipped] = useState(false);

  const [detailItem, setDetailItem] = useState(null);
  const [detailType, setDetailType] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [moveBusy, setMoveBusy] = useState(false);
  const [sortKey, setSortKey] = useState(() => normalizeSortKey(localStorage.getItem(LS_FRIDGE_SORT)));

  useEffect(() => {
    localStorage.setItem(LS_FRIDGE_SORT, sortKey);
  }, [sortKey]);

  const sortedFridgeItems = useMemo(() => sortItems(fridgeItems, sortKey), [fridgeItems, sortKey]);
  const sortedFreezerItems = useMemo(() => sortItems(freezerItems, sortKey), [freezerItems, sortKey]);
  const sortedPantryItems = useMemo(() => sortItems(pantryItems, sortKey), [pantryItems, sortKey]);

  const navigateToIngredient = () =>
    navigate("/ingredient", { state: { selectedFridgeId: mainFridge?.id, fromRefrigerator: true } });
  const navigateToRecipe = () => navigate("/complete");

  const handleLogout = () => {
    if (!window.confirm("로그아웃할까요?")) return;
    localStorage.removeItem("accessToken");
    toast("로그아웃되었습니다.");
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

  const refreshPantry = useCallback(async () => {
    const data = await getPantryItemsApi();
    setPantryItems(data ?? []);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isLoggedIn()) {
          const userId = getUserIdFromToken();
          if (userId) {
            const profile = await getUserProfile(userId);
            setUserNickname(profile.nickname || profile.username || "");
          }
        } else {
          setUserNickname("게스트");
        }

        const fridgeList = await getUserFridgesApi();
        setFridges(fridgeList);

        if (fridgeList.length > 0) {
          const main = fridgeList.find((f) => f.isMain) || fridgeList[0];
          setMainFridge(main);
          await refreshItems(main.id);
        }
        await refreshPantry();
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        toast("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, refreshPantry, toast]);

  const handleFridgeChange = async (e) => {
    const selectedId = e.target.value;
    const selected = fridges.find((f) => String(f.id) === String(selectedId));
    if (selected) {
      setLoading(true);
      setMainFridge(selected);
      await refreshItems(selected.id);
      setLoading(false);
    }
  };

  const totalItems = useMemo(
    () => fridgeItems.length + freezerItems.length + pantryItems.length,
    [fridgeItems.length, freezerItems.length, pantryItems.length],
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

  const buildPayloadFromEdit = () => {
    if (!editValues) return null;
    const q = Number(editValues.quantity);
    return {
      name: (editValues.name || "").trim(),
      quantity: Number.isNaN(q) || q < 1 ? 1 : q,
      unit: (editValues.unit || "개").trim(),
      expirationDate: editValues.expirationDate || null,
      manufactureDate: editValues.manufactureDate || null,
      memo: editValues.memo || null,
    };
  };

  const handleUpdate = async () => {
    if (!detailItem || !detailType || !editValues) return;
    if (detailType !== "pantry" && !mainFridge) return;
    const body = buildPayloadFromEdit();
    if (!body?.name) {
      toast("이름을 입력해주세요.");
      return;
    }
    try {
      if (detailType === "fridge") {
        await updateFridgeItemApi(mainFridge.id, detailItem.id, body);
        await refreshItems(mainFridge.id);
      } else if (detailType === "freezer") {
        await updateFreezerItemApi(mainFridge.id, detailItem.id, body);
        await refreshItems(mainFridge.id);
      } else {
        await updatePantryItemApi(detailItem.id, body);
        await refreshPantry();
      }
      toast("저장했습니다.");
      closeDetail();
    } catch (error) {
      console.error("아이템 수정 에러:", error);
      toast(error.message || "아이템 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!detailItem || !detailType) return;
    if (detailType !== "pantry" && !mainFridge) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      if (detailType === "fridge") {
        await deleteFridgeItemApi(mainFridge.id, detailItem.id);
        await refreshItems(mainFridge.id);
      } else if (detailType === "freezer") {
        await deleteFreezerItemApi(mainFridge.id, detailItem.id);
        await refreshItems(mainFridge.id);
      } else {
        await deletePantryItemApi(detailItem.id);
        await refreshPantry();
      }
      toast("삭제했습니다.");
      closeDetail();
    } catch (error) {
      console.error("아이템 삭제 에러:", error);
      toast(error.message || "아이템 삭제에 실패했습니다.");
    }
  };

  const runMove = async (fn) => {
    const body = buildPayloadFromEdit();
    if (!body?.name || body.quantity < 1) {
      toast("이름·수량을 확인해주세요.");
      return;
    }
    setMoveBusy(true);
    try {
      await fn(body);
      await refreshItems(mainFridge.id);
      await refreshPantry();
      toast("이동했습니다.");
      closeDetail();
    } catch (error) {
      console.error(error);
      toast(error.message || "이동에 실패했습니다.");
    } finally {
      setMoveBusy(false);
    }
  };

  const handleMoveFridgeToFreezer = () => {
    if (!detailItem || !mainFridge || detailType !== "fridge") return;
    runMove(async (body) => {
      await deleteFridgeItemApi(mainFridge.id, detailItem.id);
      await createFreezerItemApi(mainFridge.id, body);
    });
  };

  const handleMoveFreezerToFridge = () => {
    if (!detailItem || !mainFridge || detailType !== "freezer") return;
    runMove(async (body) => {
      await deleteFreezerItemApi(mainFridge.id, detailItem.id);
      await createFridgeItemApi(mainFridge.id, body);
    });
  };

  const handleMoveToPantry = () => {
    if (!detailItem || !mainFridge) return;
    if (detailType !== "fridge" && detailType !== "freezer") return;
    runMove(async (body) => {
      if (detailType === "fridge") {
        await deleteFridgeItemApi(mainFridge.id, detailItem.id);
      } else {
        await deleteFreezerItemApi(mainFridge.id, detailItem.id);
      }
      await createPantryItemApi(body);
    });
  };

  const handleMovePantryToFridge = () => {
    if (!detailItem || !mainFridge || detailType !== "pantry") return;
    runMove(async (body) => {
      await deletePantryItemApi(detailItem.id);
      await createFridgeItemApi(mainFridge.id, body);
    });
  };

  const handleMovePantryToFreezer = () => {
    if (!detailItem || !mainFridge || detailType !== "pantry") return;
    runMove(async (body) => {
      await deletePantryItemApi(detailItem.id);
      await createFreezerItemApi(mainFridge.id, body);
    });
  };

  const renderGridItems = (items, type) =>
    items.map((item) => {
      const d = getDaysUntilExpiration(item);
      const dlabel = item.expirationDate ? formatDdayLabel(d) : null;
      const urgent = item.expirationDate ? isDdayUrgent(d) : false;
      return (
        <div
          className="fridge-item-slot"
          key={`${type}-${item.id}`}
          onClick={() => openDetail(item, type)}
        >
          <div className={`fridge-item-icon ${type}`}>
            {type === "fridge" ? <FiPackage /> : type === "freezer" ? <FiLayers /> : <FiBox />}
          </div>
          <div className="fridge-item-text-col">
            <div className="fridge-item-name">{item.name}</div>
            {dlabel && (
              <div className={`fridge-item-dday ${urgent ? "fridge-item-dday--urgent" : ""}`}>{dlabel}</div>
            )}
          </div>
        </div>
      );
    });

  if (loading) {
    return <div className="fridge-loading">냉장고 불러오는 중...</div>;
  }

  const modalTitle =
    detailType === "fridge" ? "냉장실 재료 상세" : detailType === "freezer" ? "냉동실 재료 상세" : "상온보관 재료 상세";

  return (
    <div className="fridge-page-wrapper fridge-page-with-dock">
      <header className="fridge-header">
        <div className="fridge-header-top-row">
          <div className="fridge-header-content">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {fridges.length > 1 ? (
                <div className="fridge-header-title-row">
                  <select className="fridge-select-dropdown" value={mainFridge?.id || ""} onChange={handleFridgeChange}>
                    {fridges
                      .sort((a, b) => Number(b.isMain === true) - Number(a.isMain === true))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                  {mainFridge?.isMain === true && (
                    <span className="badge-main" title="메인 냉장고">
                      main
                    </span>
                  )}
                </div>
              ) : (
                <h1 className="fridge-title">
                  <span>{mainFridge?.name || `${userNickname}의 냉장고`}</span>
                  {mainFridge?.isMain === true && (
                    <span className="badge-main" title="메인 냉장고">
                      main
                    </span>
                  )}
                </h1>
              )}
            </div>
          </div>
          <div className="fridge-header-actions" style={{ display: "flex", gap: "8px" }}>
            <button className="fridge-logout-button" onClick={() => navigate("/settings")} title="설정">
              <FiSettings size={18} />
            </button>
            {isLoggedIn() ? (
              <button className="fridge-logout-button" onClick={handleLogout}>
                <FiLogOut size={18} />
              </button>
            ) : (
              <button className="fridge-logout-button" onClick={() => navigate("/signin")}>
                로그인
              </button>
            )}
          </div>
        </div>
        <div className="fridge-subtitle-sort-row">
          <p className="fridge-subtitle">{mainFridge?.description || "등록된 재료를 한눈에 관리해보세요."}</p>
          <div className="fridge-sort-toolbar fridge-sort-toolbar--inline fridge-sort-toolbar--compact">
            <label className="fridge-sort-label" htmlFor="fridge-sort-select">
              정렬
            </label>
            <select
              id="fridge-sort-select"
              className="fridge-sort-select fridge-sort-select--compact"
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
      </header>

      <div className="fridge-flip-container">
        <div className={`fridge-flip-card ${isFlipped ? "flipped" : ""}`}>
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
                renderGridItems(sortedFridgeItems, "fridge")
              )}
            </div>
          </div>

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
                renderGridItems(sortedFreezerItems, "freezer")
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="fridge-pantry-section">
        <div className="fridge-pantry-header">
          <div className="fridge-pantry-title">
            <FiBox size={22} color="#b45309" /> 상온보관
          </div>
          <span className="fridge-pantry-hint">냉장·냉동과 별도로 두는 재료 (사용자당 한 공간)</span>
        </div>
        <div className="fridge-pantry-grid">
          {pantryItems.length === 0 ? (
            <div className="fridge-empty-text fridge-pantry-empty">상온 보관 중인 재료가 없습니다.</div>
          ) : (
            renderGridItems(sortedPantryItems, "pantry")
          )}
        </div>
      </section>

      <div className="fridge-summary-row fridge-summary-row-four">
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
          <div className="fridge-summary-icon variant-pantry">
            <FiBox size={28} />
          </div>
          <div className="fridge-summary-text">
            <span>상온보관</span>
            <strong>{pantryItems.length}개</strong>
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

      <div className="fridge-dock-fixed" role="navigation" aria-label="빠른 작업">
        <div className="fridge-dock-inner">
          <button className="fridge-primary-button" type="button" onClick={navigateToIngredient}>
            재료 추가 / 수정
          </button>
          <button className="fridge-secondary-button" type="button" onClick={navigateToRecipe}>
            AI 레시피 · 장바구니
          </button>
        </div>
      </div>

      {detailItem && editValues && (
        <div className="fridge-modal-backdrop" onClick={closeDetail}>
          <div className="fridge-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fridge-modal-header">
              <h2 className="fridge-modal-title">{modalTitle}</h2>
              <button type="button" className="fridge-modal-close-x" onClick={closeDetail} aria-label="닫기">
                <FiX size={20} />
              </button>
            </div>
            <div className="fridge-modal-field">
              <label className="fridge-modal-label">등록일</label>
              <input
                className="fridge-modal-input fridge-modal-input-readonly"
                readOnly
                value={formatRegisteredAt(detailItem.createdAt)}
              />
            </div>
            <div className="fridge-modal-field">
              <label className="fridge-modal-label">이름</label>
              <input className="fridge-modal-input" name="name" value={editValues.name} onChange={handleEditChange} />
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
                <select className="fridge-modal-select" name="unit" value={editValues.unit} onChange={handleEditChange}>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fridge-modal-row">
              <div className="fridge-modal-field">
                <label className="fridge-modal-label">소비기한</label>
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

            {mainFridge && (detailType === "fridge" || detailType === "freezer") && (
              <div className="fridge-modal-move-row">
                {detailType === "fridge" ? (
                  <>
                    <button
                      type="button"
                      className="fridge-modal-move-btn"
                      disabled={moveBusy}
                      onClick={handleMoveFridgeToFreezer}
                    >
                      냉동실로 이동
                    </button>
                    <button
                      type="button"
                      className="fridge-modal-move-btn"
                      disabled={moveBusy}
                      onClick={handleMoveToPantry}
                    >
                      상온보관으로 이동
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="fridge-modal-move-btn"
                      disabled={moveBusy}
                      onClick={handleMoveFreezerToFridge}
                    >
                      냉장실로 이동
                    </button>
                    <button
                      type="button"
                      className="fridge-modal-move-btn"
                      disabled={moveBusy}
                      onClick={handleMoveToPantry}
                    >
                      상온보관으로 이동
                    </button>
                  </>
                )}
              </div>
            )}

            {mainFridge && detailType === "pantry" && (
              <div className="fridge-modal-move-row">
                <button
                  type="button"
                  className="fridge-modal-move-btn"
                  disabled={moveBusy}
                  onClick={handleMovePantryToFridge}
                >
                  냉장실로 이동
                </button>
                <button
                  type="button"
                  className="fridge-modal-move-btn"
                  disabled={moveBusy}
                  onClick={handleMovePantryToFreezer}
                >
                  냉동실로 이동
                </button>
              </div>
            )}

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
