# Handoff — Phase 3: Full sweep (multi-agent)

**Status:** foundation complete, auth screens migrated
**Estimated effort:** 6–9 parallel agent workstreams + one integration/QA pass
**Goal:** migrate the remaining UI to the Material 3 foundation and remove duplicate styling patterns without changing behaviour.

---

## Why this is multi-agent

The remaining surface is large:

- ~31,000 JSX lines
- 125 files with `className`
- 73 pages, 56 components
- 94 files still contain raw `#3C0078`
- No visual regression suite

A single agent doing a sequential sweep will drift and produce inconsistent results. The safe model is:

1. One **foundation owner** for shared files.
2. Several **feature agents** working in disjoint folders.
3. One **integration agent** after merges.
4. One **QA agent**.

Use one worktree/branch per agent. Do not let two agents edit `src/index.css`, `src/components/UI/*`, or the same feature folder.

---

## Preconditions

Phase 2 must be merged first. The shared foundation must be stable:

```text
Frontend/src/index.css
Frontend/src/components/UI/*
Frontend/src/utils/cn.js
Frontend/DESIGN_SYSTEM.md
Frontend/src/pages/DesignSystemPreview.jsx
```

Read those files before starting. The preview is the visual contract:

```text
http://localhost:5200/#/design-system
```

Already migrated: login, signup, onboarding role cards, `googleAuthButton`, `TwoFactorSetupModal`.

---

## Agent topology

### Agent 0 — Foundation owner (one session, runs first)

**Owns:**

```text
Frontend/src/index.css
Frontend/src/components/UI/**
Frontend/src/utils/cn.js
Frontend/DESIGN_SYSTEM.md
Frontend/jest.config.cjs
```

Responsibilities:

- Keep tokens and primitives stable during the sweep.
- Add at most the missing primitives the feature agents request (e.g. `Tabs`, `Table`, `Toast`, `Avatar`).
- Review any request to add a new variant or token.
- Do not migrate feature pages.
- After feature merges, resolve shared-component changes and update docs.

### Agent 1 — Shell and layout

```text
Frontend/src/components/AppSidebar.jsx
Frontend/src/components/HeaderTopBar.jsx
Frontend/src/components/DashboardHeader.jsx
Frontend/src/components/PageCanvas.jsx
Frontend/src/components/courseSecondaryNav.jsx
Frontend/src/components/UI/navItem.jsx
Frontend/src/components/UI/sideNavItem.jsx
Frontend/src/components/UI/NavTooltip.jsx
Frontend/src/pages/dashboard.jsx
```

### Agent 2 — Dashboards

```text
Frontend/src/pages/dashboards/**
Frontend/src/components/assignmentsProgress.jsx
Frontend/src/components/courseGlance.jsx
Frontend/src/components/courseGlanceDisplay.jsx
Frontend/src/components/teacherCourseGlanceDisplay.jsx
Frontend/src/components/teacherShortcuts.jsx
Frontend/src/components/teacherTodoProgress.jsx
Frontend/src/components/UI/dashboardStatTile.jsx
```

### Agent 3 — Teacher courses

```text
Frontend/src/pages/courses/teacherCourses.jsx
Frontend/src/pages/courses/teacherCoursesComponents/**
```

Keep teacher-specific behaviour. Do not merge with student components yet.

### Agent 4 — Student courses

```text
Frontend/src/pages/courses/studentCourses.jsx
Frontend/src/pages/courses/studentCoursesComponents/**
```

Keep student-specific behaviour. Do not merge with teacher components yet.

### Agent 5 — Admin courses

```text
Frontend/src/pages/courses/adminCourses.jsx
Frontend/src/pages/courses/adminCoursesComponents/**
Frontend/src/pages/courses/adminCoursesViews/**
Frontend/src/pages/courses/createCoursePage.jsx
Frontend/src/pages/courses.jsx
```

### Agent 6 — Calendar and timeline

```text
Frontend/src/pages/calendar.jsx
Frontend/src/pages/calendars/**
Frontend/src/components/eventModal.jsx
Frontend/src/components/weeklyHorizontalTimeline.jsx
Frontend/src/components/todayTimeline.jsx
Frontend/src/components/UI/timelineEventCompressed.jsx
Frontend/src/components/UI/timelineEventExpanded.jsx
Frontend/src/components/UI/timelineNode.jsx
```

### Agent 7 — Profile and settings

```text
Frontend/src/pages/profile/**
Frontend/src/pages/settings.jsx
Frontend/src/components/Profile*.jsx
Frontend/src/components/UI/authInput.jsx
Frontend/src/components/ChipListEditor.jsx
```

`authInput.jsx` is still used by settings. Migrate settings to `Input` first, then retire `authInput` only if nothing else imports it.

### Agent 8 — Analytics and assistant

```text
Frontend/src/pages/analytics/**
Frontend/src/pages/Assistant/**
Frontend/src/components/assistantInput.jsx
Frontend/src/components/UI/toDoItem.jsx
```

### Agent 9 — Shared content components

```text
Frontend/src/components/NovelEditor.jsx
Frontend/src/components/NovelBlockMenu.jsx
Frontend/src/components/moduleAccordion.jsx
Frontend/src/components/UI/assignmentItem.jsx
Frontend/src/components/UI/announcementsItem.jsx
Frontend/src/components/UI/toDoItem.jsx
Frontend/src/components/UI/nextClassItem.jsx
Frontend/src/components/UI/attendanceChart.jsx
Frontend/src/components/UI/attendanceVisualizer.jsx
Frontend/src/components/UI/progressRing.jsx
```

