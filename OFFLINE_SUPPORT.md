# Offline support (staff, admin, B2B panels)

## What works offline now

- **The app itself loads offline.** A service worker (via `vite-plugin-pwa`)
  precaches the app's JS/CSS/HTML, so opening `/portal/staff` or
  `/portal/b2b` with no signal shows the real app instead of the
  browser's "no internet" page.
- **Viewing data.** Every Supabase read (bookings, catalog, B2B requests,
  staff list, etc.) is cached the moment it's fetched. Offline, screens
  show the last-synced data automatically.
- **Making changes.** Any write (updating a booking's status, approving
  a B2B request, editing the catalog, etc.) made while offline is saved
  to the device and queued — the UI proceeds as if it succeeded. A
  banner at the top says "You're offline — changes are being saved on
  this device." The queue replays automatically the moment the device
  reconnects (or via the "Sync now" button).

This is a **generic, app-wide** mechanism (`src/lib/offlineFetch.js` +
`src/lib/offlineQueue.js`) — it works the same way for every write in
every one of the three panels, not just a hand-picked few buttons,
because it operates at the network-request level rather than being
wired into each screen individually.

## Known limitations — please read before relying on this for critical data entry

1. **Optimistic, not confirmed.** When a change is queued offline, the
   app shows success immediately — it can't know yet whether the server
   will actually accept it (e.g. a permission or validation issue). If a
   queued change fails once replayed, it moves to a **"What failed to
   sync?"** list in the banner instead of silently vanishing, but nobody
   is notified in the moment — check that list after reconnecting if
   you did a lot of offline work.
2. **No conflict resolution.** If two people edit the same booking while
   both are offline, whichever queued change syncs last simply
   overwrites the other — there's no merge or warning.
3. **File uploads aren't queued.** Generating a report, uploading a
   prescription, etc. still need a live connection at the moment you hit
   "Generate"/"Upload" (Cloudinary/Supabase Storage calls aren't routed
   through the offline queue). Only database reads/writes are covered.
4. **Cached reads can be stale.** A list shown offline reflects whatever
   was last fetched *on that device* — if another staff member changed
   something while you were offline, you won't see it until you're back
   online and that screen refetches.
5. **GitHub Pages sub-path.** The site deploys under `/Plasma-Care-/`,
   which the service worker's scope should follow automatically — but
   this hasn't been verified against an actual production build/deploy
   yet. If the portal doesn't register a service worker after deploying
   this, check the browser's Application/Service Workers panel for scope
   errors first.

## Where the pieces live

- `vite.config.js` — `VitePWA(...)` — app-shell precaching + read caching
- `src/lib/offlineFetch.js` — intercepts Supabase writes when offline
- `src/lib/offlineQueue.js` — the queue itself (localStorage-backed) +
  replay-on-reconnect logic
- `src/portal/components/OfflineBanner.jsx` — the status banner, mounted
  once in `PortalRoutes.jsx` so it covers staff, admin, and B2B alike
