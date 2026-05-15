import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {FiShoppingCart, FiEdit2, FiHome, FiZap, FiStar, FiEdit, FiBookmark} from "react-icons/fi";
import { CgSmartHomeRefrigerator } from "react-icons/cg";
import { BiDish, BiFoodMenu } from "react-icons/bi";
import "../styles/AppBottomNav.css";
import { getShoppingListApi, getRecipeBookListApi } from "../api/recipe";
import { mainNavIndex } from "../shared/mainNavConfig";

const REFRESH_SHOPPING = "yatang-shopping-changed";
const REFRESH_BOOK = "yatang-recipe-book-changed";

export function notifyShoppingChanged() {
  window.dispatchEvent(new Event(REFRESH_SHOPPING));
}

export function notifyRecipeBookChanged() {
  window.dispatchEvent(new Event(REFRESH_BOOK));
}

export default function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [cartCount, setCartCount] = useState(0);
  const [bookCount, setBookCount] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([getShoppingListApi(), getRecipeBookListApi()]);
      setCartCount(Array.isArray(s) ? s.length : 0);
      setBookCount(Array.isArray(b) ? b.length : 0);
    } catch {
      setCartCount(0);
      setBookCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [pathname, refreshCounts]);

  useEffect(() => {
    const onRefresh = () => refreshCounts();
    window.addEventListener(REFRESH_SHOPPING, onRefresh);
    window.addEventListener(REFRESH_BOOK, onRefresh);
    return () => {
      window.removeEventListener(REFRESH_SHOPPING, onRefresh);
      window.removeEventListener(REFRESH_BOOK, onRefresh);
    };
  }, [refreshCounts]);

  const idx = mainNavIndex(pathname);
  const onMain = idx !== null;

  const go = (path) => {
    if (location.pathname !== path) navigate(path);
  };

  return (
    <nav className="app-bottom-nav" aria-label="주요 메뉴">
      <div className="app-bottom-nav__inner">
        <button
          type="button"
          className={`app-bottom-nav__item ${onMain && idx === 0 ? "app-bottom-nav__item--active" : ""}`}
          onClick={() => go("/cart")}
          aria-current={idx === 0 ? "page" : undefined}
        >
          <span className="app-bottom-nav__icon-wrap">
            <FiShoppingCart size={22} aria-hidden />
            {cartCount > 0 ? <span className="app-bottom-nav__badge">{cartCount > 99 ? "99+" : cartCount}</span> : null}
          </span>
          <span className="app-bottom-nav__label">장바구니</span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__item ${onMain && idx === 1 ? "app-bottom-nav__item--active" : ""}`}
          onClick={() => go("/ingredient")}
          aria-current={idx === 1 ? "page" : undefined}
        >
          <span className="app-bottom-nav__icon-wrap">
            <FiEdit size={22} aria-hidden />
          </span>
          <span className="app-bottom-nav__label">재료</span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__item app-bottom-nav__item--hub ${onMain && idx === 2 ? "app-bottom-nav__item--active" : ""}`}
          onClick={() => go("/refrigerator")}
          aria-current={idx === 2 ? "page" : undefined}
        >
          <span className="app-bottom-nav__icon-wrap">
            <CgSmartHomeRefrigerator size={26} aria-hidden />
          </span>
          <span className="app-bottom-nav__label">냉장고</span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__item ${onMain && idx === 3 ? "app-bottom-nav__item--active" : ""}`}
          onClick={() => go("/ai-recipe")}
          aria-current={idx === 3 ? "page" : undefined}
        >
          <span className="app-bottom-nav__icon-wrap">
            <BiDish size={22} aria-hidden />
          </span>
          <span className="app-bottom-nav__label">AI</span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__item ${onMain && idx === 4 ? "app-bottom-nav__item--active" : ""}`}
          onClick={() => go("/recipe-book")}
          aria-current={idx === 4 ? "page" : undefined}
        >
          <span className="app-bottom-nav__icon-wrap">
            <BiFoodMenu size={22} aria-hidden />
            {bookCount > 0 ? <span className="app-bottom-nav__badge">{bookCount > 99 ? "99+" : bookCount}</span> : null}
          </span>
          <span className="app-bottom-nav__label">레시피북</span>
        </button>
      </div>
    </nav>
  );
}
