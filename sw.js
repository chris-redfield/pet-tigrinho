/**
 * Service worker. Only here so reminders can show on Android, where a page
 * cannot create a notification itself (`new Notification` throws there);
 * it must go through `registration.showNotification`.
 *
 * It caches nothing on purpose: the game is still changing daily, and a
 * stale cached copy is worse than a network request. Offline play and
 * install-as-app (PWA) can build on this later.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Tapping a reminder brings the game back (or opens it).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (open.length) return open[0].focus();
    return self.clients.openWindow('./');
  })());
});
