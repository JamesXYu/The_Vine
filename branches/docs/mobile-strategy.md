# Mobile Strategy for The Vine

This document describes the recommended approach for making The Vine work well on phones. **Yes — fix responsive CSS first, then add PWA.** PWA improves how the app is installed and cached; it does not fix broken layouts.

---

## Recommended order

| Phase | What | Why this order |
|-------|------|----------------|
| **1** | Responsive CSS + mobile app shell | Fixes the actual layout problems users see today |
| **2** | Per-screen mobile polish | Makes every route usable, not just the shell |
| **3** | Targeted JS layout swaps (optional) | Only where CSS alone is not enough (mainly Calendar) |
| **4** | PWA (manifest + service worker) | Adds “Add to Home Screen” and faster repeat loads after the UI already works |

Do **not** skip Phase 1 and jump to PWA. An installable app with a broken layout feels worse, not better.

---

## Current problems (baseline)

The main blocker is the **fixed 240px sidebar** in `App.vue`. On a ~390px-wide phone, content gets squeezed into ~150px. `App.vue` has no mobile breakpoints.

Secondary issues:

- **HomeScreen** is a no-scroll desktop dashboard (`overflow: hidden`, 2-column grid). It needs a scrollable single-column layout on small screens.
- **LibScreen**, **AdminScreen**, and **ReadScreen** have no `@media` rules yet.
- **CalendarScreen** has partial mobile CSS but week view is still cramped on narrow widths.

The viewport meta tag in `public/index.html` is already correct. That is necessary but not sufficient.

---

## Phase 1 — Mobile app shell (highest impact)

**Goal:** Full-width content on phones; navigation that fits thumb reach.

**Changes in `App.vue`:**

- Hide or collapse the fixed sidebar below a breakpoint (e.g. `max-width: 768px`).
- Replace it with one of:
  - **Bottom tab bar** (recommended): Home, Library, Saved, Calendar, More (Settings, Admin, Notifications, Logout).
  - **Hamburger + slide-out drawer**: Keeps all nav items in one menu; slightly more taps for common routes.
- Reset `.main-content`: `margin-left: 0`, `width: 100%`, account for bottom nav height (`padding-bottom` on main).
- Use `100dvh` (with `100vh` fallback) where full-height layouts matter, to avoid iOS browser chrome issues.

**Success criteria:**

- Main content uses full screen width on phone.
- All primary routes are reachable without horizontal scrolling.
- No content hidden behind a permanent sidebar.

---

## Phase 2 — Per-screen responsive CSS

Apply mobile styles screen by screen. Prefer CSS `@media` over JavaScript width detection for layout.

### Home (`HomeScreen.vue`)

- Drop the “fit viewport, no scroll” model on mobile.
- Single column, vertical stack: welcome → scripture → announcement → recently updated → most saved.
- Allow vertical scroll; remove `overflow: hidden` on small breakpoints.
- Cards: one per row at `max-width: 768px` (partially done already).

### Library (`LibScreen.vue`)

- Stack header and search/actions vertically.
- Full-width search and primary buttons.
- Simplify or hide drag-and-drop affordances on touch if needed (or defer drag to long-press later).

### Read (`ReadScreen.vue`)

- Comfortable reading width with side padding; typography sized for mobile.

### Admin / Notes (`AdminScreen.vue`)

- Full-width editor toolbar; ensure TipTap controls wrap or scroll horizontally.
- Modal and form layouts stack to one column.

### Saved, Settings, Notifications

- Extend existing `@media (max-width: 768px)` rules where gaps remain.

### Calendar (`CalendarScreen.vue`)

- Keep sidebar stacked above calendar (already started at 768px).
- Ensure event modals and flyouts fit `96vw` / `100dvh`.
- If week view remains unusable, plan Phase 3 for an agenda/day list on mobile.

**Success criteria:**

- Every route is readable and tappable on a 375px-wide viewport.
- No horizontal overflow on any primary screen.
- Touch targets at least ~44×44px.

---

## Phase 3 — Targeted JS layout swaps (optional)

Use a small composable (e.g. `useBreakpoint()`) **only** where mobile UX should differ structurally, not as the default app-wide pattern.

