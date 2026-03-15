import { type ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../utils/utils";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalShellProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Auto-focus first input on open
    setTimeout(() => {
      if (modalRef.current) {
        const firstInput = modalRef.current.querySelector('input, textarea') as HTMLElement;
        if (firstInput) firstInput.focus();
      }
    }, 100);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 px-0 md:px-4 pb-0 md:py-6 backdrop-blur-sm"
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            className={cn(
              "relative w-full overflow-hidden border-t md:border border-white/55 bg-white/95 text-right shadow-soft-xl",
              // Mobile: Bottom sheet
              "mt-auto max-h-[90vh] rounded-t-sheet rounded-b-none",
              // Desktop: Centered modal
              "md:mt-0 md:max-h-[92vh] md:max-w-2xl md:rounded-card pb-[env(safe-area-inset-bottom)] md:pb-0",
              className,
            )}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(event) => event.stopPropagation()}
            tabIndex={-1}
          >
            {/* Mobile drag indicator handle */}
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
              <div className="h-1.5 w-12 rounded-full bg-slate-300"></div>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-4 md:py-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">
                  {title}
                </h2>
                {description ? (
                  <p className="text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 min-h-[44px] min-w-[44px]"
                onClick={onClose}
                aria-label="סגור חלון"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="max-h-[calc(90vh-100px)] overflow-y-auto px-6 py-6 md:max-h-[calc(92vh-92px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
