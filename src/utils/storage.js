const KEYS = {
  FRIDGES: "guest_fridges",
  FRIDGE_ITEMS: (fridgeId) => `guest_fridge_items_${fridgeId}`,
  FREEZER_ITEMS: (fridgeId) => `guest_freezer_items_${fridgeId}`,
  PANTRY: "guest_pantry_items",
};

// 고유 ID 생성
const generateId = () => `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ───────── 냉장고 ─────────

export const getLocalFridges = () => {
  const data = localStorage.getItem(KEYS.FRIDGES);
  if (!data) {
    // 최초 접근 시 기본 냉장고 자동 생성
    const defaultFridge = {
      id: generateId(),
      name: "나의 냉장고",
      isMain: true,
      description: "",
    };
    localStorage.setItem(KEYS.FRIDGES, JSON.stringify([defaultFridge]));
    return [defaultFridge];
  }
  return JSON.parse(data);
};

export const createLocalFridge = (name, isMain = false) => {
  const fridges = getLocalFridges();
  const newFridge = { id: generateId(), name, isMain, description: "" };
  // isMain이면 기존 메인 해제
  if (isMain) {
    fridges.forEach((f) => (f.isMain = false));
  }
  fridges.push(newFridge);
  localStorage.setItem(KEYS.FRIDGES, JSON.stringify(fridges));
  return newFridge;
};

export const updateLocalFridge = (fridgeId, updateData) => {
  const fridges = getLocalFridges();
  const idx = fridges.findIndex((f) => f.id === fridgeId);
  if (idx === -1) throw new Error("냉장고를 찾을 수 없습니다.");
  fridges[idx] = { ...fridges[idx], ...updateData };
  localStorage.setItem(KEYS.FRIDGES, JSON.stringify(fridges));
  return fridges[idx];
};

export const deleteLocalFridge = (fridgeId) => {
  const fridges = getLocalFridges().filter((f) => f.id !== fridgeId);
  localStorage.setItem(KEYS.FRIDGES, JSON.stringify(fridges));
  localStorage.removeItem(KEYS.FRIDGE_ITEMS(fridgeId));
  localStorage.removeItem(KEYS.FREEZER_ITEMS(fridgeId));
};

// ───────── 냉장실 아이템 ─────────

export const getLocalFridgeItems = (fridgeId) => {
  const data = localStorage.getItem(KEYS.FRIDGE_ITEMS(fridgeId));
  return data ? JSON.parse(data) : [];
};

export const createLocalFridgeItem = (fridgeId, itemData) => {
  const items = getLocalFridgeItems(fridgeId);
  const newItem = { id: generateId(), createdAt: new Date().toISOString(), ...itemData };
  items.push(newItem);
  localStorage.setItem(KEYS.FRIDGE_ITEMS(fridgeId), JSON.stringify(items));
  return newItem;
};

export const updateLocalFridgeItem = (fridgeId, itemId, itemData) => {
  const items = getLocalFridgeItems(fridgeId);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) throw new Error("아이템을 찾을 수 없습니다.");
  items[idx] = { ...items[idx], ...itemData };
  localStorage.setItem(KEYS.FRIDGE_ITEMS(fridgeId), JSON.stringify(items));
  return items[idx];
};

export const deleteLocalFridgeItem = (fridgeId, itemId) => {
  const items = getLocalFridgeItems(fridgeId).filter((i) => i.id !== itemId);
  localStorage.setItem(KEYS.FRIDGE_ITEMS(fridgeId), JSON.stringify(items));
};

// ───────── 냉동실 아이템 ─────────

export const getLocalFreezerItems = (fridgeId) => {
  const data = localStorage.getItem(KEYS.FREEZER_ITEMS(fridgeId));
  return data ? JSON.parse(data) : [];
};

export const createLocalFreezerItem = (fridgeId, itemData) => {
  const items = getLocalFreezerItems(fridgeId);
  const newItem = { id: generateId(), createdAt: new Date().toISOString(), ...itemData };
  items.push(newItem);
  localStorage.setItem(KEYS.FREEZER_ITEMS(fridgeId), JSON.stringify(items));
  return newItem;
};

export const updateLocalFreezerItem = (fridgeId, itemId, itemData) => {
  const items = getLocalFreezerItems(fridgeId);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) throw new Error("아이템을 찾을 수 없습니다.");
  items[idx] = { ...items[idx], ...itemData };
  localStorage.setItem(KEYS.FREEZER_ITEMS(fridgeId), JSON.stringify(items));
  return items[idx];
};

export const deleteLocalFreezerItem = (fridgeId, itemId) => {
  const items = getLocalFreezerItems(fridgeId).filter((i) => i.id !== itemId);
  localStorage.setItem(KEYS.FREEZER_ITEMS(fridgeId), JSON.stringify(items));
};

// ───────── 상온보관 (게스트당 하나의 목록) ─────────

export const getLocalPantryItems = () => {
  const data = localStorage.getItem(KEYS.PANTRY);
  return data ? JSON.parse(data) : [];
};

export const createLocalPantryItem = (itemData) => {
  const items = getLocalPantryItems();
  const newItem = { id: generateId(), createdAt: new Date().toISOString(), ...itemData };
  items.push(newItem);
  localStorage.setItem(KEYS.PANTRY, JSON.stringify(items));
  return newItem;
};

export const updateLocalPantryItem = (itemId, itemData) => {
  const items = getLocalPantryItems();
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) throw new Error("아이템을 찾을 수 없습니다.");
  items[idx] = { ...items[idx], ...itemData };
  localStorage.setItem(KEYS.PANTRY, JSON.stringify(items));
  return items[idx];
};

export const deleteLocalPantryItem = (itemId) => {
  const items = getLocalPantryItems().filter((i) => i.id !== itemId);
  localStorage.setItem(KEYS.PANTRY, JSON.stringify(items));
};

// ───────── 마이그레이션용 전체 데이터 추출 ─────────

export const getAllGuestData = () => ({
  fridges: getLocalFridges().map((fridge) => ({
    ...fridge,
    fridgeItems: getLocalFridgeItems(fridge.id),
    freezerItems: getLocalFreezerItems(fridge.id),
  })),
  pantryItems: getLocalPantryItems(),
});

// 게스트 데이터 전체 삭제 (로그인 후 마이그레이션 완료 시 호출)
export const clearAllGuestData = () => {
  const fridges = getLocalFridges();
  fridges.forEach((f) => {
    localStorage.removeItem(KEYS.FRIDGE_ITEMS(f.id));
    localStorage.removeItem(KEYS.FREEZER_ITEMS(f.id));
  });
  localStorage.removeItem(KEYS.FRIDGES);
  localStorage.removeItem(KEYS.PANTRY);
};

export const hasGuestData = () => {
  const fridges = getLocalFridges();
  return (
    getLocalPantryItems().length > 0 ||
    fridges.some(
      (f) =>
        getLocalFridgeItems(f.id).length > 0 ||
        getLocalFreezerItems(f.id).length > 0
    )
  );
};

// ───────── 게스트 전용: 카탈로그에 직접 추가한 재료 이름 (서버 미연동) ─────────

const GUEST_CATALOG_EXTRAS = "guest_ingredient_catalog_extras";

export const getGuestCatalogExtras = () => {
  const raw = localStorage.getItem(GUEST_CATALOG_EXTRAS);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const addGuestCatalogExtra = (name, defaultUnit = "개") => {
  const trimmed = name?.trim();
  if (!trimmed) {
    throw new Error("이름을 입력해주세요.");
  }
  const unit = defaultUnit?.trim() || "개";
  const list = getGuestCatalogExtras();
  if (list.some((x) => x.name === trimmed)) {
    return list;
  }
  list.push({ name: trimmed, defaultUnit: unit });
  localStorage.setItem(GUEST_CATALOG_EXTRAS, JSON.stringify(list));
  return list;
};

/** 직접 추가한 카탈로그 항목 제거 (이름 일치, 대소문자 구분) */
export const removeGuestCatalogExtra = (name) => {
  const trimmed = name?.trim();
  if (!trimmed) return getGuestCatalogExtras();
  const list = getGuestCatalogExtras().filter((x) => x.name !== trimmed);
  localStorage.setItem(GUEST_CATALOG_EXTRAS, JSON.stringify(list));
  return list;
};

// ───────── 게스트: 장바구니 · 레시피북 (로그인 시 서버로 이전) ─────────

const GUEST_SHOPPING = "yatang_guest_shopping";
const GUEST_RECIPE_BOOK = "yatang_guest_recipe_book";

export const getGuestShoppingList = () => {
  const raw = localStorage.getItem(GUEST_SHOPPING);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const saveGuestShoppingList = (list) => {
  localStorage.setItem(GUEST_SHOPPING, JSON.stringify(list));
  return list;
};

export const addGuestShoppingBatch = (lines) => {
  if (!lines?.length) return getGuestShoppingList();
  const list = getGuestShoppingList();
  const now = Date.now();
  lines.forEach((line, i) => {
    if (!line?.ingredientName?.trim()) return;
    list.push({
      id: `gshop-${now}-${i}`,
      ingredientName: line.ingredientName.trim(),
      quantityNote: line.quantityNote?.trim() || "",
      unit: line.unit?.trim() || "",
      sourceRecipeTitle: line.sourceRecipeTitle?.trim() || "",
      checked: false,
      createdAt: new Date().toISOString(),
    });
  });
  return saveGuestShoppingList(list);
};

export const toggleGuestShoppingItem = (id) => {
  const list = getGuestShoppingList().map((x) =>
    x.id === id ? { ...x, checked: !x.checked } : x,
  );
  return saveGuestShoppingList(list);
};

export const deleteGuestShoppingItem = (id) => {
  return saveGuestShoppingList(getGuestShoppingList().filter((x) => x.id !== id));
};

export const getGuestRecipeBook = () => {
  const raw = localStorage.getItem(GUEST_RECIPE_BOOK);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const addGuestRecipeBook = (recipe) => {
  const list = getGuestRecipeBook();
  const id = `grep-${Date.now()}`;
  const title = recipe?.title?.trim() || "제목 없음";
  const row = {
    id,
    title,
    servings: recipe?.servings ?? null,
    cookMinutes: recipe?.cookMinutes ?? null,
    payloadJson: JSON.stringify(recipe),
    createdAt: new Date().toISOString(),
  };
  list.unshift(row);
  localStorage.setItem(GUEST_RECIPE_BOOK, JSON.stringify(list));
  return {
    id: row.id,
    title: row.title,
    servings: row.servings,
    cookMinutes: row.cookMinutes,
    createdAt: row.createdAt,
  };
};

export const deleteGuestRecipeBook = (id) => {
  const next = getGuestRecipeBook().filter((x) => x.id !== id);
  localStorage.setItem(GUEST_RECIPE_BOOK, JSON.stringify(next));
  return next;
};
