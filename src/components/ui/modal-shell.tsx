import { type ReactNode, useEffect } from "react";
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
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              "relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/55 bg-white/95 text-right shadow-[0_30px_80px_rgba(15,23,42,0.18)]",
              className,
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
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
                className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={onClose}
                aria-label="סגור חלון"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="max-h-[calc(92vh-92px)] overflow-y-auto px-6 py-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
