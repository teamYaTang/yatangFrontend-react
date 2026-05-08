/** 하단 탭 순서: 장바구니 → 재료 → 냉장고(홈) → AI 레시피 → 레시피북 */

export const MAIN_NAV_ORDER = ["/cart", "/ingredient", "/refrigerator", "/ai-recipe", "/recipe-book"];

export function mainNavIndex(pathname) {
  if (pathname === "/cart") return 0;
  if (pathname === "/ingredient") return 1;
  if (pathname === "/" || pathname === "/refrigerator") return 2;
  if (pathname === "/ai-recipe") return 3;
  if (pathname === "/recipe-book") return 4;
  return null;
}

export function isMainNavPath(pathname) {
  return mainNavIndex(pathname) !== null;
}