### Agent 10 — Integration and QA

Runs only after the feature branches merge.

Responsibilities:

- Resolve merge conflicts.
- Remove duplicate implementations and dead styling helpers.
- Confirm no feature agent edited the foundation files.
- Run the full verification suite.
- Do the visual pass by role.
- Update `Frontend/DESIGN_SYSTEM.md` and `docs/`.

---

## Parallel execution rules

1. **Disjoint paths only.** An agent may edit only its assigned paths. Anything else must be requested from Agent 0.
2. **One worktree per agent.** Merge in dependency order: foundation → shell → dashboards → courses → calendar → profile → analytics → shared content → integration.
3. **No shared-file edits during the sweep.** If an agent needs a new primitive or token, it reports the request instead of adding it.
4. **Do not merge teacher/student duplicates during the sweep.** Note candidates for post-merge consolidation:
   - teacher vs student `Course*View` components
   - `navItem` vs `sideNavItem`
   - student vs teacher calendar views
5. **No behaviour changes.** Do not touch API calls, state logic, routing, permissions, auth, data shapes or event handlers.
6. **No new dependencies.**
7. **No MUI package.** This is Material 3 styling on Tailwind.

---

## Conversion map

### Colour

| Legacy | Replace with |
|---|---|
| `#3C0078` | `koru-primary` or `koru-on-primary-container` for text on pale containers |
| `#2A0054`, `#2a0055`, `#2f005f` | `koru-primary-hover` |
| `#FF8731`, `#e0722a` | `koru-accent`, `koru-accent-hover` |
| `#9BE9EA` | `koru-focus` |
| `#64748b`, `#6b7280`, `#475569` | `koru-on-surface-variant` |
| `#e5e7eb`, `#e5e5e5`, `gray-200` borders | `koru-outline-variant` — prefer tonal surfaces over new borders |
| white cards/panels | `koru-surface-container-lowest` or `koru-surface` |
| gray fills | `koru-surface-container`, `koru-surface-container-high`, `koru-surface-container-highest` |
| red error banners | `<Alert variant="error">` |
| green success banners | `<Alert variant="success">` |

### Shape

| Legacy | Replace with |
|---|---|
| `rounded-[28px]`, `rounded-[32px]` | `rounded-koru-3xl` |
| `rounded-[24px]` | `rounded-koru-2xl` |
| `rounded-[20px]`, `rounded-[22px]` | `rounded-koru-xl` |
| card radii | `Card` default radius, or `radius="lg"` |
| buttons | `rounded-koru-pill` via `Button` |
| inputs/selects | `rounded-koru-xs` via `Input` / `Select` |

### Components

| Pattern | Replace with |
|---|---|
| primary purple button | `<Button variant="filled">` |
| pale purple / gray button | `<Button variant="tonal">` or `variant="outlined"` |
| border-only button | `<Button variant="outlined">` |
| plain text action | `<Button variant="text">` |
| destructive button | `<Button variant="error">` |
| icon-only button | `<Button size="icon" aria-label="...">` |
| card/panel | `<Card variant=... tone=...>` |
| status pill | `<Badge variant=... dot>` |
| text input | `<Input>` |
| native select | `<Select>` |
| modal/dialog | `<Modal>` |
| empty state | `<EmptyState>` |
| loading placeholder | `<Skeleton>` / `<SkeletonText>` |
| page heading | `PageHeader` or `font-display text-koru-title` |
| error/success banner | `<Alert>` |

### Typography

- Body and UI: Google Sans, inherited from `:root`.
- Display and page headings: Gabarito through `font-display`.
- Heading weight: 500. Do not add `font-bold` to headings.
- Use `text-koru-body`, `text-koru-label`, `text-koru-caption` where they match.

---

## Verification per agent

Run from `Frontend/`:

```bash
npx eslint <files in the agent scope>
npm test -- --runInBand
npm run build
```

Then check:

- No raw brand hex in touched files:
  ```bash
  grep -R "#3C0078\|#2A0054\|#FF8731" <agent scope>
  ```
- No new arbitrary radius values outside the token scale.
- No new fixed overlays; use `Modal`.
- Keyboard focus remains visible.
- `prefers-reduced-motion` still works.
- Login, signup and onboarding are unaffected.

---

## Integration and QA pass

After all branches merge:

1. Run full tests and build.
2. Run a repo-wide raw-colour scan:
   ```bash
   grep -RIn "#3C0078\|#2A0054\|#FF8731\|#9BE9EA" Frontend/src --include='*.jsx'
   ```
   Remaining hits must be documented as intentional (logo SVG, brand assets).
3. Check for duplicate components:
   - `navItem` vs `sideNavItem`
   - teacher vs student course views
   - student vs teacher calendar views
4. Visual QA at desktop and narrow widths for:
   - student, teacher, admin
   - dashboard, courses, calendar, analytics, profile, settings, assistant
   - login, signup, onboarding
5. Update `Frontend/DESIGN_SYSTEM.md` with any new primitives.

---

## Definition of done

- All feature pages use primitives or token utilities for colour, radius and typography.
- No raw brand hex in feature JSX except the logo/asset files.
- No duplicated button/card/input/modal implementations remain outside the design system.
- Shared primitives remain stable and documented.
- Full tests pass.
- Production build passes.
- No regressions in auth, routing, permissions or data fetching.
- Handoff notes list any intentionally deferred files.
