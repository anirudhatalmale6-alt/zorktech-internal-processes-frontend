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
    shared/ui/       card, page-header, stat-tile, status-badge, progress-bar,
                     data-table, filter-bar, pagination, detail-list,
                     empty-state, modal, toast-host
    shared/forms/    form-field, validation-messages
    features/        dashboard, processes (list + detail), auth/login, errors
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

**No charts, and no charting library.** The client confirmed twice that the
system is tables, forms and status panels. The dashboard's figures are shown as
KPI tiles, a by-status breakdown and a workload table rather than graphs. An
earlier hand-rolled SVG bar chart was removed rather than left in place unused —
dead code in a shared folder gets copied by whoever arrives next. It is in git
history if a chart is ever genuinely wanted.

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

## Tables, forms and status panels

Confirmed with the client that the system is mostly tables, forms and status
panels rather than charts, so that is where the component work went.

**`zt-data-table` + `zt-filter-bar` + `zt-pagination`** work as a set, and all
three are driven by a single `ProcessQuery` object. That object is the whole
state of the list — search, filters, page, page size, sort — which means it can
be written to the URL, restored on reload, and diffed to decide whether a
request is needed at all. The list component holds it in one signal and every
change flows through `switchMap`, so an in-flight request is cancelled rather
than allowed to land late and paint the wrong page.

Filtering and sorting always return to page 1. Staying on page 4 after changing
a filter shows the fourth page of a different result set, which reads as the
filter having done nothing.

**`zt-modal`** wraps the native `<dialog>` element. `showModal()` gives focus
trapping, Escape-to-close and inert background content correctly and for free —
all three are things hand-rolled overlays usually get wrong. Backdrop dismissal
is off by default: a half-filled form that vanishes on a stray click is the
worst thing a modal can do.

**`zt-form-field` + `validation-messages.ts`** own all validation wording in one
place, and wire `for`/`id`, `aria-describedby` and `aria-invalid` together so
the visible state and the announced state cannot disagree.

> Implementation note worth keeping: reactive forms are *not* signal-based.
> `control.touched` and `control.errors` are plain properties, so a `computed()`
> reading them depends on nothing and never recomputes — the error text renders
> once and then freezes, and `markAllAsTouched()` on submit displays nothing at
> all. `FormField` subscribes to `control.events` and bumps a revision signal to
> give the computed something that actually changes. Any new signal-based code
> reading a reactive form control needs the same treatment.

## Still to come

The screen list is not yet confirmed. Sidebar entries beyond Dashboard
(`Processes`, `My tasks`, `Reports`, `Catalogues`, `Users`, `Settings`) are a
plausible internal-process layout, not Zorktech's — they currently resolve to
the 404 page rather than failing silently, and get real routes as each is
built.
