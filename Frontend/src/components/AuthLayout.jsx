import { createContext, useContext, useEffect, useState } from "react";
import { Link, useLocation, useOutlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion as Motion,
  useReducedMotion,
} from "framer-motion";
import KoruLogo from "./UI/KoruLogo";
import { cn } from "../utils/cn";
import AuthHero from "../assets/backgrounds/auth-hero.jpg";

const AuthShellContext = createContext(null);

const HERO_COPY = {
  right: {
    title: "Every piece in balance.",
    body: "Courses, classes and progress, held together in one place.",
  },
  left: {
    title: "Pick up where you left off.",
    body: "Your courses, timetable and deadlines are waiting.",
  },
};

const SLIDE = { type: "spring", stiffness: 260, damping: 32, mass: 0.9 };

/**
 * Persistent split-screen shell for onboarding, login and signup.
 * Mounted once as a layout route so the card keeps its size while the
 * hero panel slides between sides: right on onboarding, left on the forms.
 */
export function AuthShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const [header, setHeader] = useState({
    backTo: undefined,
    backLabel: "Back",
    contentClassName: "max-w-sm",
  });

  const heroSide = location.pathname === "/" ? "right" : "left";
  const copy = HERO_COPY[heroSide];
  const transition = reduceMotion ? { duration: 0 } : SLIDE;

  return (
    <AuthShellContext.Provider value={setHeader}>
      <div
        data-tts-root="true"
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-koru-surface-container-high p-0 pt-6 sm:p-4 sm:pt-8 lg:p-8"
      >
        {/* Brand mark – centred above the card */}
        <Link
          to="/"
          aria-label="Koru home"
          className="shrink-0 rounded-koru-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
        >
          <KoruLogo showText className="h-10 w-auto" />
        </Link>

        <Motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={cn(
            "flex w-full max-w-6xl overflow-hidden bg-koru-surface-container-lowest shadow-koru-lg sm:rounded-koru-3xl",
            "flex-1 sm:flex-none lg:h-[min(740px,calc(100dvh-8.5rem))]",
            heroSide === "left" ? "lg:flex-row-reverse" : "lg:flex-row",
          )}
        >
          <LayoutGroup>
            {/* Content column */}
            <Motion.div
              layout="position"
              transition={transition}
              className="flex min-w-0 flex-1 flex-col px-6 py-6 sm:px-10 sm:py-8 lg:basis-1/2"
            >
              <header className="flex h-9 shrink-0 justify-center">
                <div
                  className={cn(
                    "flex w-full items-center",
                    header.contentClassName,
                  )}
                >
                  <AnimatePresence initial={false}>
                    {header.backTo ? (
                      <Motion.div
                        key="back"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          to={header.backTo}
                          className="-ml-3 inline-flex items-center gap-1.5 rounded-koru-pill px-3 py-1.5 text-koru-label font-medium text-koru-on-surface-variant transition-colors hover:bg-koru-on-surface/8 hover:text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                        >
                          <ArrowLeft size={16} aria-hidden="true" />
                          {header.backLabel}
                        </Link>
                      </Motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </header>

              <div className="koru-scrollbar-none -mx-2 flex min-h-0 flex-1 overflow-y-auto px-2">
                <AnimatePresence mode="wait" initial={false}>
                  <Motion.div
                    key={location.pathname}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="m-auto flex w-full justify-center py-6"
                  >
                    {outlet}
                  </Motion.div>
                </AnimatePresence>
              </div>

              <p className="pt-3 text-center text-koru-caption text-koru-on-surface-variant">
                Protected by Koru · POPIA-compliant by design
              </p>
            </Motion.div>

            {/* Hero artwork */}
            <Motion.div
              layout="position"
              transition={transition}
              className="relative hidden p-3 lg:block lg:basis-1/2"
            >
              <div
                className="relative h-full overflow-hidden bg-[#2a0062]"
                style={{ borderRadius: 24 }}
              >
                <Motion.img
                  key={heroSide}
                  src={AuthHero}
                  alt=""
                  aria-hidden="true"
                  initial={
                    reduceMotion
                      ? false
                      : { scale: 1.12, rotate: heroSide === "left" ? -2 : 2 }
                  }
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1a0040]/80 to-transparent"
                />
                <AnimatePresence mode="wait" initial={false}>
                  <Motion.div
                    key={heroSide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{
                      duration: 0.3,
                      delay: reduceMotion ? 0 : 0.15,
                    }}
                    className="absolute inset-x-0 bottom-0 p-8 text-white"
                  >
                    <p className="font-display text-koru-heading font-medium">
                      {copy.title}
                    </p>
                    <p className="mt-1 max-w-xs text-koru-label text-white/80">
                      {copy.body}
                    </p>
                  </Motion.div>
                </AnimatePresence>
              </div>
            </Motion.div>
          </LayoutGroup>
        </Motion.div>
      </div>
    </AuthShellContext.Provider>
  );
}

/**
 * Page-level wrapper rendered inside AuthShell.
 *
 * @param {string} backTo Optional route for the header back link
 * @param {string} contentClassName Width constraint for the page content
 */
export default function AuthLayout({
  children,
  backTo,
  backLabel = "Back",
  contentClassName = "max-w-sm",
}) {
  const setHeader = useContext(AuthShellContext);

  useEffect(() => {
    setHeader?.({ backTo, backLabel, contentClassName });
  }, [setHeader, backTo, backLabel, contentClassName]);

  return <div className={cn("w-full", contentClassName)}>{children}</div>;
}

/** Heading block used at the top of each auth screen. */
export function AuthHeading({ eyebrow, title, subtitle, compact = false }) {
  return (
    <div className={compact ? "mb-5" : "mb-8"}>
      {eyebrow ? <div className="mb-4">{eyebrow}</div> : null}
      <h1 className="font-display text-koru-title font-medium text-koru-on-surface">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-koru-body text-koru-on-surface-variant">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** "or" separator between the primary form and Google sign-in. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-koru-caption text-koru-on-surface-variant">
      <span className="h-px flex-1 bg-koru-outline-variant" />
      <span>or</span>
      <span className="h-px flex-1 bg-koru-outline-variant" />
    </div>
  );
}
