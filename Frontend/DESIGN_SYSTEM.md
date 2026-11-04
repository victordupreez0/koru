# Koru design system foundation

The foundation now follows Material 3 patterns while staying on Tailwind CSS. It does not add the MUI package; the primitives emulate Material 3 colour roles, shape, elevation and state treatment.

The auth flow (login, signup, onboarding role cards and 2FA setup) has been migrated. The remaining application pages have not been migrated yet.

## Preview

Run the frontend and open:

```text
http://localhost:5200/#/design-system
```

The route is development-only (`import.meta.env.DEV`).

## Colour roles

Tokens live in the `@theme` block in `src/index.css`.

| Role | Tokens |
|---|---|
| Primary | `koru-primary`, `koru-on-primary`, `koru-primary-container`, `koru-on-primary-container` |
| Secondary | `koru-secondary`, `koru-on-secondary`, `koru-secondary-container`, `koru-on-secondary-container` |
| Tertiary | `koru-tertiary`, `koru-on-tertiary`, `koru-tertiary-container`, `koru-on-tertiary-container` |
| Error | `koru-error`, `koru-on-error`, `koru-error-container`, `koru-on-error-container` |
| Accent | `koru-accent`, `koru-accent-soft`, `koru-accent-ink` |
| Surface | `koru-surface`, `koru-surface-container-low`, `koru-surface-container`, `koru-surface-container-high`, `koru-surface-container-highest` |
| Content | `koru-on-surface`, `koru-on-surface-variant` |
| Outline | `koru-outline`, `koru-outline-variant`, `koru-outline-faint` |
| Status | `koru-success`, `koru-warning`, `koru-info` plus their `-soft` containers |
| Scrim | `koru-scrim` |

