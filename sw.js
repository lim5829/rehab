const CACHE = "rehab-v1";
const ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});

self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : { title: "재활운동", body: "타이머가 완료됐어요!" };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      vibrate: [200, 100, 200],
      tag: "rehab-timer",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes("index.html") && "focus" in c) return c.focus();
      }
      return clients.openWindow("./index.html");
    })
  );
});

// 알람 예약 타이머 ID 저장
let alarmTimer = null;

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SCHEDULE_ALARM") {
    // 기존 예약 취소
    if (alarmTimer) { clearTimeout(alarmTimer); alarmTimer = null; }
    const { delayMs, title, body } = e.data;
    alarmTimer = setTimeout(() => {
      alarmTimer = null;
      self.registration.showNotification(title || "운동 완료!", {
        body: body || "운동이 끝났어요. 수고하셨습니다 💪",
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        vibrate: [300, 100, 300, 100, 300],
        tag: "rehab-timer",
        renotify: true,
      });
    }, delayMs);
  }
  if (e.data && e.data.type === "CANCEL_ALARM") {
    if (alarmTimer) { clearTimeout(alarmTimer); alarmTimer = null; }
    // 이미 표시된 알림도 닫기
    self.registration.getNotifications({ tag: "rehab-timer" })
      .then(list => list.forEach(n => n.close()));
  }
});
