import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiUsers,
  FiShoppingCart,
  FiBookOpen,
  FiTrash2,
  FiExternalLink,
} from "react-icons/fi";
import "../styles/Complete.css";
import { getAllItemsAcrossFridgesApi } from "../api/refrigerator";
import { getIngredientCatalogApi, getIngredientCatalogIconMapApi } from "../api/ingredientCatalog";
import {
  postRecipeSuggestApi,
  getShoppingListApi,
  addShoppingBatchApi,
  addShoppingItemApi,
  toggleShoppingItemApi,
  deleteShoppingItemApi,
  getRecipeBookListApi,
  saveRecipeToBookApi,
  deleteRecipeFromBookApi,
  getRecipeBookDetailApi,
} from "../api/recipe";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { getGuestCatalogExtras } from "../utils/storage";
import { coupangPurchaseUrl } from "../utils/coupangLink";
import { pushRecentAiRecipes, getRecentAiRecipes } from "../utils/recentAiRecipes";
import { useToast } from "../context/ToastContext";
import { CatalogIngredientGlyph } from "../constants/ingredientCatalogVisuals";
import { getIngredientImageMapApi } from "../api/ingredientImages";
import { getGuestIngredientImageMapForCustomCatalogOnly } from "../utils/guestIngredientImages";
import { playRecipeDoneSfx } from "../utils/sfx";

