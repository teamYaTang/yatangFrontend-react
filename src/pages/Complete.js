import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiUsers,
  FiShoppingCart,
  FiBookOpen,
  FiTrash2,
} from "react-icons/fi";
import "../styles/Complete.css";
import { getAllItemsAcrossFridgesApi } from "../api/refrigerator";
import {
  postRecipeSuggestApi,
  getShoppingListApi,
  addShoppingBatchApi,
  toggleShoppingItemApi,
  deleteShoppingItemApi,
  getRecipeBookListApi,
  saveRecipeToBookApi,
  deleteRecipeFromBookApi,
  getRecipeBookDetailApi,
} from "../api/recipe";
import { isLoggedIn } from "../utils/jwt";
import { useToast } from "../context/ToastContext";

const Complete = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("suggest");
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [err, setErr] = useState("");
  const [shopping, setShopping] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [openBookId, setOpenBookId] = useState(null);
  const [openBookRecipe, setOpenBookRecipe] = useState(null);

  const loadInventory = useCallback(async () => {
    try {
      const rows = await getAllItemsAcrossFridgesApi();
      setInventory(rows || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadShopping = useCallback(async () => {
    try {
      const data = await getShoppingListApi();
      setShopping(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setShopping([]);
    }
  }, []);

  const loadBook = useCallback(async () => {
    try {
      const data = await getRecipeBookListApi();
      setBookList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBookList([]);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    loadShopping();
    loadBook();
  }, [loadShopping, loadBook]);

  useEffect(() => {
    if (tab === "cart") loadShopping();
    if (tab === "book") loadBook();
  }, [tab, loadShopping, loadBook]);

  const handleSuggest = async () => {
    setErr("");
    if (!isLoggedIn()) {
      toast("AI 레시피 추천은 로그인 후 이용할 수 있습니다.");
      navigate("/signin");
      return;
    }
    if (!inventory.length) {
      toast("냉장고에 재료를 먼저 등록해주세요.");
      return;
    }
    setLoadingSuggest(true);
    try {
      const ingredients = inventory.map((i) => ({
        name: (i.name || "").trim(),
        quantity: i.quantity != null ? Number(i.quantity) : null,
        unit: (i.unit || "개").trim(),
      }));
      const res = await postRecipeSuggestApi(ingredients);
      setRecipes(res?.recipes || []);
      if (!res?.recipes?.length) {
        toast("레시피를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "요청에 실패했습니다.";
      setErr(String(msg));
      toast(typeof msg === "string" ? msg : "레시피 추천에 실패했습니다.");
    } finally {
      setLoadingSuggest(false);
    }
  };

  const addMissingToCart = async (recipe) => {
    const missing = recipe?.missingIngredients || [];
    if (!missing.length) {
      toast("부족한 재료가 없습니다.");
      return;
    }
    const lines = missing.map((m) => ({
      ingredientName: m.name || "",
      quantityNote: m.amount || "",
      unit: m.note || "",
    }));
    try {
      await addShoppingBatchApi(lines);
      await loadShopping();
      toast("장바구니에 담았습니다.");
      setTab("cart");
    } catch (e) {
      toast(e.message || "담기에 실패했습니다.");
    }
  };

  const saveBook = async (recipe) => {
    try {
      await saveRecipeToBookApi(recipe);
      await loadBook();
      toast("레시피북에 저장했습니다.");
    } catch (e) {
      toast(e.message || "저장에 실패했습니다.");
    }
  };

  const toggleCart = async (item) => {
    try {
      await toggleShoppingItemApi(item.id);
      await loadShopping();
    } catch (e) {
      toast(e.message || "처리에 실패했습니다.");
    }
  };

  const removeCart = async (item) => {
    try {
      await deleteShoppingItemApi(item.id);
      await loadShopping();
    } catch (e) {
      toast(e.message || "삭제에 실패했습니다.");
    }
  };

  const openBookDetail = async (id) => {
    if (openBookId === id) {
      setOpenBookId(null);
      setOpenBookRecipe(null);
      return;
    }
    try {
      const detail = await getRecipeBookDetailApi(id);
      setOpenBookId(id);
      setOpenBookRecipe(JSON.parse(detail.payloadJson || "{}"));
    } catch (e) {
      toast(e.message || "불러오지 못했습니다.");
    }
  };

  const removeBook = async (id) => {
    if (!window.confirm("레시피북에서 삭제할까요?")) return;
    try {
      await deleteRecipeFromBookApi(id);
      setOpenBookId(null);
      setOpenBookRecipe(null);
      await loadBook();
    } catch (e) {
      toast(e.message || "삭제에 실패했습니다.");
    }
  };

  const invSummary =
    inventory.length === 0
      ? "등록된 재료가 없습니다."
      : `${inventory.length}종 · ${inventory
          .slice(0, 8)
          .map((i) => i.name)
          .join(", ")}${inventory.length > 8 ? " …" : ""}`;

  return (
    <div className="complete-page">
      <div className="complete-header">
        <button type="button" className="complete-back" onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} /> 뒤로
        </button>
        <h1 className="complete-title">AI 레시피 · 장바구니 · 레시피북</h1>
      </div>

      <p className="complete-lead">
        보유 재료를 최대한 활용하는 요리를 AI가 약 3가지 제안합니다. 부족한 재료는 장바구니에 모으고, 마음에 드는 결과는 레시피북에 저장할 수 있어요.
      </p>

      <div className="complete-tabs">
        <button
          type="button"
          className={`complete-tab ${tab === "suggest" ? "active" : ""}`}
          onClick={() => setTab("suggest")}
        >
          AI 추천
        </button>
        <button
          type="button"
          className={`complete-tab ${tab === "cart" ? "active" : ""}`}
          onClick={() => setTab("cart")}
        >
          장바구니 ({shopping.length})
        </button>
        <button
          type="button"
          className={`complete-tab ${tab === "book" ? "active" : ""}`}
          onClick={() => setTab("book")}
        >
          레시피북 ({bookList.length})
        </button>
      </div>

      {err && <div className="complete-error">{err}</div>}

      {tab === "suggest" && (
        <>
          <div className="complete-inventory-preview">
            <strong>현재 재료</strong> · {invSummary}
          </div>
          <div className="complete-suggest-actions">
            <button
              type="button"
              className="complete-primary-btn"
              onClick={handleSuggest}
              disabled={loadingSuggest}
            >
              {loadingSuggest ? "추천 받는 중…" : "레시피 추천받기"}
            </button>
            <p className="complete-hint">
              모델: 서버에서 OpenAI(gpt-4o-mini 등)로 호출합니다. API 키가 없으면 오류가 날 수 있어요. 비로그인 시 AI 호출은 할 수
              없습니다.
            </p>
          </div>

          <div className="complete-recipes">
            {recipes.map((r, idx) => (
              <article key={`${r.title}-${idx}`} className="complete-recipe-card">
                <h2 className="complete-recipe-title">{r.title || `레시피 ${idx + 1}`}</h2>
                <div className="complete-recipe-meta">
                  <span>
                    <FiClock size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    {r.cookMinutes != null ? `${r.cookMinutes}분` : "—"}
                  </span>
                  <span>
                    <FiUsers size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    {r.servings != null ? `${r.servings}인분` : "—"}
                  </span>
                </div>

                {r.usesFromInventory?.length > 0 && (
                  <>
                    <div className="complete-section-label">재고 활용</div>
                    <ul>
                      {r.usesFromInventory.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="complete-section-label">필요 재료 (인분 기준)</div>
                <ul>
                  {(r.ingredients || []).map((ing, i) => (
                    <li key={i}>
                      <strong>{ing.name}</strong> {ing.amount}
                      {ing.note ? ` · ${ing.note}` : ""}
                    </li>
                  ))}
                </ul>

                <div className="complete-section-label">만드는 순서</div>
                <ol>
                  {(r.steps || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>

                {(r.missingIngredients || []).length > 0 && (
                  <>
                    <div className="complete-section-label">부족한 재료</div>
                    <div className="complete-missing">
                      {(r.missingIngredients || []).map((m, i) => (
                        <div key={i}>
                          · {m.name} {m.amount}
                          {m.note ? ` (${m.note})` : ""}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="complete-recipe-actions">
                  <button type="button" className="complete-secondary-btn" onClick={() => addMissingToCart(r)}>
                    <FiShoppingCart size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                    부족 재료 장바구니에 담기
                  </button>
                  <button type="button" className="complete-ghost-btn" onClick={() => saveBook(r)}>
                    <FiBookOpen size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                    레시피북에 저장
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {tab === "cart" && (
        <>
          {shopping.length === 0 ? (
            <div className="complete-empty">장바구니가 비어 있습니다.</div>
          ) : (
            <div className="complete-cart-list">
              {shopping.map((item) => (
                <div
                  key={item.id}
                  className={`complete-cart-row ${item.checked ? "done" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!!item.checked}
                    onChange={() => toggleCart(item)}
                    aria-label="구매 완료"
                  />
                  <div className="complete-cart-meta">
                    <strong>{item.ingredientName}</strong>
                    {(item.quantityNote || item.unit) && (
                      <span>
                        {" "}
                        · {item.quantityNote}
                        {item.unit ? ` ${item.unit}` : ""}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="complete-ghost-btn"
                    aria-label="삭제"
                    onClick={() => removeCart(item)}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "book" && (
        <>
          {bookList.length === 0 ? (
            <div className="complete-empty">저장된 레시피가 없습니다.</div>
          ) : (
            <div className="complete-book-list">
              {bookList.map((row) => (
                <div key={row.id}>
                  <div className="complete-book-row">
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        textAlign: "left",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                      onClick={() => openBookDetail(row.id)}
                    >
                      {row.title}
                      <span style={{ fontWeight: 400, color: "#64748b", fontSize: "0.85rem" }}>
                        {" "}
                        {row.cookMinutes != null ? ` · ${row.cookMinutes}분` : ""}
                        {row.servings != null ? ` · ${row.servings}인분` : ""}
                      </span>
                    </button>
                    <button type="button" className="complete-ghost-btn" onClick={() => removeBook(row.id)}>
                      삭제
                    </button>
                  </div>
                  {openBookId === row.id && openBookRecipe && (
                    <div className="complete-book-detail">
                      <div className="complete-section-label">재료</div>
                      <ul>
                        {(openBookRecipe.ingredients || []).map((ing, i) => (
                          <li key={i}>
                            {ing.name} {ing.amount}
                          </li>
                        ))}
                      </ul>
                      <div className="complete-section-label">순서</div>
                      <ol>
                        {(openBookRecipe.steps || []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Complete;
