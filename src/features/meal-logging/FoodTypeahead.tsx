import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../../components/ui/input";
import { foodSuggestions } from "../../utils/food-suggestions";
import { useAppStore } from "../../store";
import { cn } from "../../utils/utils";

interface FoodTypeaheadProps {
  name: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  multiSelect?: boolean;
  /** Render a multi-line textarea instead of a single-line input */
  multiLine?: boolean;
  /** Rows for the textarea (default 2) */
  rows?: number;
}

export function FoodTypeahead({
  name,
  placeholder = "שם המאכל",
  className,
  inputClassName,
  multiSelect = false,
  multiLine = false,
  rows = 2,
}: FoodTypeaheadProps) {
  const { register, watch, setValue } = useFormContext();
  const value = watch(name) || "";
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const dailyLogs = useAppStore((state) => state.dailyLogs);

  const getCurrentSegment = (val: string) => {
    if (!multiSelect) return val;
    const segments = val.split(",");
    return segments[segments.length - 1].trim();
  };

  // Update position coordinates - Always below the input
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      
      setCoords({
        top: rect.bottom + scrollY,
        left: rect.left + scrollX,
        width: rect.width
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      // Use capture phase for scroll to catch it from anywhere
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const currentSearch = getCurrentSegment(value);

    if (currentSearch.length >= 2 && isOpen) {
      const historySet = new Set<string>();
      Object.values(dailyLogs).forEach((log) => {
        log.meals.forEach((m) => {
          if (m.meal_name.toLowerCase().includes(currentSearch.toLowerCase())) {
            historySet.add(m.meal_name);
          }
        });
      });
      const historyMatches = Array.from(historySet);

      const dbMatches = foodSuggestions.filter((item) => 
        item.toLowerCase().includes(currentSearch.toLowerCase()) && !historySet.has(item)
      );

      dbMatches.sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(currentSearch.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(currentSearch.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });

      const combined = [...historyMatches, ...dbMatches].slice(0, 15);
      setSuggestions(combined);
      setActiveIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [value, isOpen, dailyLogs, multiSelect]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (listRef.current && listRef.current.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    if (multiSelect) {
      const segments = value.split(",");
      segments[segments.length - 1] = ` ${suggestion}`;
      const newValue = segments.join(",").trim();
      setValue(name, newValue, { shouldValidate: true });
    } else {
      setValue(name, suggestion, { shouldValidate: true });
    }
    setIsOpen(false);
    // Note: Do NOT re-focus the input here.
    // On desktop, blur is already prevented by onPointerDown on the dropdown.
    // On iOS, re-focusing triggers a keyboard dismiss→reappear cycle that
    // causes a violent viewport jump. The user taps the input to continue.
  };

  const { ref: formRef, ...rest } = register(name);

  const sharedProps = {
    placeholder,
    autoComplete: "off" as const,
    autoCorrect: "off" as const,
    spellCheck: false as const,
    dir: "rtl" as const,
    ...rest,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      rest.onChange(e);
      setIsOpen(true);
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsOpen(true);
      // Ensure coords are fresh on focus (keyboard pop)
      setTimeout(updateCoords, 300);
      // iOS: scroll input into view after virtual keyboard finishes expanding
      const target = e.target;
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    },
    onKeyDown: handleKeyDown,
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {multiLine ? (
        <textarea
          {...sharedProps}
          rows={rows}
          className={cn(
            "flex w-full rounded-2xl border border-input bg-background/95 px-4 py-3 text-right text-[16px] shadow-[0_8px_20px_rgba(15,23,42,0.04)] ring-offset-background placeholder:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none whitespace-pre-wrap break-words bg-white border-none shadow-sm rounded-xl scroll-mt-24",
            inputClassName
          )}
          ref={(e) => {
            formRef(e);
            // @ts-ignore
            inputRef.current = e;
          }}
        />
      ) : (
        <Input
          {...sharedProps}
          className={cn("bg-white border-none shadow-sm rounded-xl scroll-mt-24", inputClassName)}
          ref={(e) => {
            formRef(e);
            // @ts-ignore
            inputRef.current = e;
          }}
        />
      )}
      
      {createPortal(
        <AnimatePresence>
          {isOpen && suggestions.length > 0 && (
            <motion.ul
              ref={listRef}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute z-[9999] mt-2 py-2 bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-soft-2xl rounded-2xl text-right overflow-y-auto overscroll-contain touch-pan-y max-h-[40vh] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200/60"
              style={{
                top: coords.top,
                left: coords.left,
                width: Math.max(coords.width, 280),
                minWidth: coords.width,
                maxWidth: "calc(100vw - 2rem)",
                WebkitOverflowScrolling: "touch"
              }}
              onPointerDown={(e) => {
                // Prevent input blur on both desktop and iOS touch.
                // pointerdown fires BEFORE blur on all platforms (unlike
                // mousedown which fires after touchstart-induced blur on iOS).
                e.preventDefault();
              }}
            >
              {suggestions.map((suggestion, idx) => (
                <li
                  key={suggestion}
                  className={cn(
                    "px-6 py-4 text-[15px] font-bold cursor-pointer transition-all flex items-center justify-start border-b border-slate-50 last:border-none active:bg-blue-50/50 select-none",
                    idx === activeIndex ? "bg-blue-50 text-blue-600" : "text-slate-700"
                  )}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <span className="whitespace-normal break-words">{suggestion}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
