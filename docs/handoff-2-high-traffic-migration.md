# Handoff — Phase 2: High-traffic migration

**Status:** foundation complete, auth screens migrated
**Estimated effort:** one or two focused agent sessions
**Goal:** migrate the highest-traffic shared surfaces and screens to the Material 3 foundation without changing behaviour.

---

## Current state

The design system lives in:

```text
Frontend/src/index.css                  # tokens, global styles, motion
Frontend/src/components/UI/             # primitives + barrel export
Frontend/src/utils/cn.js                # class joiner
Frontend/DESIGN_SYSTEM.md               # token/component contract
Frontend/src/pages/DesignSystemPreview.jsx
```

Preview route:

```text
http://localhost:5200/#/design-system
```

Already migrated:

- Login: `Frontend/src/pages/login.jsx`
- Signup: `Frontend/src/pages/signup.jsx`
- Onboarding role cards: `Frontend/src/components/UI/onboardingButton.jsx`
- Auth-adjacent: `googleAuthButton.jsx`, `TwoFactorSetupModal.jsx`
- New primitives: `Alert.jsx`, `Select.jsx`

Do not redo these unless fixing a regression.

---

## Scope

### Session A — shell, navigation, dashboards

| Path | Notes |
|---|---|
| `Frontend/src/components/AppSidebar.jsx` | Highest priority shared shell |
| `Frontend/src/components/HeaderTopBar.jsx` | Page header consistency |
| `Frontend/src/components/DashboardHeader.jsx` | Role dashboard header |
| `Frontend/src/components/UI/dashboardStatTile.jsx` | Migrate to `Card` + tokens |
| `Frontend/src/components/courseGlance.jsx` | Shared course summary card |
| `Frontend/src/components/courseGlanceDisplay.jsx` | Shared course summary |
| `Frontend/src/components/teacherCourseGlanceDisplay.jsx` | Teacher variant |
| `Frontend/src/components/teacherShortcuts.jsx` | Dashboard actions |
| `Frontend/src/components/teacherTodoProgress.jsx` | Dashboard card |
| `Frontend/src/components/assignmentsProgress.jsx` | Dashboard card |
| `Frontend/src/pages/dashboards/adminDashboard.jsx` | Admin dashboard |
| `Frontend/src/pages/dashboards/teacherDashboard.jsx` | Teacher dashboard |
| `Frontend/src/pages/dashboards/studentDashboard.jsx` | Student dashboard |
| `Frontend/src/pages/dashboard.jsx` | Role router only — keep logic |

### Session B — top course, settings and profile screens

| Path | Notes |
|---|---|
| `Frontend/src/pages/courses/teacherCoursesComponents/CourseAssignmentsView.jsx` | 1,349 lines; migrate styles only, do not refactor logic |
| `Frontend/src/pages/courses/adminCoursesViews/AdminCohortsView.jsx` | 1,016 lines |
| `Frontend/src/pages/courses/assignmentDetail.jsx` | 827 lines |
| `Frontend/src/pages/settings.jsx` | 743 lines |
| `Frontend/src/pages/profile/profile.jsx` | 767 lines |
| `Frontend/src/pages/courses/createCoursePage.jsx` | 535 lines |
| `Frontend/src/pages/courses/teacherCoursesComponents/CourseGradesView.jsx` | 606 lines |
| `Frontend/src/pages/courses/teacherCoursesComponents/CourseModulesView.jsx` | 590 lines |
| `Frontend/src/pages/courses/teacherCoursesComponents/CourseAttendanceView.jsx` | 549 lines |

If Session B runs out of time, stop after the first four rows. Do not partially migrate a single large file.

---

## Migration rules

1. **Use primitives first.** Import from `../components/UI` (or `../../components/UI` depending on depth):
   - `Button`, `Input`, `Select`, `Card`, `Badge`, `Alert`, `EmptyState`, `PageHeader`, `Modal`, `Skeleton`, `SkeletonText`.
2. **No new raw hex values.** Replace them with tokens:
   - `#3C0078` → `koru-primary` (solid) or `koru-primary-container` (pale surface)
   - `#2A0054`, `#2a0055`, `#2f005f` → `koru-primary-hover`
   - `#FF8731` → `koru-accent`
   - grays/slate text → `koru-on-surface-variant`
   - pale borders → `koru-outline-variant`
   - white cards → `koru-surface-container-lowest`
3. **Use the shape scale.** No new arbitrary radii.
   - Dialogs/auth cards: `rounded-koru-3xl`
   - Cards: `rounded-koru-md` (or `radius="lg"` when the layout needs it)
   - Buttons: `rounded-koru-pill`
   - Inputs/selects: `rounded-koru-xs`
4. **Buttons:** use M3 variants:
   - primary action → `variant="filled"`
   - secondary action → `variant="tonal"`
   - low emphasis → `variant="text"` or `variant="outlined"`
   - destructive → `variant="error"`
   - icon-only → `size="icon"` with an `aria-label`
5. **Cards:** use `variant` for depth and `tone` for colour.
   - `variant="filled" | "elevated" | "outlined" | "interactive"`
   - `tone="neutral" | "muted" | "low" | "surface" | "brand" | "secondary" | "tertiary" | "accent" | "info" | "success" | "warning" | "error"`
6. **Inputs:** use the `Input` primitive. It is a white filled field on tonal cards. Use `Select` for native dropdowns.
7. **Feedback:** use `Alert` for errors, success, warnings and info. Do not build new red/green banners.
8. **Empty states:** use `EmptyState` instead of ad-hoc “nothing here” blocks.
9. **Headings:** `font-display text-koru-title` / `text-koru-heading`. Body text inherits Google Sans.
10. **Modals:** use `Modal`; do not add fixed overlays. Keep focus restoration, Escape and scrim behaviour.

---

## Hard constraints

- Do **not** add the MUI package. The system is Material 3 styling on Tailwind.
- Do **not** edit `src/index.css` tokens or shared primitives unless a bug blocks the migration. If a primitive change is needed, stop and report it.
- Do **not** change API calls, state machines, routing, auth, data shapes or event handlers.
- Do **not** combine visual migration with component extraction or file splitting.
- Do **not** merge the teacher/student course components in this phase.
- Do **not** delete existing files or `*.bak` files.
- Keep role-specific layouts intact. Teachers, students and admins should still feel distinct.

---

## Verification

Run from `Frontend/`:

```bash
npx eslint <touched files>
npm test -- --runInBand
npm run build
```

Also check:

- Login, signup, onboarding still render and navigate.
- Sidebar active states and keyboard focus are intact.
- Dashboard cards still fetch and display the same data.
- No new console errors.
- No raw brand hex remains in touched files:

```bash
grep -R "#3C0078\|#2A0054\|#FF8731" <touched paths>
```

Manual routes to spot-check:

```text
/#/student/login
/#/signup
/#/dashboard
/#/courses
/#/calendar
/#/analytics
/#/profile
/#/settings
```

---

## Deliverable

Return a short report with:

1. Files migrated.
2. Files intentionally skipped.
3. Any primitive/token gap found.
4. Test/build result.
5. Anything that needs visual review.
