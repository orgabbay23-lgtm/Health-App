import { type ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../utils/utils";
import { SafeLayoutMotion } from "../SafeLayoutMotion";

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

    // Lock background scroll when modal is open
    const scrollCanvas = document.querySelector('.ios-scroll-canvas') as HTMLElement | null;
    if (scrollCanvas) {
      scrollCanvas.style.overflow = 'hidden';
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scrollCanvas) {
        scrollCanvas.style.overflow = '';
      }
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <div className="fixed inset-0 h-[100dvh] z-[60] flex items-end md:items-center justify-center overflow-hidden" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />
          
          <SafeLayoutMotion
            ref={modalRef}
            initial={{ opacity: 0, y: "100%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 320,
              mass: 0.8
            }}
            className={cn(
              "relative w-full overflow-hidden bg-white/80 backdrop-blur-2xl text-right shadow-soft-2xl border border-white/60",
              // Mobile: Bottom sheet — use dvh to shrink with iOS keyboard
              "mt-auto max-h-[90dvh] rounded-t-[3rem] rounded-b-none pb-safe overscroll-contain",
              // Desktop: Centered modal
              "md:mt-0 md:max-h-[85dvh] md:max-w-2xl md:rounded-[3rem] md:mb-8",
              className,
            )}
            onClick={(event) => event.stopPropagation()}
            tabIndex={-1}
          >
            {/* Mesh Background inside modal */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden -z-10">
              <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-100 blur-[80px]" />
              <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-100 blur-[80px]" />
            </div>

            {/* Mobile drag indicator handle */}
            <div className="w-full flex justify-center pt-4 pb-2 md:hidden">
              <div className="h-1.5 w-16 rounded-full bg-slate-200/80"></div>
            </div>

            <div className="flex items-start justify-between gap-4 px-8 py-6 md:py-8">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  {title}
                </h2>
                {description ? (
                  <p className="text-sm font-medium text-slate-400">
                    {description}
                  </p>
                ) : null}
              </div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 h-11 w-11 border border-slate-100"
                  onClick={onClose}
                  aria-label="סגור חלון"
                >
                  <X size={20} />
                </Button>
              </motion.div>
            </div>

            <div className="max-h-[calc(90dvh-120px)] overflow-y-auto overscroll-contain px-8 pb-10 md:max-h-[calc(85dvh-140px)]">
              {children}
            </div>
          </SafeLayoutMotion>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
