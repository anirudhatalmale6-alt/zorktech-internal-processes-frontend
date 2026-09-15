# Zorktech — Internal Processes Frontend

Angular 22 frontend skeleton for the Zorktech internal processes system.

This is the foundation, not the finished product. It exists so that when the
brand guide and the API documentation arrive, applying them is a small, safe
change rather than a rewrite.

---

## Running it

```bash
npm install --legacy-peer-deps
npm start            # http://localhost:4200
npm run build        # production build into dist/
```

> `--legacy-peer-deps` is needed on npm 10.x: the default test toolchain's peer
> graph trips a known arborist bug (`Cannot read properties of null (reading
> 'edgesOut')`). It affects installation only, not the built application.

To see the authenticated screens before the login API is connected, open the
console on `/login` and run:

```js
sessionStorage.setItem('zt.access_token', 'demo');
sessionStorage.setItem('zt.user', JSON.stringify({
  id: '1', username: 'demo', displayName: 'Ana Duarte', roles: ['ADMIN'],
}));
```

then navigate to `/dashboard`.

---

## Applying the brand guide

**Almost everything lives in one file: `src/styles/_tokens.scss`.**

Every colour, font, size, radius, shadow and spacing step in the app resolves
to a variable declared there. No component hardcodes a hex code or a font name.
Applying the brand guide means editing that file — not sweeping through screens.

What to replace:

| In `_tokens.scss`            | From the brand guide                       |
| ---------------------------- | ------------------------------------------ |
| `--brand-primary` and friends | Primary / secondary / accent hex codes     |
| `--neutral-*`                | Grey ramp, if the guide specifies one      |
| `--font-sans`, `--font-display` | Typeface families                       |
| `--font-size-*`              | Type scale                                 |
| `--radius-*`                 | Corner radius rules                        |

Two things live outside that file:

1. **Font loading** — `src/index.html` currently pulls Inter from Google Fonts
   as a placeholder. For a licensed face, replace those tags with `@font-face`
   declarations pointing at self-hosted `.woff2` files. Self-hosting is faster
   and avoids an internal tool making a third-party request on every load.
2. **The logo** — placeholder "Z" marks in `layout/sidebar/sidebar.html` and
   `features/auth/login/login.html`. Both are sized to the collapsed rail, so
   dropping in the real SVG needs no layout change.

Current token values are deliberately bland placeholders, so anything not yet
branded is obvious on screen.

---

## Connecting the API

The API base URL is **not** compiled in. It is read at boot from
`public/config.json`:

```json
{ "apiBaseUrl": "https://api.zorktech.example", "environmentLabel": "staging" }
```

One build is then promoted unchanged from dev to staging to production, and
repointing the frontend is an edit to a text file on the server.

Where to wire things up:

- **`core/auth/auth.models.ts`** — login request/response shapes. Provisional,
  written against a conventional JWT endpoint. Reconcile with Swagger first.
- **`core/auth/auth.service.ts`** — the `auth/login` path, and the token
  storage strategy. If the backend issues an httpOnly cookie instead of a
  bearer token, the token handling here disappears and nothing else changes,
  because no other file reads the token.
- **`features/dashboard/dashboard.service.ts`** — every method returns sample
  data with the real call commented out directly above it.

Interceptors already handle, for every request:

- attaching the bearer token, but **only** to URLs under the configured API
  base (not merely same-origin — see the comment in `auth.interceptor.ts`);
- normalising any backend error shape into a single `ApiError` type, so no
  component has to guess between `error.message`, `error.detail` and
  `error.title`;
- bouncing an expired session to `/login` with a `returnUrl`, and toasting
  server/network failures — while deliberately *not* toasting validation
  errors, which belong next to the offending field.

---

## Structure

```
src/
  styles/            _tokens.scss ← the brand guide lands here
                     _reset.scss, _typography.scss, _controls.scss
  app/
    core/            config (runtime), http (api + errors), auth, notifications
    layout/          shell (grid + topbar), sidebar, viewport-gate, navigation
    shared/ui/       card, page-header, stat-tile, status-badge,
                     data-table, empty-state, bar-chart, toast-host
    features/        dashboard, auth/login, errors
```

Feature routes are lazy-loaded from the start. An internal tool grows a long
tail of admin screens most users never open; bundling them eagerly makes
everyone pay to download screens they have no permission to see.

---

## Decisions worth knowing about

**Desktop and tablet only.** `layout/viewport-gate` blocks the app below
900px (configurable) and explains why. It measures width rather than sniffing
the user agent — a narrow window on a desktop is just as unusable as a phone,
and UA sniffing is wrong about new devices by definition. Because the gate
handles it properly, `index.html` does *not* disable pinch-zoom; that would
break the app for anyone with low vision.

**Sorting is emitted, not performed.** `zt-data-table` raises `sortChange` and
renders whatever rows it is given. A table that sorts its own rows reorders
only the page already downloaded while looking exactly like it sorted the whole
result set.

**Charts are hand-drawn SVG, for now.** Two simple chart types didn't justify
60–200 KB of library plus its own opinions about colour to fight back into line
with the brand guide. Bar axes start at zero — a truncated axis can make a 5%
gap look like a doubling, which on a dashboard that drives decisions is not a
styling choice. If the real requirements need zooming, brushing or live
streaming, swapping in a library touches one component.

**`zt-stat-tile` takes `higherIsBetter`.** Set it `false` for metrics where a
rise is bad news — overdue tasks, cycle time, rejections. The arrow follows the
movement; the colour follows whether that movement is good, which is not the
same question.

**Guards are routing convenience, not security.** `authGuard` and `roleGuard`
decide what renders. Anyone can open devtools and change what the browser
believes. Every endpoint behind these screens must enforce permissions
server-side.

**Component style budget is raised** to 8 kB warn / 12 kB error in
`angular.json`. The default 4/8 is tuned for leaf components; the layout
chrome legitimately carries more CSS than that.

---

## Still to come

The screen list is not yet confirmed. Sidebar entries beyond Dashboard
(`Processes`, `My tasks`, `Reports`, `Catalogues`, `Users`, `Settings`) are a
plausible internal-process layout, not Zorktech's — they currently resolve to
the 404 page rather than failing silently, and get real routes as each is
built.
