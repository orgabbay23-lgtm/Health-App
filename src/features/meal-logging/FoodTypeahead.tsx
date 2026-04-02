import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import { Input } from "../../components/ui/input";
import { foodSuggestions } from "../../utils/food-suggestions";
import { useAppStore } from "../../store";
import { cn } from "../../utils/utils";

/**
 * Splits input into baseText (before last delimiter) and activeQuery (after).
 * Delimiters: newline, comma, standalone "עם" (with surrounding spaces or at start).
 */
function extractActiveQuery(text: string): { baseText: string; activeQuery: string } {
  const delimiterRegex = /\n|,|\sעם\s|^עם\s|\sו|^ו/g;

  let lastMatch: { index: number; length: number } | null = null;
  let match;

  while ((match = delimiterRegex.exec(text)) !== null) {
    lastMatch = { index: match.index, length: match[0].length };
  }

  if (!lastMatch) {
    return { baseText: '', activeQuery: text.trim() };
  }

  const splitPoint = lastMatch.index + lastMatch.length;
  return {
    baseText: text.substring(0, splitPoint),
    activeQuery: text.substring(splitPoint).trim(),
  };
}

/**
 * Weighted scoring engine: ranks suggestions by match quality, not just presence.
 * Exact > starts-with > word-exact > word-starts-with > contains.
 * Hebrew vav prefix: "וX" also matches "X".
 */
function scoreSuggestion(suggestion: string, query: string): number {
  const cleaned = query.replace(/,/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 0;

  const words = cleaned.split(' ').filter(Boolean);
  const lowerSuggestion = suggestion.toLowerCase();
  const suggestionWords = lowerSuggestion.split(' ');

  let matchScore = 0;
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    const withoutVav = lowerWord.startsWith('ו') ? lowerWord.substring(1) : lowerWord;

    let score = 0;
    for (const qWord of [lowerWord, withoutVav]) {
      if (!qWord) continue;
      let currentScore = 0;
      if (lowerSuggestion === qWord) currentScore = 100;
      else if (lowerSuggestion.startsWith(qWord)) currentScore = 50;
      else if (suggestionWords.some(w => w === qWord)) currentScore = 30;
      else if (suggestionWords.some(w => w.startsWith(qWord))) currentScore = 20;
      else if (lowerSuggestion.includes(qWord)) currentScore = 5;

      if (currentScore > score) score = currentScore;
    }
    matchScore += score;
  }
  return matchScore;
}

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
  multiLine = false,
  rows = 2,
}: FoodTypeaheadProps) {
  const { register, watch, setValue } = useFormContext();
  const value = watch(name) || "";

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const dailyLogs = useAppStore((state) => state.dailyLogs);

  useEffect(() => {
    const { activeQuery } = extractActiveQuery(value);

    if (activeQuery.length >= 2 && isOpen) {
      // Debounce suggestion computation to avoid blocking main thread on rapid keystrokes
      const timer = setTimeout(() => {
        const historySet = new Set<string>();
        const scored: { name: string; score: number }[] = [];

        Object.values(dailyLogs).forEach((log) => {
          log.meals.forEach((m) => {
            const score = scoreSuggestion(m.meal_name, activeQuery);
            if (score > 0 && !historySet.has(m.meal_name)) {
              historySet.add(m.meal_name);
              scored.push({ name: m.meal_name, score });
            }
          });
        });

        for (const item of foodSuggestions) {
          if (historySet.has(item)) continue;
          const score = scoreSuggestion(item, activeQuery);
          if (score > 0) {
            scored.push({ name: item, score });
          }
        }

        scored.sort((a, b) => b.score - a.score || a.name.length - b.name.length);
        setSuggestions(scored.slice(0, 15).map((s) => s.name));
        setActiveIndex(-1);
      }, 120);

      return () => clearTimeout(timer);
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

  // Auto-scroll the dropdown into view when suggestions appear
  useEffect(() => {
    if (suggestions.length > 0 && isOpen && listRef.current) {
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 180);
    }
  }, [suggestions.length > 0, isOpen]);

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
    const { baseText, activeQuery } = extractActiveQuery(value);
    const tokens = activeQuery.split(/(\s+)/);
    const matchIndex = tokens.findIndex(
      (token) => token.trim() && scoreSuggestion(suggestion, token) > 0
    );

    let prefix: string;
    let insertedValue: string;

    if (matchIndex >= 0) {
      prefix = tokens.slice(0, matchIndex).join('');
      insertedValue = suggestion;
      const matchedToken = tokens[matchIndex];
      if (matchedToken.startsWith('ו') && !suggestion.startsWith('ו')) {
        insertedValue = 'ו' + insertedValue;
      }
    } else {
      prefix = '';
      insertedValue = suggestion;
    }

    setValue(name, baseText + prefix + insertedValue + ' ', { shouldValidate: true });
    setIsOpen(false);
    setSuggestions([]);
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
      // iOS: scroll input into view after virtual keyboard finishes expanding
      // 450ms accounts for slower keyboard animation on low-end iOS devices
      const target = e.target;
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 450);
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
            "flex w-full rounded-2xl border border-input bg-background/95 px-4 py-3 text-right text-[16px] shadow-[0_8px_20px_rgba(15,23,42,0.04)] ring-offset-background placeholder:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none whitespace-pre-wrap break-words bg-white border-none shadow-sm rounded-xl",
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
          className={cn("bg-white border-none shadow-sm rounded-xl text-[16px]", inputClassName)}
          ref={(e) => {
            formRef(e);
            // @ts-ignore
            inputRef.current = e;
          }}
        />
      )}

      {/* Inline dropdown — rendered in normal document flow below the input.
          No portal, no fixed positioning, no coordinate math.
          Always physically below the input regardless of iOS keyboard state. */}
      {isOpen && suggestions.length > 0 && (
        <motion.ul
          ref={listRef}
          initial={{ opacity: 0, scaleY: 0.9 }}
          animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: "top" }}
          transition={{ duration: 0.15 }}
          dir="rtl"
          className="mt-2 py-2 bg-white/95 backdrop-blur-2xl border border-slate-200/60 shadow-soft-2xl rounded-2xl text-right overflow-y-auto overscroll-contain touch-pan-y max-h-[200px] relative z-[50] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200/60"
          onPointerDown={(e) => {
            // Prevent input blur on both desktop and iOS touch.
            // pointerdown fires BEFORE blur on all platforms (unlike
            // mousedown which fires after touchstart-induced blur on iOS).
            e.preventDefault();
          }}
        >
          {suggestions.map((suggestion, idx) => (
            <li
              key={`${suggestion}-${idx}`}
              className={cn(
                "px-6 py-3.5 text-[15px] font-bold cursor-pointer transition-all flex items-center justify-start border-b border-slate-50 last:border-none active:bg-blue-50/50 select-none",
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
    </div>
  );
}
