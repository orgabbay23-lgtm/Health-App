import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*/g, "")  // bold+italic ***
    .replace(/\*\*/g, "")    // bold **
    .replace(/\*/g, "")      // italic *
    .replace(/^#{1,6}\s+/gm, "")  // headings
    .replace(/`{1,3}/g, "")  // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");  // links → text only
}

export function InsightModal({ isOpen, onClose, content }: InsightModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const scrollCanvas = document.querySelector('.ios-scroll-canvas') as HTMLElement | null;
    if (scrollCanvas) {
      scrollCanvas.style.overflow = 'hidden';
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scrollCanvas) {
        scrollCanvas.style.overflow = '';
      }
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center overflow-hidden"
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: "100%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 320,
              mass: 0.8,
            }}
            className="relative w-full overflow-hidden bg-white/80 backdrop-blur-2xl text-right shadow-soft-2xl border border-white/60 mt-auto max-h-[92vh] rounded-t-[3rem] rounded-b-none pb-safe md:mt-0 md:max-h-[90vh] md:max-w-2xl md:rounded-[3rem] md:mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mesh gradient background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden -z-10">
              <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-violet-100 blur-[80px]" />
              <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-amber-100 blur-[80px]" />
            </div>

            {/* Drag indicator (mobile) */}
            <div className="w-full flex justify-center pt-4 pb-2 md:hidden">
              <div className="h-1.5 w-16 rounded-full bg-slate-200/80" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-8 py-6 md:py-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-50 p-2.5 text-violet-600">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  המלצה אישית
                </h2>
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

            {/* Content */}
            <div className="max-h-[calc(92vh-120px)] overflow-y-auto px-8 pb-10 md:max-h-[calc(90vh-140px)]">
              <div className="max-w-none text-right text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                {stripMarkdown(content)}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
