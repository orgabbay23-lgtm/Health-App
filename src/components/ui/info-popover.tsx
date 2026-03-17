import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { cn } from "../../utils/utils";

interface InfoPopoverProps {
  title?: string;
  content: string;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function InfoPopover({
  title = "מידע",
  content,
  label = "מידע נוסף",
  className,
  iconClassName,
}: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className={cn("inline-flex items-center", className)}>
      <motion.button
        type="button"
        aria-label={label}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none",
          iconClassName
        )}
        onClick={() => setIsOpen(true)}
      >
        <Info size={16} />
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[99] bg-slate-900/10 backdrop-blur-md transition-all"
              />

              {/* Centered Modal */}
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  role="tooltip"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                  }}
                  className="pointer-events-auto w-full max-w-[min(90vw,360px)] max-h-[80vh] overflow-y-auto rounded-[2.5rem] border border-white/80 bg-white p-8 text-right shadow-[0_32px_80px_rgba(15,23,42,0.25)] relative"
                >
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[11px] font-black tracking-[0.25em] text-blue-500 uppercase">
                      {title}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[15px] leading-relaxed text-slate-700 font-medium mb-2">
                    {content}
                  </p>

                  {/* Decorative Element */}
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Info size={48} />
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
