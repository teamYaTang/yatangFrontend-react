/**
 * Capacitor 네이티브 앱 초기화 (원격 URL 로드 시에도 이 JS가 실행됨)
 */
export async function initNativeApp() {
  const Cap = window.Capacitor;
  if (!Cap?.isNativePlatform?.()) return;

  document.documentElement.classList.add("cap-native");
  disableNativeCallouts();

  if (Cap.getPlatform?.() !== "ios") return;

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch (e) {
    console.warn("Keyboard plugin unavailable:", e);
  }
}

/** iOS 롱프레스 텍스트 선택 / 이미지 저장 콜아웃 차단 */
function disableNativeCallouts() {
  const allowSelect = (el) =>
    el?.closest?.("input, textarea, [contenteditable='true']");

  const block = (e) => {
    if (allowSelect(e.target)) return;
    e.preventDefault();
  };

  document.addEventListener("contextmenu", block, { capture: true });
  document.addEventListener("selectstart", block, { capture: true });
  document.addEventListener(
    "dragstart",
    (e) => {
      if (e.target?.closest?.("img, svg, a")) e.preventDefault();
    },
    { capture: true }
  );
}
