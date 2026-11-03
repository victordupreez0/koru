import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal primitive: portal, Escape to close, backdrop dismissal,
 * focus trap, focus restoration and body scroll locking.
 *
 * On small screens it behaves as a bottom sheet; at `sm` and above it centers.
 *
 * @param {"sm"|"md"|"lg"|"xl"} size
 * @param {React.RefObject<HTMLElement>} initialFocusRef Optional first focus target
 * @param {string} ariaLabel Fallback accessible name when no title is provided
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  ariaLabel,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocusRef,
  className,
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusable = panel
      ? Array.from(panel.querySelectorAll(FOCUSABLE))
      : [];
    const focusTarget =
      initialFocusRef?.current || focusable[0] || panel;

    const focusTimer = window.setTimeout(() => {
      focusTarget?.focus();
    }, 0);

    function handleKeyDown(event) {
      if (event.key === "Escape" && closeOnEscape) {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0,
      );

      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open, closeOnEscape, initialFocusRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-koru-overlay-in items-end justify-center bg-koru-scrim sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full animate-koru-dialog-in flex-col overflow-hidden rounded-t-koru-3xl bg-koru-surface-container-high shadow-koru-lg outline-none sm:max-h-[85vh] sm:rounded-koru-3xl",
          SIZES[size] ?? SIZES.md,
          className,
        )}
      >
        {title || description || showCloseButton ? (
          <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              {title ? (
                <h2
                  id={titleId}
                  className="font-display text-koru-heading text-koru-on-surface"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm leading-relaxed text-koru-on-surface-variant"
                >
                  {description}
                </p>
              ) : null}
            </div>

            {showCloseButton ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close dialog"
                className="-mr-1 -mt-1 shrink-0"
                onClick={() => onCloseRef.current?.()}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse gap-2 px-5 pb-5 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
