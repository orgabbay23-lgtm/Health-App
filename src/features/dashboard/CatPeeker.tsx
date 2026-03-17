import { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import { catQuotes } from "../../data/catQuotes";

interface CatPeekerProps {
  caloriePercentage: number;
}

function getQuoteForPercentage(pct: number): string {
  const safePct = Math.max(0, pct);
  let bucket = catQuotes.find((b) => safePct >= b.minPct && safePct <= b.maxPct);
  if (!bucket) {
    bucket = catQuotes[catQuotes.length - 1];
  }
  const quotes = bucket.quotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function CatPeeker({ caloriePercentage }: CatPeekerProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showQuote = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveQuote(getQuoteForPercentage(caloriePercentage));
    timeoutRef.current = setTimeout(() => {
      setActiveQuote(null);
    }, 4000);
  };

  useEffect(() => {
    fetch("/Orange%20Cat%20Peeping.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch animation");
        return res.json();
      })
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Error loading Lottie animation:", err));
  }, []);

  useEffect(() => {
    showQuote();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!animationData) return null;

  return (
    <div 
      className="absolute -top-[25%] -left-[52%] -rotate-[60deg] -z-10 w-40 h-40 bg-transparent pointer-events-auto cursor-pointer overflow-visible"
      onClick={(e) => {
        e.stopPropagation();
        showQuote();
      }}
    >
      <Lottie
        animationData={animationData}
        loop={false}
        autoplay={true}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      />
      <AnimatePresence>
        {activeQuote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute z-[9999] bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold px-4 py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-max max-w-[200px] text-center pointer-events-none origin-bottom-right"
            style={{ 
              top: '86%', 
              left: '-11%', 
              rotate: '46deg' 
            }}
          >
            {activeQuote}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
