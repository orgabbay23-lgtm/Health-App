import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative flex items-center", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-base shadow-sm transition hover:border-amber-300 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        onClick={() => setIsOpen((current) => !current)}
        onFocus={() => setIsOpen(true)}
      >
        <span aria-hidden="true">💡</span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            role="tooltip"
            className="absolute end-0 top-full z-30 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-4 text-right shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-amber-500">
              טיפ אישי
            </p>
            <p className="text-sm leading-6 text-slate-600">{content}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
