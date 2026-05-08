import React, { useState, useEffect, useCallback } from "react";
import "../styles/Complete.css";
import { getRecipeBookListApi, getRecipeBookDetailApi, deleteRecipeFromBookApi } from "../api/recipe";
import { useToast } from "../context/ToastContext";
import { CatalogIngredientGlyph } from "../constants/ingredientCatalogVisuals";
import { useIngredientGlyphs } from "../hooks/useIngredientGlyphs";
import { notifyRecipeBookChanged } from "../components/AppBottomNav";

const RecipeBookPage = () => {
  const toast = useToast();
  const { systemIconFileByNameLower, userIngredientImageMap } = useIngredientGlyphs();
  const [bookList, setBookList] = useState([]);
  const [openBookId, setOpenBookId] = useState(null);
  const [openBookRecipe, setOpenBookRecipe] = useState(null);

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
    loadBook();
  }, [loadBook]);

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
      notifyRecipeBookChanged();
    } catch (e) {
      toast(e.message || "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="complete-page">
      <div className="complete-header complete-header--solo">
        <h1 className="complete-title">레시피북</h1>
      </div>

      <p className="complete-lead">AI 추천에서 저장한 요리를 언제든지 다시 열어볼 수 있어요.</p>

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
    </div>
  );
};

export default RecipeBookPage;
