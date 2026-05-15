import { useState, useEffect } from "react";
import { getIngredientCatalogIconMapApi } from "../api/ingredientCatalog";
import { getIngredientImageMapApi } from "../api/ingredientImages";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { getGuestIngredientImageMapForCustomCatalogOnly } from "../utils/guestIngredientImages";

/** 재료명 → 카탈로그 아이콘 / 사용자 이미지 (레시피·레시피북 글리프용) */
export function useIngredientGlyphs() {
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
        const m = await getIngredientImageMapApi();
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

  return { systemIconFileByNameLower, userIngredientImageMap };
}
