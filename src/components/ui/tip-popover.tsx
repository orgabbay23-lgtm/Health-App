import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { cn } from "../../utils/utils";

interface TipPopoverProps {
  content: string;
  label?: string;
  className?: string;
}

export function TipPopover({
  content,
  label = "טיפ מותאם אישית",
  className,
}: TipPopoverProps) {
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
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        onClick={() => setIsOpen(true)}
      >
        <Lightbulb size={16} className="text-amber-500" />
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
                    <p className="text-[11px] font-black tracking-[0.25em] text-amber-500 uppercase">
                      טיפ אישי מותאם
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[15px] leading-relaxed text-slate-700 font-semibold mb-2">
                    {content}
                  </p>

                  {/* Decorative Element */}
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Lightbulb size={48} />
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
