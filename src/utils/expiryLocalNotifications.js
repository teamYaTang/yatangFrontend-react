import { Capacitor } from "@capacitor/core";

const NOTIF_ID_MIN = 120000;
const NOTIF_ID_SPAN = 80000;
/** iOS pending local notification 한도 여유를 두고 최대 개수 제한 */
const MAX_SCHEDULE = 56;
const HOUR = 9;
const MINUTE = 0;

const PLACE_LABEL = {
  fridge: "냉장고",
  freezer: "냉동고",
  pantry: "실온",
};

function isNative() {
  return Capacitor.isNativePlatform?.() === true;
}

function parseLocalDate(yyyyMmDd) {
  const s = String(yyyyMmDd || "").slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

function atNine(date) {
  const d = new Date(date.getTime());
  d.setHours(HOUR, MINUTE, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function stableId(place, itemId, kind) {
  const key = `${place}:${itemId}:${kind}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return NOTIF_ID_MIN + (Math.abs(h) % NOTIF_ID_SPAN);
}

function buildBody(placeLabel, name, kind, nickname) {
  const nick = (nickname && String(nickname).trim()) || "회원";
  const itemName = (name && String(name).trim()) || "재료";
  const when =
    kind === "d1" ? "하루 남았습니다!" : "오늘까지 입니다!";
  return `🔔 ${placeLabel}에 보관중인 '${itemName}'의 유통기한이 ${when} 맛있는 레시피가 '${nick}'님을 기다리고 있어요 🥹`;
}

/**
 * 냉장/냉동/실온 재료의 D-1·당일 오전 9시 로컬 알림을 다시 잡는다.
 * 네이티브 앱에서만 동작. 웹에서는 no-op.
 */
export async function syncExpiryLocalNotifications({
  fridgeItems = [],
  freezerItems = [],
  pantryItems = [],
  nickname = "",
} = {}) {
  if (!isNative()) return { scheduled: 0, skipped: "web" };

  const { LocalNotifications } = await import("@capacitor/local-notifications");

  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== "granted") {
      return { scheduled: 0, skipped: "denied" };
    }
  } catch (e) {
    console.warn("LocalNotifications permission failed:", e);
    return { scheduled: 0, skipped: "error" };
  }

  try {
    if (Capacitor.getPlatform() === "android") {
      await LocalNotifications.createChannel({
        id: "expiry",
        name: "유통기한 알림",
        description: "재료 유통기한 D-1·당일 알림",
        importance: 4,
        visibility: 1,
      });
    }
  } catch (e) {
    console.warn("LocalNotifications channel:", e);
  }

  // 이전에 잡아 둔 유통기한 알림만 취소
  try {
    const pending = await LocalNotifications.getPending();
    const ours = (pending?.notifications || []).filter(
      (n) => typeof n.id === "number" && n.id >= NOTIF_ID_MIN && n.id < NOTIF_ID_MIN + NOTIF_ID_SPAN
    );
    if (ours.length > 0) {
      await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    }
  } catch (e) {
    console.warn("LocalNotifications cancel:", e);
  }

  const now = new Date();
  const candidates = [];

  const pushPlace = (items, place) => {
    const placeLabel = PLACE_LABEL[place] || place;
    for (const item of items || []) {
      if (!item?.expirationDate || !item?.name) continue;
      const exp = parseLocalDate(item.expirationDate);
      if (!exp) continue;
      const itemId = item.id ?? `${item.name}-${item.expirationDate}`;

      const d1At = atNine(addDays(exp, -1));
      if (d1At.getTime() > now.getTime()) {
        candidates.push({
          at: d1At,
          id: stableId(place, itemId, "d1"),
          body: buildBody(placeLabel, item.name, "d1", nickname),
        });
      }

      const ddayAt = atNine(exp);
      if (ddayAt.getTime() > now.getTime()) {
        candidates.push({
          at: ddayAt,
          id: stableId(place, itemId, "dday"),
          body: buildBody(placeLabel, item.name, "dday", nickname),
        });
      }
    }
  };

  pushPlace(fridgeItems, "fridge");
  pushPlace(freezerItems, "freezer");
  pushPlace(pantryItems, "pantry");

  candidates.sort((a, b) => a.at.getTime() - b.at.getTime());
  const selected = candidates.slice(0, MAX_SCHEDULE);

  // id 충돌 시 뒤에 온 항목 id 보정
  const used = new Set();
  const notifications = selected.map((c) => {
    let id = c.id;
    while (used.has(id)) id += 1;
    used.add(id);
    return {
      id,
      title: "집밥부자",
      body: c.body,
      schedule: { at: c.at, allowWhileIdle: true },
      channelId: "expiry",
      extra: { type: "expiry" },
    };
  });

  if (notifications.length === 0) {
    return { scheduled: 0 };
  }

  try {
    await LocalNotifications.schedule({ notifications });
    return { scheduled: notifications.length };
  } catch (e) {
    console.warn("LocalNotifications schedule failed:", e);
    return { scheduled: 0, skipped: "error" };
  }
}