const rowKey = (row) => `${row.storageType || ""}-${row.fridgeId ?? "p"}-${row.itemId ?? row.id}`;

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

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [recentRecipes, setRecentRecipes] = useState(() => getRecentAiRecipes());
  const [recentOpen, setRecentOpen] = useState(false);
  const [openRecentIdx, setOpenRecentIdx] = useState(null);

  const [manualName, setManualName] = useState("");
  const [catalogSuggestions, setCatalogSuggestions] = useState([]);
  const catalogTimerRef = useRef(null);
  const suppressNextCatalogFetchRef = useRef(false);

  const userId = getUserIdFromToken();

  /** 재료명(소문자) → 시스템 카탈로그 아이콘 파일명 */
  const [systemIconFileByNameLower, setSystemIconFileByNameLower] = useState({});
  /** 재료명(소문자) → 사용자 업로드 이미지 URL (직접 추가만) */
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
    setSelectedKeys(new Set(inventory.map(rowKey)));
  }, [inventory]);

  useEffect(() => {
    loadShopping();
    loadBook();
  }, [loadShopping, loadBook]);

  useEffect(() => {
    if (tab === "cart") loadShopping();
    if (tab === "book") loadBook();
  }, [tab, loadShopping, loadBook]);

  useEffect(() => {
    if (suppressNextCatalogFetchRef.current) {
      suppressNextCatalogFetchRef.current = false;
      return;
    }
    const q = manualName.trim();
    if (q.length < 1) {
      setCatalogSuggestions([]);
      return;
    }
    if (catalogTimerRef.current) clearTimeout(catalogTimerRef.current);
    catalogTimerRef.current = setTimeout(async () => {
      try {
        const rows = await getIngredientCatalogApi(q, userId || null, "전체");
        const list = Array.isArray(rows) ? [...rows] : [];
        const seen = new Set(list.map((r) => r.name));
        if (!isLoggedIn()) {
          getGuestCatalogExtras().forEach((x) => {
            if (!x?.name || seen.has(x.name)) return;
            if (!x.name.toLowerCase().includes(q.toLowerCase())) return;
            list.push({
              id: `guest-extra-${x.name}`,
              name: x.name,
              defaultUnit: x.defaultUnit || "개",
              category: null,
              custom: true,
            });
            seen.add(x.name);
          });
        }
        setCatalogSuggestions(list.slice(0, 12));
      } catch (e) {
        console.error(e);
        setCatalogSuggestions([]);
      }
    }, 250);
    return () => {
      if (catalogTimerRef.current) clearTimeout(catalogTimerRef.current);
    };
  }, [manualName, userId]);

  const toggleInvKey = (k) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const selectAllInventory = () => {
    setSelectedKeys(new Set(inventory.map(rowKey)));
  };

  const selectNoneInventory = () => {
    setSelectedKeys(new Set());
  };

  const addManualToCart = async () => {
    const name = manualName.trim();
    if (!name) {
      toast("재료 이름을 입력해주세요.");
      return;
    }
    try {
      await addShoppingItemApi({
        ingredientName: name,
        quantityNote: "",
        unit: "",
      });
      await loadShopping();
      toast("장바구니에 담았습니다.");
      setManualName("");
      setCatalogSuggestions([]);
    } catch (e) {
      toast(e.message || "담기에 실패했습니다.");
    }
  };

  const pickCatalogSuggestion = (s) => {
    suppressNextCatalogFetchRef.current = true;
    setCatalogSuggestions([]);
    setManualName(s.name || "");
  };

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
    const selectedRows = inventory.filter((i) => selectedKeys.has(rowKey(i)));
    if (!selectedRows.length) {
      toast("AI에 넘길 재료를 한 가지 이상 선택해주세요.");
      return;
    }
    setLoadingSuggest(true);
    try {
      const ingredients = selectedRows.map((i) => ({
        name: (i.name || "").trim(),
        quantity: i.quantity != null ? Number(i.quantity) : null,
        unit: (i.unit || "개").trim(),
      }));
      const res = await postRecipeSuggestApi(ingredients);
      setRecipes(res?.recipes || []);
      if (res?.recipes?.length) {
        pushRecentAiRecipes(res.recipes);
        setRecentRecipes(getRecentAiRecipes());
        playRecipeDoneSfx();
      }
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

  const renderIngredientGlyph = (name) => {
    const trimmed = (name || "").trim();
    const lower = trimmed.toLowerCase();
    const imgUrl = userIngredientImageMap[lower];
    const iconFile = systemIconFileByNameLower[lower];
    return (
      <span className="complete-ingredient-glyph" aria-hidden>
        <CatalogIngredientGlyph name={name} userImageUrl={imgUrl || undefined} iconImageFile={iconFile || undefined} />
      </span>
    );
  };

  const openRecentRecipe = (idx) => {
    setRecentOpen(true);
    setOpenRecentIdx((prev) => (prev === idx ? null : idx));
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

  const invSummary = useMemo(() => {
    if (inventory.length === 0) return "등록된 재료가 없습니다.";
    const n = selectedKeys.size;
    const sel = inventory.filter((i) => selectedKeys.has(rowKey(i)));
    const names = sel
      .slice(0, 8)
      .map((i) => i.name)
      .join(", ");
    return `${n}/${inventory.length}종 선택 · ${names}${sel.length > 8 ? " …" : ""}`;
  }, [inventory, selectedKeys]);

  const longPressRef = useRef({ t: null, fired: false });
  const showInvMetaToast = (row) => {
    const name = (row?.name || "").trim() || "재료";
    const qty = row?.quantity != null ? `${row.quantity}${row.unit ? row.unit : ""}` : "";
    const where = [row?.storageType, row?.fridgeName].filter(Boolean).join(" · ");
    const msg = [name, qty, where].filter(Boolean).join(" / ");
    toast(msg || name);
  };

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
          {loadingSuggest && (
            <div className="complete-loading-overlay" role="status" aria-live="polite">
              <div className="complete-loading-card">
                <div className="complete-loading-buddy" aria-hidden>
                  <div className="complete-loading-bounce" />
                  <div className="complete-loading-sparkle s1" />
                  <div className="complete-loading-sparkle s2" />
                  <div className="complete-loading-sparkle s3" />
                </div>
                <div className="complete-loading-title">레시피를 만드는 중이에요…</div>
                <div className="complete-loading-sub">잠깐만 기다려주세요</div>
              </div>
            </div>
          )}
          <div className="complete-inventory-preview">
            <div className="complete-inventory-head">
              <strong>요리에 쓸 재료</strong>
              <span className="complete-inventory-summary">{invSummary}</span>
            </div>
            {inventory.length > 0 && (
              <div className="complete-inv-toolbar">
                <button type="button" className="complete-mini-btn" onClick={selectAllInventory}>
                  전체선택
                </button>
                <button type="button" className="complete-mini-btn" onClick={selectNoneInventory}>
                  전체해제
                </button>
              </div>
            )}
            {inventory.length > 0 ? (
              <div className="complete-inv-grid" role="list">
                {inventory.map((row) => {
                  const k = rowKey(row);
                  return (
                    <div key={k} className="complete-inv-tile" role="listitem">
                      <button
                        type="button"
                        className={`complete-inv-tile-btn ${selectedKeys.has(k) ? "selected" : ""}`}
                        onClick={() => toggleInvKey(k)}
                        onPointerDown={() => {
                          if (longPressRef.current.t) clearTimeout(longPressRef.current.t);
                          longPressRef.current.fired = false;
                          longPressRef.current.t = setTimeout(() => {
                            longPressRef.current.fired = true;
                            showInvMetaToast(row);
                          }, 520);
                        }}
                        onPointerUp={() => {
                          if (longPressRef.current.t) clearTimeout(longPressRef.current.t);
                        }}
                        onPointerCancel={() => {
                          if (longPressRef.current.t) clearTimeout(longPressRef.current.t);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          showInvMetaToast(row);
                        }}
                        title={`${row?.name || ""}${row?.quantity != null ? ` · ${row.quantity}${row.unit || ""}` : ""}${
                          row?.storageType ? ` · ${row.storageType}` : ""
                        }${row?.fridgeName ? ` · ${row.fridgeName}` : ""}`}
                      >
                        <span className="complete-inv-glyph" aria-hidden>
                          <CatalogIngredientGlyph
                            name={row.name}
                            userImageUrl={userIngredientImageMap[(row.name || "").trim().toLowerCase()] || undefined}
                            iconImageFile={systemIconFileByNameLower[(row.name || "").trim().toLowerCase()] || undefined}
                          />
                        </span>
                        <span className="complete-inv-name">{row.name}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="complete-inv-empty">냉장고에 재료를 등록하면 여기에서 고를 수 있어요.</p>
            )}
          </div>

          {/*<div className="complete-manual-add">*/}
          {/*  <div className="complete-section-label">장바구니에 직접 담기</div>*/}
          {/*  <p className="complete-manual-hint">재료 이름을 입력하고 목록에서 고르거나, 바로 담을 수 있어요.</p>*/}
          {/*  <div className="complete-manual-fields complete-manual-fields--single">*/}
          {/*    <div className="complete-autocomplete-wrap">*/}
          {/*      <input*/}
          {/*        type="text"*/}
          {/*        className="complete-manual-input"*/}
          {/*        placeholder="재료 이름 (예: 우유)"*/}
          {/*        value={manualName}*/}
          {/*        onChange={(e) => setManualName(e.target.value)}*/}
          {/*        autoComplete="off"*/}
          {/*      />*/}
          {/*      {catalogSuggestions.length > 0 && (*/}
          {/*        <ul className="complete-autocomplete-list" role="listbox">*/}
          {/*          {catalogSuggestions.map((s) => (*/}
          {/*            <li key={s.id ?? s.name}>*/}
          {/*              <button*/}
          {/*                type="button"*/}
          {/*                className="complete-autocomplete-item"*/}
          {/*                onMouseDown={(e) => e.preventDefault()}*/}
          {/*                onClick={() => pickCatalogSuggestion(s)}*/}
          {/*              >*/}
          {/*                {s.name}*/}
          {/*                {s.defaultUnit ? ` · ${s.defaultUnit}` : ""}*/}
          {/*              </button>*/}
          {/*            </li>*/}
          {/*          ))}*/}
          {/*        </ul>*/}
          {/*      )}*/}
          {/*    </div>*/}
          {/*    <button type="button" className="complete-secondary-btn" onClick={addManualToCart}>*/}
          {/*      담기*/}
          {/*    </button>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {recentRecipes.length > 0 && (
            <div className="complete-recent-block">
              <button
                type="button"
                className="complete-recent-toggle"
                onClick={() => setRecentOpen((v) => !v)}
              >
                <span className="complete-section-label">최근 추천 레시피 (최대 15개)</span>
                <span className="complete-recent-toggle-chev">{recentOpen ? "▲" : "▼"}</span>
              </button>
              {recentOpen && (
                <>
                  <ul className="complete-recent-list">
                    {recentRecipes.map((r, idx) => (
                      <li key={`${r.title}-${r.suggestedAt}-${idx}`}>
                        <button type="button" className="complete-recent-title" onClick={() => openRecentRecipe(idx)}>
                          {r.title || "제목 없음"}
                        </button>
                        {r.suggestedAt && (
                          <span className="complete-recent-when">
                            {new Date(r.suggestedAt).toLocaleString("ko-KR")}
                          </span>
                        )}
                        {openRecentIdx === idx && recentRecipes[idx] && (
                          <div className="complete-recent-detail">
                            <div className="complete-recipe-title" style={{ marginBottom: 8 }}>
                              {recentRecipes[idx].title || "제목 없음"}
                            </div>
                            <div className="complete-section-label">재료</div>
                            <ul className="complete-ingredient-list">
                              {(recentRecipes[idx].ingredients || []).map((ing, i) => (
                                <li key={i} className="complete-ingredient-line">
                                  <span className="complete-ingredient-main">
                                    {renderIngredientGlyph(ing.name)}
                                    <strong>{ing.name}</strong> {ing.amount}
                                    {ing.note ? ` · ${ing.note}` : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="complete-section-label">순서</div>
                            <ol>
                              {(recentRecipes[idx].steps || []).map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ol>
                            <div className="complete-recipe-actions">
                              <button
                                type="button"
                                className="complete-ghost-btn"
                                onClick={() => saveBook(recentRecipes[idx])}
                              >
                                <FiBookOpen size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                                레시피북에 저장
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

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
                <ul className="complete-ingredient-list">
                  {(r.ingredients || []).map((ing, i) => (
                    <li key={i} className="complete-ingredient-line">
                      <span className="complete-ingredient-main">
                        {renderIngredientGlyph(ing.name)}
                        <strong>{ing.name}</strong> {ing.amount}
                        {ing.note ? ` · ${ing.note}` : ""}
                      </span>
                      {ing.substitute?.trim() ? (
                        <span className="complete-ingredient-sub" title="대체 재료">
                          대체 {ing.substitute.trim()}
                        </span>
                      ) : null}
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
                        <div key={i} className="complete-missing-line">
                          <span>
                            · {m.name} {m.amount}
                            {m.note ? ` (${m.note})` : ""}
                          </span>
                          {m.substitute?.trim() ? (
                            <span className="complete-ingredient-sub" title="대체 재료">
                              대체 {m.substitute.trim()}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="complete-recipe-actions">
                  <button
                    type="button"
                    className="complete-secondary-btn"
                    onClick={() => addMissingToCart(r)}
                    disabled={!r?.missingIngredients?.length}
                    title={!r?.missingIngredients?.length ? "부족한 재료가 없습니다." : undefined}
                  >
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
          <div className="complete-manual-add">
            <div className="complete-section-label">장바구니에 직접 담기</div>
            <div className="complete-manual-fields complete-manual-fields--single">
              <div className="complete-autocomplete-wrap">
                <input
                  type="text"
                  className="complete-manual-input"
                  placeholder="재료 이름"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  autoComplete="off"
                />
                {catalogSuggestions.length > 0 && (
                  <ul className="complete-autocomplete-list" role="listbox">
                    {catalogSuggestions.map((s) => (
                      <li key={s.id ?? s.name}>
                        <button
                          type="button"
                          className="complete-autocomplete-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickCatalogSuggestion(s)}
                        >
                          {s.name}
                          {s.defaultUnit ? ` · ${s.defaultUnit}` : ""}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button type="button" className="complete-secondary-btn" onClick={addManualToCart}>
                담기
              </button>
            </div>
          </div>

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
                  <a
                    href={coupangPurchaseUrl(item.ingredientName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="complete-coupang-link"
                    title="쿠팡에서 구매 (파트너스)"
                  >
                    <FiExternalLink size={14} />
                    쿠팡
                  </a>
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
                      <ul className="complete-ingredient-list">
                        {(openBookRecipe.ingredients || []).map((ing, i) => (
                          <li key={i} className="complete-ingredient-line">
                            <span className="complete-ingredient-main">
                              {renderIngredientGlyph(ing.name)}
                              {ing.name} {ing.amount}
                              {ing.note ? ` · ${ing.note}` : ""}
                            </span>
                            {ing.substitute?.trim() ? (
                              <span className="complete-ingredient-sub" title="대체 재료">
                                대체 {ing.substitute.trim()}
                              </span>
                            ) : null}
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
