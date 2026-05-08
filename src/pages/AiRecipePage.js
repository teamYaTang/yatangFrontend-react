import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiClock, FiUsers, FiShoppingCart, FiBookOpen } from "react-icons/fi";
import "../styles/Complete.css";
import { getAllItemsAcrossFridgesApi } from "../api/refrigerator";
import { getIngredientCatalogIconMapApi } from "../api/ingredientCatalog";
import { postRecipeSuggestApi, addShoppingBatchApi, saveRecipeToBookApi } from "../api/recipe";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { pushRecentAiRecipes, getRecentAiRecipes } from "../utils/recentAiRecipes";
import { useToast } from "../context/ToastContext";
import { CatalogIngredientGlyph } from "../constants/ingredientCatalogVisuals";
import { getIngredientImageMapApi } from "../api/ingredientImages";
import { getGuestIngredientImageMapForCustomCatalogOnly } from "../utils/guestIngredientImages";
import { playRecipeDoneSfx } from "../utils/sfx";
import {
  inventoryRowKey,
  normalizeMissingItems,
  missingItemsToShoppingLines,
  shoppingBatchErrorMessage,
} from "../utils/recipeCartShared";
import { notifyRecipeBookChanged, notifyShoppingChanged } from "../components/AppBottomNav";

const AiRecipePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [err, setErr] = useState("");

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [recentRecipes, setRecentRecipes] = useState(() => getRecentAiRecipes());
  const [recentOpen, setRecentOpen] = useState(false);
  const [openRecentIdx, setOpenRecentIdx] = useState(null);

  const [systemIconFileByNameLower, setSystemIconFileByNameLower] = useState({});
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

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    setSelectedKeys(new Set(inventory.map(inventoryRowKey)));
  }, [inventory]);

  const toggleInvKey = (k) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const selectAllInventory = () => {
    setSelectedKeys(new Set(inventory.map(inventoryRowKey)));
  };

  const selectNoneInventory = () => {
    setSelectedKeys(new Set());
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
    const selectedRows = inventory.filter((i) => selectedKeys.has(inventoryRowKey(i)));
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
    const items = normalizeMissingItems(recipe);
    if (!items.length) {
      toast("부족한 재료가 없습니다.", 1800);
      return;
    }
    const recipeTitle = (recipe?.title || "").trim() || "제목 없음";
    const lines = missingItemsToShoppingLines(items, recipeTitle);
    const nameList = items.map((m) => m.name).join(", ");
    try {
      await addShoppingBatchApi(lines);
      notifyShoppingChanged();
      toast(`장바구니에 ${nameList}이(가) 담겼습니다.`, 4200, {
        label: "이동",
        onClick: () => navigate("/cart"),
      });
    } catch (e) {
      toast(shoppingBatchErrorMessage(e, "담기에 실패했습니다."), 2800);
    }
  };

  const saveBook = async (recipe) => {
    try {
      await saveRecipeToBookApi(recipe);
      notifyRecipeBookChanged();
      toast("레시피북에 저장했습니다.");
    } catch (e) {
      toast(e.message || "저장에 실패했습니다.");
    }
  };

  const invSummary = useMemo(() => {
    if (inventory.length === 0) return "등록된 재료가 없습니다.";
    const n = selectedKeys.size;
    const sel = inventory.filter((i) => selectedKeys.has(inventoryRowKey(i)));
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
      <div className="complete-header complete-header--solo">
        <h1 className="complete-title">AI 레시피</h1>
      </div>

      <p className="complete-lead">
        보유 재료를 최대한 활용하는 요리를 AI가 약 3가지 제안합니다. 부족한 재료는 장바구니에 모으고, 마음에 드는 결과는 레시피북에 저장할 수 있어요.
      </p>

      {err && <div className="complete-error">{err}</div>}

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
              const k = inventoryRowKey(row);
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

      {recentRecipes.length > 0 && (
        <div className="complete-recent-block">
          <button type="button" className="complete-recent-toggle" onClick={() => setRecentOpen((v) => !v)}>
            <span className="complete-section-label">최근 추천 레시피 (최대 15개)</span>
            <span className="complete-recent-toggle-chev">{recentOpen ? "▲" : "▼"}</span>
          </button>
          {recentOpen && (
            <>
              <ul className="complete-recent-list">
                {recentRecipes.map((r, idx) => {
                  const recentMissing = normalizeMissingItems(r);
                  return (
                    <li key={`${r.title}-${r.suggestedAt}-${idx}`}>
                      <button type="button" className="complete-recent-title" onClick={() => openRecentRecipe(idx)}>
                        {r.title || "제목 없음"}
                      </button>
                      {r.suggestedAt && (
                        <span className="complete-recent-when">{new Date(r.suggestedAt).toLocaleString("ko-KR")}</span>
                      )}
                      {openRecentIdx === idx && r && (
                        <div className="complete-recent-detail">
                          <div className="complete-recipe-title" style={{ marginBottom: 8 }}>
                            {r.title || "제목 없음"}
                          </div>
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
                          {recentMissing.length > 0 && (
                            <>
                              <div className="complete-section-label">부족한 재료</div>
                              <div className="complete-missing">
                                {recentMissing.map((m, i) => (
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
                              className={
                                recentMissing.length === 0
                                  ? "complete-secondary-btn complete-secondary-btn--inactive"
                                  : "complete-secondary-btn"
                              }
                              onClick={() => addMissingToCart(r)}
                              aria-disabled={recentMissing.length === 0}
                              title={
                                recentMissing.length === 0
                                  ? "부족한 재료가 없습니다. 눌러 안내를 볼 수 있어요."
                                  : undefined
                              }
                            >
                              <FiShoppingCart size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                              부족 재료 장바구니에 담기
                            </button>
                            <button type="button" className="complete-ghost-btn" onClick={() => saveBook(r)}>
                              <FiBookOpen size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                              레시피북에 저장
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="complete-suggest-actions">
        <button type="button" className="complete-primary-btn" onClick={handleSuggest} disabled={loadingSuggest}>
          {loadingSuggest ? "추천 받는 중…" : "선택한 재료로 레시피 추천받기"}
        </button>
        {/*<p className="complete-hint">*/}
        {/*  모델: 서버에서 OpenAI(gpt-4o-mini 등)로 호출합니다. API 키가 없으면 오류가 날 수 있어요. 비로그인 시 AI 호출은 할 수*/}
        {/*  없습니다.*/}
        {/*</p>*/}
      </div>

      <div className="complete-recipes">
        {recipes.map((r, idx) => {
          const missingNorm = normalizeMissingItems(r);
          return (
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

              {missingNorm.length > 0 && (
                <>
                  <div className="complete-section-label">부족한 재료</div>
                  <div className="complete-missing">
                    {missingNorm.map((m, i) => (
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
                  className={
                    missingNorm.length === 0
                      ? "complete-secondary-btn complete-secondary-btn--inactive"
                      : "complete-secondary-btn"
                  }
                  onClick={() => addMissingToCart(r)}
                  aria-disabled={missingNorm.length === 0}
                  title={
                    missingNorm.length === 0 ? "부족한 재료가 없습니다. 눌러 안내를 볼 수 있어요." : undefined
                  }
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
          );
        })}
      </div>
    </div>
  );
};

export default AiRecipePage;
