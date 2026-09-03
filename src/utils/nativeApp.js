/**
 * Capacitor 네이티브 앱 초기화 (원격 URL 로드 시에도 이 JS가 실행됨)
 */
export async function initNativeApp() {
  const Cap = window.Capacitor;
  if (!Cap?.isNativePlatform?.()) return;

  document.documentElement.classList.add("cap-native");

  if (Cap.getPlatform?.() !== "ios") return;

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch (e) {
    console.warn("Keyboard plugin unavailable:", e);
  }
}
