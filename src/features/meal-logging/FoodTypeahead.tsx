import { useState, useEffect, useRef } from "react";
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
}

export function FoodTypeahead({ 
  name, 
  placeholder = "שם המאכל", 
  className,
  inputClassName 
}: FoodTypeaheadProps) {
  const { register, watch, setValue } = useFormContext();
  const value = watch(name) || "";
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dailyLogs = useAppStore((state) => state.dailyLogs);

  useEffect(() => {
    // Only search if we have at least 2 characters
    if (value.length >= 2 && isOpen) {
      // 1. Prioritize user history
      const historySet = new Set<string>();
      Object.values(dailyLogs).forEach((log) => {
        log.meals.forEach((m) => {
          if (m.meal_name.toLowerCase().includes(value.toLowerCase())) {
            historySet.add(m.meal_name);
          }
        });
      });
      const historyMatches = Array.from(historySet);

      // 2. Secondary search from massive DB
      // We search for matches anywhere in the string for the "Smart" tab, 
      // but prioritize start-of-string for better UX
      const dbMatches = foodSuggestions.filter((item) => 
        item.toLowerCase().includes(value.toLowerCase()) && !historySet.has(item)
      );

      // Sort dbMatches: those starting with the value come first
      dbMatches.sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(value.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(value.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });

      const combined = [...historyMatches, ...dbMatches].slice(0, 8);
      setSuggestions(combined);
      setActiveIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [value, isOpen, dailyLogs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    setValue(name, suggestion, { shouldValidate: true });
    setIsOpen(false);
    // Maintain focus but close the list
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const { ref: formRef, ...rest } = register(name);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <Input
        placeholder={placeholder}
        className={cn("bg-white border-none shadow-sm rounded-xl", inputClassName)}
        autoComplete="off"
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
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] w-full mt-2 py-2 bg-white/90 backdrop-blur-2xl border border-slate-200/60 shadow-soft-2xl rounded-2xl overflow-hidden text-right"
          >
            {suggestions.map((suggestion, idx) => (
              <li
                key={suggestion}
                className={cn(
                  "px-5 py-3 text-[14px] font-bold cursor-pointer transition-all flex items-center justify-start border-b border-slate-50 last:border-none",
                  idx === activeIndex ? "bg-blue-50 text-blue-600" : "text-slate-700 active:bg-slate-100"
                )}
                // Use onPointerDown for mobile to trigger before focus/blur events
                onPointerDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  selectSuggestion(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className="truncate">{suggestion}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