Canvas: `koru-canvas` (`#3A2A55`) dark brand purple (matched to the lightness of #343434) page background behind the sidebar and floating shells. `koru-surface` (`#FAFBFD`) remains the near-white surface role.

Stat tile fills: `koru-stat-violet`, `koru-stat-sky`, `koru-stat-orange`, `koru-stat-green`, `koru-stat-slate` (vivid, white text on top; used only by `dashboardStatTile`).

Role accents: `koru-role-student`, `koru-role-teacher`, `koru-role-admin`.

## Type scale

| Utility | Size |
|---|---|
| `text-koru-display` | 36px |
| `text-koru-title` | 28px |
| `text-koru-heading` | 18px |
| `text-koru-body` | 15px |
| `text-koru-label` | 14px |
| `text-koru-caption` | 12px |

Gabarito carries display and page headings; Google Sans carries body and UI text. Headings stay at medium weight (500).

## Shape, elevation and motion

- Radius: `rounded-koru-xs` (4px) → `rounded-koru-3xl` (28px), plus `rounded-koru-pill`
- Cards use `rounded-koru-md` (12px)
- Elevation: `shadow-koru-xs`, `shadow-koru-sm`, `shadow-koru-md`, `shadow-koru-lg`
- Card edge: `shadow-koru-card` (resting) and `shadow-koru-card-hover` (hover), a soft, diffuse lift
- Motion: `ease-koru-out`, `ease-koru-in-out`
- Animations: `animate-koru-overlay-in`, `animate-koru-dialog-in`, `animate-koru-shimmer`

## Primitives

Import from `src/components/UI`:

```jsx
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  SkeletonText,
} from "../components/UI";
```

### Button

```jsx
<Button variant="filled" size="md" startIcon={<Plus size={16} />}>
  New course
</Button>
```

Variants: `filled`, `tonal`, `outlined`, `text`, `elevated`, `accent`, `error`.
Sizes: `sm`, `md`, `lg`, `icon`.

Legacy aliases remain valid: `primary` → `filled`, `secondary` → `tonal`, `outline` → `outlined`, `ghost` → `text`, `danger` → `error`.

Use `size="icon"` with an `aria-label` for icon-only actions.

### Card

```jsx
<Card variant="filled" tone="brand" padding="md">
  <CardHeader>
    <div>
      <CardTitle>Course panel</CardTitle>
      <CardDescription>Supporting context.</CardDescription>
    </div>
    <Badge variant="success" dot>Active</Badge>
  </CardHeader>
  <CardBody>Course details.</CardBody>
  <CardFooter>
    <Button size="sm" variant="text">Open</Button>
  </CardFooter>
</Card>
```

Variants: `filled`, `elevated`, `outlined`, `interactive`.

Card edges are soft: no strong borders. `outlined` and `interactive` use a faint 1px ring (`ring-koru-outline-faint`) plus `shadow-koru-card`. `interactive` lifts on hover (`-translate-y-0.5` + `shadow-koru-card-hover`). Keep `koru-outline-variant` for dividers and form fields, not card edges. Clickable list rows (for example the onboarding role rows) follow the same recipe.
Tones: `neutral`, `muted`, `low`, `surface`, `brand`, `secondary`, `tertiary`, `accent`, `info`, `success`, `warning`, `error`.
Padding: `none`, `sm`, `md`, `lg`, `xl`.
Radius: `md`, `lg`, `xl`, `2xl`, `3xl`.

`default` is an alias for `filled`.

### Input

```jsx
<Input
  label="Email address"
  placeholder="you@example.com"
  startIcon={<Mail size={16} />}
  hint="We will never share your address."
  error={error}
/>
```

Sizes: `sm`, `md`, `lg`.
Supports `labelAction`, `required`, `startIcon`, `endIcon`, `hint`, `error`.

Inputs use a Material 3 filled text-field treatment: a white fill for contrast on tonal cards, a 1px inset focus indicator, and small icons for hints and errors.

### Select

```jsx
<Select label="Institution" value={institution} onChange={handleChange} required>
  <option value="">Select your institution</option>
  <option value="open-window">Open Window</option>
</Select>
```

Sizes: `sm`, `md`, `lg`. Supports `label`, `hint`, `error`, `required`.

### Alert

```jsx
<Alert variant="error">Email or password is incorrect.</Alert>
```

Variants: `error`, `success`, `warning`, `info`.
Use this instead of ad-hoc coloured banners.

### Badge

```jsx
<Badge variant="success" dot>Active</Badge>
```

Variants: `neutral`, `primary`, `secondary`, `tertiary`, `accent`, `success`, `warning`, `error`, `info`.
Sizes: `sm`, `md`. Use `dot` for status emphasis.

Badges are tonal chips: filled colour, no ring or outline. `danger` remains an alias for `error`.

### Modal

```jsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Delete course"
  description="This cannot be undone."
  footer={<Button variant="error">Delete</Button>}
>
  Modal body
</Modal>
```

Handles Escape, backdrop dismissal, focus trapping, focus restoration and body scroll locking. It becomes a bottom sheet on small screens. Pass `ariaLabel` when no `title` is provided, and `initialFocusRef` when a specific control should receive focus.

### Other primitives

- `EmptyState` — icon, title, description, optional action, `tone="primary"|"secondary"|"tertiary"|"accent"|"info"|"success"|"warning"`
- `PageHeader` — eyebrow, title, subtitle, breadcrumbs, actions
- `Skeleton` — `rect`, `text`, `circle`
- `SkeletonText` — multi-line text placeholder

## Rules for migration work

1. Prefer Material 3 role tokens over raw hex values.
2. Use `variant` for hierarchy and `tone` for subtle surface colour.
3. Do not introduce a new button, card, input or modal implementation.
4. Keep page-specific layout in the page; keep visual rules in the primitive.
5. Migrate page by page. Do not combine a styling migration with behaviour changes.
6. Verify keyboard focus, reduced motion and small-screen behaviour.
7. Run `npm test` and `npm run build` after each migration batch.

## Deliberately not included yet

- Toast / ConfirmDialog
- Tabs
- Table
- Avatar
- Ripple effects
- Navigation rail / top app bar primitives
- Form validation abstraction
- Storybook or visual regression tests
