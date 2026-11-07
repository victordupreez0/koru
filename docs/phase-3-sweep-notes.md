# Phase 3 sweep: notes

The full sweep from `handoff-3-full-sweep.md` is done. Nine feature agents worked in separate parts of the codebase, then one review pass checked their work against the design system.

## Verification

- `npm test -- --runInBand`: 13 suites, 90 tests pass.
- `npm run build`: passes.
- ESLint: no new errors in any of the 91 changed files. Each file's error count is the same as or lower than before. The existing errors are mostly `motion` flagged as unused (the config doesn't count `motion.div`), plus unused variables and empty catch blocks.
- Nobody has done a visual QA pass in a browser yet. Do one by role (student, teacher, admin) at desktop and narrow widths before merging.

## Intentional raw colours

| File | Why |
|---|---|
| `components/UI/KoruLogo.jsx` | Logo SVG fills |
| `components/UI/Orb.jsx` | WebGL shader constants |
| `App.jsx` (`ClickSpark sparkColor`) | Canvas drawing, which can't read CSS variables |
| `components/weeklyHorizontalTimeline.jsx` confetti colours | `canvas-confetti`, which can't read CSS variables |
| `components/eventModal.jsx` default `bgColor` | Event data fed to `<input type="color">`, which needs a hex value |
| `dashboards/adminDashboardComponents/SendNotificationModal.jsx` `bgColor` | Event colour saved to the calendar API (data, not styling) |
| `components/NovelBlockMenu.jsx` `TEXT_COLORS`/`BG_COLORS` | User-selectable colours written into document content |
| `analytics/adminAnalytics.jsx` `COURSE_COLORS[1..9]`, `teacherMockData.js` | Categorical chart series with no matching tokens |
| `components/UI/TwoFactorSetupModal.jsx` `bg-white` | QR code needs a true white quiet zone |

## Behaviour changes to check

All of these come from moving hand-built overlays onto `Modal`.

- Escape now closes these, and so does a backdrop click where it didn't already: `CheckInModal`, `AttendanceManageModal`, `StudentAttendanceDetailModal`, `AddTaskModal`, the admin dashboard forms, and the delete confirmation in `CourseModulesView`.
- `CourseDetailModal` sets `closeOnEscape={!nested}`, so Escape only closes the modal on top.
- Modals now sit at `z-50` in a portal. They used to use `z-[100]` or `z-[9999]`.
- The admin dashboard modals no longer have a framer-motion exit animation.
- In the cohort manager, the two-column layout now stacks vertically inside the `xl` modal.
- `eventModal` Delete is now a filled error button instead of red text.
- In `CourseAssignmentsView`, the row Close/Reopen icon button no longer turns red when the assignment is closed.
- `CourseItemView` Edit/Save no longer turns green in edit mode.
- Settings uses `Input` now, so `authInput.jsx` was deleted. Settings still reads each field's label aloud on focus when text-to-speech is on.

## Deferred

- `StudentPerspectiveModal` and `TeacherPerspectiveModal` are still hand-built full-screen overlays. They're tokenised and now have `role="dialog"`, but `Modal` has no full-screen size.
- `CourseAssignmentsView` submission preview drawer: a hand-built side drawer, not a dialog.
- Hand-built tables, because there is no `Table` primitive.
- Hand-styled textareas, because there is no `Textarea` primitive.
- `CalendarDayView.jsx` calls `useState` after an early return (an existing hooks-rules bug). It was left alone because fixing it changes logic.
- Dead code that was migrated anyway: `ProfileSidebar`, `ProfileTopBar`, `EventModal`, `WeeklyHorizontalTimeline` and `CalendarDayView` aren't imported anywhere.
- `src/utils/profileUtils.jsx` duplicates `pages/profile/profileUtils.jsx`.
- `teacherCourses.jsx.bak` is a stale backup.

## Primitive requests (for the foundation owner)

These are ordered by how many agents asked for them.

1. `Textarea`: requested by five agents.
2. A compact icon button (`size="icon-sm"`, 32px).
3. `Button` with `href` or `as="a"`.
4. `Table`.
5. A `Tabs` or segmented control (calendar view selector, Just me / Share toggle, attendance status switcher).
6. `Switch` and `Checkbox`.
7. `Modal size="full"`.
8. `Card` that can be a motion element (`forwardRef`, or `motion(Card)`).
9. A progress bar or meter (repeated across the analytics views).

## Consolidation candidates

- Teacher and student `Course*View` components: announcements, home, notes and assignments have nearly the same structure.
- Teacher `CourseGradesView` and `CourseAttendanceView`, which share the KPI row, leaderboard, table, filter bar and side panel.
- Student, teacher and admin calendars, which share their helpers, top bar, month grid and event pills.
- `EventModal`, `AddTaskModal` and the create modal in `weeklyHorizontalTimeline`.
- `navItem` and `sideNavItem`.
- `AddLecturerForm` and `AddStudentForm`.
- `StudentPerspectiveModal` and `TeacherPerspectiveModal`.
- The `ProgressRing` copies in the three analytics views, plus `components/UI/progressRing.jsx`.
- Admin courses `StatCard` and `dashboardStatTile`.
- The list-row recipe repeated in `assignmentItem`, `announcementsItem` and `nextClassItem`.
