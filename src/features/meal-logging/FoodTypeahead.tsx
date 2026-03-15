import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../../components/ui/input";
import { foodSuggestions } from "../../utils/food-suggestions";
import { useAppStore } from "../../store";
import { cn } from "../../utils/utils";

interface FoodTypeaheadProps {
  index: number;
}

export function FoodTypeahead({ index }: FoodTypeaheadProps) {
  const { register, watch, setValue } = useFormContext();
  const value = watch(`ingredients.${index}.foodName`) || "";
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dailyLogs = useAppStore((state) => state.dailyLogs);

  useEffect(() => {
    if (value.length >= 2 && isOpen) {
      // 1. Prioritize user history
      const historySet = new Set<string>();
      Object.values(dailyLogs).forEach((log) => {
        log.meals.forEach((m) => {
          if (m.meal_name.includes(value)) {
            historySet.add(m.meal_name);
          }
        });
      });
      const historyMatches = Array.from(historySet);

      // 2. Secondary search from 1000-item DB
      const dbMatches = foodSuggestions.filter((item) => 
        item.includes(value) && !historySet.has(item)
      );

      const combined = [...historyMatches, ...dbMatches].slice(0, 10);
      setSuggestions(combined);
      setActiveIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [value, isOpen, dailyLogs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setValue(`ingredients.${index}.foodName`, suggestion, { shouldValidate: true });
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Register form field
  const { ref: formRef, ...rest } = register(`ingredients.${index}.foodName`);

  return (
    <div className="relative" ref={containerRef}>
      <Input
        placeholder="שם המאכל"
        className="bg-white border-none shadow-sm rounded-xl"
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
            className="absolute z-[100] w-full mt-2 py-1 bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-soft-xl rounded-2xl overflow-hidden text-right"
          >
            {suggestions.map((suggestion, idx) => (
              <li
                key={suggestion}
                className={cn(
                  "px-4 py-3 text-sm font-medium cursor-pointer transition-colors ms-2 flex items-center justify-start",
                  idx === activeIndex ? "bg-slate-100/80 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                )}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
