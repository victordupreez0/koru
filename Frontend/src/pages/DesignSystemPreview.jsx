import { useState } from "react";
import {
  ArrowRight,
  Inbox,
  Mail,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import {
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
  Skeleton,
  SkeletonText,
} from "../components/UI";

const COLOR_SWATCHES = [
  { label: "Primary", token: "koru-primary", className: "bg-koru-primary", value: "#3C0078" },
  { label: "On primary", token: "koru-on-primary", className: "bg-koru-on-primary", value: "#FFFFFF" },
  { label: "Primary container", token: "koru-primary-container", className: "bg-koru-primary-container", value: "#EADCFF" },
  { label: "Secondary", token: "koru-secondary", className: "bg-koru-secondary", value: "#625B71" },
  { label: "Secondary container", token: "koru-secondary-container", className: "bg-koru-secondary-container", value: "#E8DEF8" },
  { label: "Tertiary", token: "koru-tertiary", className: "bg-koru-tertiary", value: "#7D5260" },
  { label: "Tertiary container", token: "koru-tertiary-container", className: "bg-koru-tertiary-container", value: "#FFD8E4" },
  { label: "Accent", token: "koru-accent", className: "bg-koru-accent", value: "#FF8731" },
  { label: "Error", token: "koru-error", className: "bg-koru-error", value: "#B3261E" },
  { label: "Error container", token: "koru-error-container", className: "bg-koru-error-container", value: "#F9DEDC" },
  { label: "Surface", token: "koru-surface", className: "bg-koru-surface", value: "#FAFBFD" },
  { label: "Surface high", token: "koru-surface-container-high", className: "bg-koru-surface-container-high", value: "#E8EAF1" },
  { label: "Outline", token: "koru-outline", className: "bg-koru-outline", value: "#767680" },
  { label: "Success", token: "koru-success", className: "bg-koru-success", value: "#146C2E" },
  { label: "Warning", token: "koru-warning", className: "bg-koru-warning", value: "#8F4C00" },
  { label: "Info", token: "koru-info", className: "bg-koru-info", value: "#0B57D0" },
];

const BUTTON_VARIANTS = [
  "filled",
  "tonal",
  "outlined",
  "text",
  "elevated",
  "accent",
  "error",
];
const BADGE_VARIANTS = [
  "neutral",
  "primary",
  "secondary",
  "tertiary",
  "accent",
  "success",
  "warning",
  "error",
  "info",
];
const RADII = [
  { label: "sm", className: "rounded-koru-sm" },
  { label: "md", className: "rounded-koru-md" },
  { label: "lg", className: "rounded-koru-lg" },
  { label: "xl", className: "rounded-koru-xl" },
  { label: "2xl", className: "rounded-koru-2xl" },
  { label: "pill", className: "rounded-koru-pill" },
];
const SHADOWS = [
  { label: "xs", className: "shadow-koru-xs" },
  { label: "sm", className: "shadow-koru-sm" },
  { label: "md", className: "shadow-koru-md" },
  { label: "lg", className: "shadow-koru-lg" },
];

function Section({ id, eyebrow, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-1.5 text-koru-caption font-medium uppercase tracking-[0.18em] text-koru-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-koru-title text-koru-on-surface">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-koru-body text-koru-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({ swatch }) {
  return (
    <Card padding="sm">
      <div
        className={`h-16 rounded-koru-md border border-black/5 ${swatch.className}`}
      />
      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-koru-on-surface">{swatch.label}</p>
        <code className="rounded-koru-xs bg-koru-surface-container-high px-1.5 py-0.5 text-[10px] text-koru-on-surface-variant">
          {swatch.token}
        </code>
      </div>
      <p className="mt-1 font-mono text-[10px] text-koru-outline">
        {swatch.value}
      </p>
    </Card>
  );
}

export default function DesignSystemPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-1 py-6 sm:py-8">
      <PageHeader
        eyebrow="Foundation"
        title="Koru design system"
        subtitle="A small, accessible set of tokens and primitives for building consistent screens. Preview only — this route is available in development."
        breadcrumbs={[
          { label: "Koru", href: "/" },
          { label: "Design system" },
        ]}
        actions={
          <Button startIcon={<Plus size={16} />}>New item</Button>
        }
      />

      <div className="space-y-14">
        <Section
          eyebrow="Principles"
          title="Designed for clarity"
          description="The system should make the right thing easy and the wrong thing obvious."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Clear hierarchy</CardTitle>
              </CardHeader>
              <CardDescription>
                One primary action per view. Quiet surfaces, strong typography
                and deliberate spacing do the work.
              </CardDescription>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Consistent by default</CardTitle>
              </CardHeader>
              <CardDescription>
                Tokens and primitives remove one-off decisions. New screens
                should compose the system, not reinvent it.
              </CardDescription>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Accessible always</CardTitle>
              </CardHeader>
              <CardDescription>
                Visible focus, semantic markup, reduced-motion support and
                contrast-safe colour pairings are built in.
              </CardDescription>
            </Card>
          </div>
        </Section>

        <Section
          id="colour"
          eyebrow="Foundations"
          title="Colour"
          description="Use semantic tokens in new code. Raw hex values belong only in the token layer."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {COLOR_SWATCHES.map((swatch) => (
              <ColorSwatch key={swatch.token} swatch={swatch} />
            ))}
          </div>
        </Section>

        <Section
          id="type"
          eyebrow="Foundations"
          title="Typography"
          description="Gabarito carries display and page headings; Google Sans carries body and UI text. Headings stay at medium weight."
        >
          <Card padding="lg" className="space-y-6">
            <div>
              <p className="mb-2 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Display / 36
              </p>
              <p className="font-display text-koru-display text-koru-on-surface">
                Build with clarity.
              </p>
            </div>
            <div>
              <p className="mb-2 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Title / 28
              </p>
              <p className="font-display text-koru-title text-koru-on-surface">
                Course overview
              </p>
            </div>
            <div>
              <p className="mb-2 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Heading / 18
              </p>
              <p className="font-display text-koru-heading text-koru-on-surface">
                Assignment feedback
              </p>
            </div>
            <div>
              <p className="mb-2 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Body / 15
              </p>
              <p className="max-w-2xl text-koru-body text-koru-on-surface-variant">
                Body text is tuned for sustained reading. Supporting copy stays
                muted so the primary content keeps its weight.
              </p>
            </div>
            <div>
              <p className="mb-2 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Label / 14
              </p>
              <p className="text-koru-label text-koru-primary">
                Primary action label
              </p>
            </div>
          </Card>
        </Section>

        <Section
          id="shape"
          eyebrow="Foundations"
          title="Shape and elevation"
          description="A tight radius scale and restrained shadows keep surfaces calm."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="lg">
              <p className="mb-4 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Radius
              </p>
              <div className="flex flex-wrap gap-3">
                {RADII.map((radius) => (
                  <div key={radius.label} className="text-center">
                    <div
                      className={`h-14 w-14 bg-koru-primary ${radius.className}`}
                    />
                    <p className="mt-1.5 text-[10px] font-medium text-koru-on-surface-variant">
                      {radius.label}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <p className="mb-4 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Elevation
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SHADOWS.map((shadow) => (
                  <div
                    key={shadow.label}
                    className={`flex h-14 items-center justify-center rounded-koru-md bg-koru-surface-container-low text-[10px] font-medium text-koru-on-surface-variant ${shadow.className}`}
                  >
                    {shadow.label}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        <Section
          id="buttons"
          eyebrow="Components"
          title="Buttons"
          description="Material 3 filled, tonal, outlined, text, elevated, accent and error variants."
        >
          <Card padding="lg" className="space-y-7">
            <div>
              <p className="mb-3 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Variants
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {BUTTON_VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant}>
                    {variant}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
                Sizes and states
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button
                  variant="outlined"
                  size="icon"
                  aria-label="Add item"
                >
                  <Plus size={16} />
                </Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button variant="tonal" startIcon={<Mail size={16} />}>
                  With icon
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        <Section
          id="badges"
          eyebrow="Components"
          title="Badges"
          description="Tonal Material 3 chips with optional leading dots. No outlines."
        >
          <Card padding="lg" className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {BADGE_VARIANTS.map((variant) => (
                <Badge key={variant} variant={variant} dot>
                  {variant}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="sm" variant="primary" dot>
                Small
              </Badge>
              <Badge size="md" variant="primary" dot>
                Medium
              </Badge>
            </div>
          </Card>
        </Section>

        <Section
          id="inputs"
          eyebrow="Components"
          title="Inputs"
          description="Material 3 filled text fields with a thin focus indicator and supporting icons."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="lg">
              <Input
                label="Email address"
                placeholder="you@example.com"
                startIcon={<Mail size={16} />}
                hint="We will never share your address."
              />
            </Card>

            <Card padding="lg">
              <Input
                label="Student number"
                placeholder="20260001"
                required
                labelAction={<span>Required</span>}
              />
            </Card>

            <Card padding="lg">
              <Input
                label="Search"
                placeholder="Search courses"
                endIcon={<Search size={16} />}
              />
            </Card>

            <Card padding="lg">
              <Input
                label="Course code"
                defaultValue="DV-300"
                error="That course code is already in use."
              />
            </Card>

            <Card padding="lg">
              <Input
                label="Small input"
                size="sm"
                placeholder="Compact size"
              />
            </Card>

            <Card padding="lg">
              <Input
                label="Large input"
                size="lg"
                placeholder="Comfortable size"
              />
            </Card>
          </div>
        </Section>

        <Section
          id="cards"
          eyebrow="Components"
          title="Cards"
          description="Material 3 filled, elevated and outlined surfaces with optional colour tones."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card variant="filled">
              <CardHeader>
                <div>
                  <CardTitle>Filled card</CardTitle>
                  <CardDescription>
                    Default surface for grouped content.
                  </CardDescription>
                </div>
                <Badge variant="primary">New</Badge>
              </CardHeader>
              <CardBody>
                The filled card is the quiet workhorse for dashboards and
                content groups.
              </CardBody>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div>
                  <CardTitle>Elevated card</CardTitle>
                  <CardDescription>
                    For content that needs separation.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardBody>
                A restrained shadow lifts the surface without making the screen
                noisy.
              </CardBody>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <div>
                  <CardTitle>Outlined card</CardTitle>
                  <CardDescription>
                    Low-emphasis container.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardBody>
                Use the outline variant when the surface needs a clear edge
                without elevation.
              </CardBody>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <div>
                  <CardTitle>Interactive card</CardTitle>
                  <CardDescription>
                    Hover for the clickable treatment.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardBody>
                The elevation responds on hover, while focus stays inside the
                card.
              </CardBody>
              <CardFooter>
                <Button variant="text" size="sm" endIcon={<ArrowRight size={14} />}>
                  Open
                </Button>
              </CardFooter>
            </Card>

            <Card tone="brand">
              <CardHeader>
                <CardTitle>Brand card</CardTitle>
              </CardHeader>
              <CardBody>
                Primary-container fill for guidance and highlighted notices.
              </CardBody>
            </Card>

            <Card tone="secondary">
              <CardHeader>
                <CardTitle>Secondary card</CardTitle>
              </CardHeader>
              <CardBody>
                Lavender container for supportive, lower-priority content.
              </CardBody>
            </Card>

            <Card tone="tertiary">
              <CardHeader>
                <CardTitle>Tertiary card</CardTitle>
              </CardHeader>
              <CardBody>
                A soft rose container for editorial or celebratory moments.
              </CardBody>
            </Card>

            <Card tone="accent">
              <CardHeader>
                <CardTitle>Accent card</CardTitle>
              </CardHeader>
              <CardBody>
                Warm emphasis for secondary highlights and calls to action.
              </CardBody>
            </Card>

            <Card tone="success">
              <CardHeader>
                <CardTitle>Success card</CardTitle>
              </CardHeader>
              <CardBody>
                Positive states, completed work and reassuring feedback.
              </CardBody>
            </Card>

            <Card tone="warning">
              <CardHeader>
                <CardTitle>Warning card</CardTitle>
              </CardHeader>
              <CardBody>
                Attention without alarm for time-sensitive information.
              </CardBody>
            </Card>

            <Card tone="muted">
              <CardHeader>
                <CardTitle>Muted card</CardTitle>
              </CardHeader>
              <CardBody>
                Use for secondary information that should recede.
              </CardBody>
            </Card>
          </div>
        </Section>

        <Section
          id="states"
          eyebrow="Patterns"
          title="Empty, loading and modal states"
          description="The states that make a product feel finished."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <EmptyState
              tone="accent"
              icon={<Inbox size={22} />}
              title="No announcements yet"
              description="When a lecturer posts an announcement it will appear here."
              action={
                <Button size="sm" variant="tonal">
                  Refresh
                </Button>
              }
            />

            <Card padding="lg" className="space-y-5">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="h-11 w-11" />
                <div className="flex-1">
                  <SkeletonText lines={2} />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex items-center justify-between gap-3">
                <SkeletonText lines={1} className="w-1/3" />
                <Button
                  variant="tonal"
                  startIcon={<Sparkles size={16} />}
                  onClick={() => setModalOpen(true)}
                >
                  Open modal
                </Button>
              </div>
            </Card>
          </div>
        </Section>

        <Section
          id="rules"
          eyebrow="Usage"
          title="Rules of thumb"
          description="Keep the system small enough to remain useful."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card tone="brand">
              <CardHeader>
                <CardTitle>Do</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  <li>Use tokens instead of raw hex values.</li>
                  <li>Compose primitives rather than copying classes.</li>
                  <li>Keep one primary action per view.</li>
                  <li>Verify keyboard focus and reduced motion.</li>
                </ul>
              </CardBody>
            </Card>

            <Card tone="muted">
              <CardHeader>
                <CardTitle>Avoid</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  <li>Adding a new button or card implementation.</li>
                  <li>Using shadow and border together without purpose.</li>
                  <li>Mixing arbitrary radii in the same view.</li>
                  <li>Shipping a state without loading or empty feedback.</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </Section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal primitive"
        description="Escape closes it, focus is trapped, and focus returns to the trigger."
        footer={
          <>
            <Button variant="text" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </>
        }
      >
        <p className="text-koru-body text-koru-on-surface-variant">
          Compose modals with a title, description, body and optional footer
          actions. On small screens it becomes a bottom sheet.
        </p>
      </Modal>
    </div>
  );
}
