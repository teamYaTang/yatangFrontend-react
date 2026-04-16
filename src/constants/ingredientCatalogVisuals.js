/**
 * 재료(카탈로그) 표시용 아이콘·이미지
 *
 * 우선순위: 사용자 업로드 URL → 백엔드 카탈로그 iconImageFile(영문 파일명) → 아래 INGREDIENT_IMAGE_OVERRIDES(로컬 폴백) → 분류 아이콘
 *
 * 운영에서는 DB `ingredient_catalog.icon_image_file`에 onion.png 등을 두고, 파일명 변경 시 DB만 수정하면 됩니다.
 *
 * 로컬 폴백만 쓸 때:
 * 1) public/ingredient-icons/ 에 PNG 등 배치
 * 2) INGREDIENT_IMAGE_OVERRIDES 에 재료명 → URL
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

const DEFAULT_ICON_DIR = "ingredient-icons";

/**
 * 백엔드 카탈로그의 iconImageFile(파일명 또는 하위경로/파일) → 브라우저용 절대 URL
 * @param {string | null | undefined} iconImageFile 예: onion.png, subdir/onion.png
 * @returns {string | null}
 */
export function resolvePublicIngredientIconUrl(iconImageFile) {
  const f = String(iconImageFile ?? "").trim();
  if (!f) return null;
  const base = process.env.PUBLIC_URL || "";
  if (f.includes("/")) {
    return `${base}/${f.replace(/^\/+/, "")}`;
  }
  return `${base}/${DEFAULT_ICON_DIR}/${f}`;
}

/** @type {Record<string, string>} 재료 이름 → public URL (DB/오프라인 폴백용) */
export const INGREDIENT_IMAGE_OVERRIDES = {
  // 양파: `${process.env.PUBLIC_URL}/ingredient-icons/onion.png`,
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
 * @param {{ name: string; category?: string | null; custom?: boolean; className?: string; title?: string; userImageUrl?: string | null; iconImageFile?: string | null }} props
 */
export function CatalogIngredientGlyph({ name, category, custom, className = "", title, userImageUrl, iconImageFile }) {
  const trimmed = (name || "").trim();
  if (userImageUrl && String(userImageUrl).trim()) {
    return (
      <img
        src={userImageUrl}
        alt=""
        className={`ingredient-catalog-glyph-img ${className}`.trim()}
        title={title || trimmed}
      />
    );
  }
  const catalogFileUrl = iconImageFile ? resolvePublicIngredientIconUrl(iconImageFile) : null;
  if (catalogFileUrl) {
    return (
      <img
        src={catalogFileUrl}
        alt=""
        className={`ingredient-catalog-glyph-img ${className}`.trim()}
        title={title || trimmed}
      />
    );
  }
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