**Good candidates:**

- **Calendar:** Week grid on desktop; day or agenda list on phone.
- **Home (optional):** Simpler feed component instead of fighting the dashboard grid in CSS.

**Avoid:**

- Duplicating entire screens for mobile/desktop unless the UX is truly different.
- Using JS detection instead of CSS for simple stacking, padding, or font-size changes.

---

## Phase 4 — PWA

Add PWA **after** Phases 1–2 (and Phase 3 if needed for Calendar) are acceptable on a real phone.

### What PWA gives you

- “Add to Home Screen” with app icon.
- Standalone display (minimal browser chrome).
- Faster repeat visits via cached static assets (JS, CSS, icons).

### What PWA does not give you

- Fixed sidebar or cramped grids — those require responsive CSS.
- Full offline editing with Supabase auth and live data (out of scope for v1; treat offline as a later enhancement).

### Minimal PWA checklist

1. **`public/manifest.webmanifest`**
   - `name`, `short_name`, `start_url`, `display: "standalone"`
   - Icons: 192×192 and 512×512 (maskable optional but recommended for Android).
   - `theme_color` / `background_color` aligned with `--neo-bg`.

2. **Link manifest in `public/index.html`**
   ```html
   <link rel="manifest" href="<%= BASE_URL %>manifest.webmanifest">
   <meta name="theme-color" content="…">
   ```

3. **Service worker**
   - Vue CLI: `@vue/cli-plugin-pwa` or Workbox via `vue.config.js`.
   - Cache static assets; use network-first or stale-while-revalidate for API/Supabase calls.
   - Do not cache authenticated API responses aggressively without a clear invalidation strategy.

4. **Apple meta tags** (iOS home screen)
   ```html
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="default">
   <link rel="apple-touch-icon" href="…">
   ```

5. **HTTPS in production** (required for service workers).

### PWA success criteria

- Install prompt or “Add to Home Screen” works on iOS Safari and Android Chrome.
- Installed app opens to a layout that matches the mobile-responsive web version.
- Login/session still works after install (test Supabase auth flow end-to end).

---

## What not to do

| Approach | Verdict |
|----------|---------|
| PWA before responsive CSS | ❌ Layout still broken; wasted effort |
| JS screen detection as primary layout strategy | ❌ Duplicate maintenance; use CSS first |
| Separate `/m/` mobile routes or second codebase | ❌ Too much duplication for this project size |
| Native wrapper (Capacitor) before web mobile works | ❌ WebView still shows the same broken UI |

---

## Suggested breakpoints

| Breakpoint | Usage |
|------------|--------|
| `max-width: 768px` | Phone: collapsed nav, single column, full width |
| `max-width: 1100px` | Tablet / short viewport: stack Home dashboard columns (already used) |
| `min-width: 769px` | Desktop: fixed sidebar, dashboard layouts |

Use one shared breakpoint constant or composable if JS layout swaps are added in Phase 3, but keep CSS as the source of truth for styling.

---

## Implementation priority (first slice)

For the fastest visible improvement with minimal scope:

1. **Mobile shell in `App.vue`** — bottom nav or drawer + full-width main.
2. **Home mobile layout** — scrollable single column.
3. **Smoke-test** Library, Calendar, Login on a real device or DevTools device mode.
4. **Iterate** on Lib, Read, Admin.
5. **PWA** once daily use on phone feels good.

---

## Testing checklist

Before calling mobile “done” (before PWA):

- [ ] iPhone Safari (375px and 390px widths)
- [ ] Android Chrome
- [ ] Portrait and landscape on Home and Calendar
- [ ] Login → navigate all tabs → logout
- [ ] No horizontal scroll on any main screen
- [ ] Modals and date pickers fit within viewport

Before calling PWA “done”:

- [ ] Install from Safari (iOS) and Chrome (Android)
- [ ] Cold start from home screen icon
- [ ] Session persists across app restarts
- [ ] App update strategy (service worker skipWaiting / prompt) documented

---

## Summary

**Optimal path:** Responsive CSS and mobile shell first → polish each screen → optional JS swaps for Calendar → PWA last as a delivery and performance layer, not a layout fix.
