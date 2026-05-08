import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiTrash2, FiExternalLink } from "react-icons/fi";
import "../styles/Complete.css";
import { getIngredientCatalogApi } from "../api/ingredientCatalog";
import {
  getShoppingListApi,
  addShoppingItemApi,
  toggleShoppingItemApi,
  deleteShoppingItemApi,
} from "../api/recipe";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { getGuestCatalogExtras } from "../utils/storage";
import { coupangPurchaseUrl } from "../utils/coupangLink";
import { useToast } from "../context/ToastContext";
import { notifyShoppingChanged } from "../components/AppBottomNav";

const CartPage = () => {
  const toast = useToast();
  const [shopping, setShopping] = useState([]);
  const [manualName, setManualName] = useState("");
  const [catalogSuggestions, setCatalogSuggestions] = useState([]);
  const catalogTimerRef = useRef(null);
  const suppressNextCatalogFetchRef = useRef(false);
  const userId = getUserIdFromToken();

  const loadShopping = useCallback(async () => {
    try {
      const data = await getShoppingListApi();
      setShopping(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setShopping([]);
    }
  }, []);

  useEffect(() => {
    loadShopping();
  }, [loadShopping]);

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
      notifyShoppingChanged();
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

  const toggleCart = async (item) => {
    try {
      await toggleShoppingItemApi(item.id);
      await loadShopping();
      notifyShoppingChanged();
    } catch (e) {
      toast(e.message || "처리에 실패했습니다.");
    }
  };

  const removeCart = async (item) => {
    try {
      await deleteShoppingItemApi(item.id);
      await loadShopping();
      notifyShoppingChanged();
    } catch (e) {
      toast(e.message || "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="complete-page">
      <div className="complete-header complete-header--solo">
        <h1 className="complete-title">장바구니</h1>
      </div>

      <p className="complete-lead">부족했던 재료와 직접 적은 항목을 한곳에서 관리해요.</p>

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
            <div key={item.id} className={`complete-cart-row ${item.checked ? "done" : ""}`}>
              <input
                type="checkbox"
                checked={!!item.checked}
                onChange={() => toggleCart(item)}
                aria-label="구매 완료"
              />
              <div className="complete-cart-meta">
                <strong>{item.ingredientName}</strong>
                <span className="complete-cart-source">
                  {item.sourceRecipeTitle ? `${item.sourceRecipeTitle} 레시피에서 추가` : "직접 추가"}
                </span>
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
              <button type="button" className="complete-ghost-btn" aria-label="삭제" onClick={() => removeCart(item)}>
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CartPage;
