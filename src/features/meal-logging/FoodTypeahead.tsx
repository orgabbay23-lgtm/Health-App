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
}

export function FoodTypeahead({ 
  name, 
  placeholder = "שם המאכל", 
  className,
  inputClassName,
  multiSelect = false
}: FoodTypeaheadProps) {
  const { register, watch, setValue } = useFormContext();
  const value = watch(name) || "";
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const { ref: formRef, ...rest } = register(name);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <Input
        placeholder={placeholder}
        className={cn("bg-white border-none shadow-sm rounded-xl scroll-mt-24", inputClassName)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        {...rest}
        ref={(e) => {
          formRef(e);
          // @ts-ignore
          inputRef.current = e;
        }}
        onChange={(e) => {
          rest.onChange(e);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          // Ensure coords are fresh on focus (keyboard pop)
          setTimeout(updateCoords, 300);
        }}
        onKeyDown={handleKeyDown}
      />
      
      {createPortal(
        <AnimatePresence>
          {isOpen && suggestions.length > 0 && (
            <motion.ul
              ref={listRef}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute z-[9999] mt-2 py-2 bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-soft-2xl rounded-2xl text-right overflow-y-auto overscroll-contain touch-pan-y"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: "220px",
                WebkitOverflowScrolling: "touch"
              }}
            >
              {suggestions.map((suggestion, idx) => (
                <li
                  key={suggestion}
                  className={cn(
                    "px-6 py-4 text-[15px] font-bold cursor-pointer transition-all flex items-center justify-start border-b border-slate-50 last:border-none active:bg-blue-50/50",
                    idx === activeIndex ? "bg-blue-50 text-blue-600" : "text-slate-700"
                  )}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <span className="truncate">{suggestion}</span>
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
