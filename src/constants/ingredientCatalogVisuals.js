/**
 * 재료(카탈로그) 표시용 아이콘·이미지
 *
 * ── 이미지로 바꾸고 싶을 때 ──
 * 1) public/ingredient-icons/ 폴더에 PNG/WebP 등을 넣습니다. (예: kimchi.png)
 * 2) 아래 INGREDIENT_IMAGE_OVERRIDES 에 재료 이름(정확히 동일) → URL 을 추가합니다.
 *    예: 김치: `${process.env.PUBLIC_URL}/ingredient-icons/kimchi.png`
 * 3) 빌드 후 경로는 보통 /ingredient-icons/kimchi.png 로 접근됩니다.
 *
 * 이름별 오버라이드가 없으면 category(분류)에 맞는 react-icons(GI) 아이콘이 쓰입니다.
 * 직접 추가 행은 별도 아이콘을 씁니다.
 */

import React from "react";
import {
  MdBreakfastDining,
  MdCoffee,
  MdEmojiFoodBeverage,
  MdFastfood,
  MdIcecream,
  MdLocalDrink,
  MdLunchDining,
  MdRestaurant,
  MdRiceBowl,
  MdSetMeal,
  MdSpa,
} from "react-icons/md";
import { FiAnchor, FiDroplet, FiPackage, FiPlusCircle } from "react-icons/fi";

/** @type {Record<string, string>} 재료 이름(카탈로그와 동일) → public 기준 이미지 URL */
export const INGREDIENT_IMAGE_OVERRIDES = {
  // 예시 (파일 넣은 뒤 주석 해제):
  // 김치: `${process.env.PUBLIC_URL}/ingredient-icons/kimchi.png`,
};

const CATEGORY_ICON = {
  "장/양념/소스": FiDroplet,
  채소: MdEmojiFoodBeverage,
  "정육/계란/가공육": MdSetMeal,
  "수산/건어물": FiAnchor,
  "김치/반찬": MdLunchDining,
  "쌀/잡곡": MdRiceBowl,
  "우유/유제품": MdLocalDrink,
  과일: MdRestaurant,
  "통조림/즉석밥/면": MdFastfood,
  "간식/떡/빙과": MdIcecream,
  "커피/음료": MdCoffee,
  건강식품: MdSpa,
  베이커리: MdBreakfastDining,
  기타: FiPackage,
};

const DefaultIcon = FiPackage;

/**
 * @param {{ name: string; category?: string | null; custom?: boolean; className?: string; title?: string }} props
 */
export function CatalogIngredientGlyph({ name, category, custom, className = "", title }) {
  const trimmed = (name || "").trim();
  const img = trimmed && INGREDIENT_IMAGE_OVERRIDES[trimmed];
  if (img) {
    return (
      <img
        src={img}
        alt=""
        className={`ingredient-catalog-glyph-img ${className}`.trim()}
        title={title || trimmed}
      />
    );
  }

  let Icon = DefaultIcon;
  if (custom) {
    Icon = FiPlusCircle;
  } else if (category && CATEGORY_ICON[category]) {
    Icon = CATEGORY_ICON[category];
  }

  return <Icon className={`ingredient-catalog-glyph-icon ${className}`.trim()} aria-hidden title={title || trimmed} />;
}
