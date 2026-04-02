import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CatLoadingAnimationProps {
  texts?: string[];
  textColor?: string;
  className?: string;
}

const FOOD_ITEMS = ["🍔", "🍣", "🍕", "🍝", "🥑", "🍩"];
const FOOD_POSITIONS = [
  { x: 130, y: 20 },
  { x: 225, y: 75 },
  { x: 225, y: 185 },
  { x: 130, y: 240 },
  { x: 35, y: 185 },
  { x: 35, y: 75 },
];

export function CatLoadingAnimation({
  texts = ["מחשב קלוריות", "בודק ערכים תזונתיים", "בודק חלבון, פחמימות ושומן"],
  textColor = "#ff9f43",
  className = "",
}: CatLoadingAnimationProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Animation Stage */}
      <div className="relative w-[200px] h-[200px]">
        {/* Orbiting food items */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          {FOOD_ITEMS.map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-[26px] drop-shadow-md"
              style={{ left: FOOD_POSITIONS[i].x * (200 / 300), top: FOOD_POSITIONS[i].y * (200 / 300) }}
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              {emoji}
            </motion.div>
          ))}
        </motion.div>

        {/* Floating Cat */}
        <motion.div
          className="absolute z-10"
          style={{ top: 33, left: 33, width: 133, height: 133 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="cat-shadow-loading" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.15" />
              </filter>
            </defs>
            <g filter="url(#cat-shadow-loading)">
              {/* Tail */}
              <path d="M 140,160 Q 180,180 180,140 Q 180,110 160,110" fill="none" stroke="#e18b2c" strokeWidth="16" strokeLinecap="round" />
              {/* Body */}
              <path d="M 50,180 Q 100,220 150,180 L 140,110 Q 100,100 60,110 Z" fill="#ffb142" />
              {/* Ears outer */}
              <polygon points="45,110 25,35 90,65" fill="#ffb142" />
              <polygon points="155,110 175,35 110,65" fill="#ffb142" />
              {/* Ears inner */}
              <polygon points="52,100 35,52 82,75" fill="#ffcccc" />
              <polygon points="148,100 165,52 118,75" fill="#ffcccc" />
              {/* Head */}
              <ellipse cx="100" cy="115" rx="75" ry="60" fill="#ffb142" />
              {/* Forehead stripes */}
              <path d="M 100,55 L 100,75 M 82,60 L 88,75 M 118,60 L 112,75" stroke="#e18b2c" strokeWidth="5" strokeLinecap="round" />
              {/* White cheeks */}
              <ellipse cx="78" cy="132" rx="22" ry="16" fill="#ffffff" />
              <ellipse cx="122" cy="132" rx="22" ry="16" fill="#ffffff" />
              {/* Nose */}
              <polygon points="94,122 106,122 100,130" fill="#ff7eb3" />
              {/* Eyes with blink animation via CSS */}
              <g className="animate-cat-blink" style={{ transformOrigin: "100px 105px" }}>
                <ellipse cx="65" cy="105" rx="11" ry="14" fill="#2d3436" />
                <ellipse cx="135" cy="105" rx="11" ry="14" fill="#2d3436" />
                <circle cx="61" cy="100" r="4.5" fill="#ffffff" />
                <circle cx="67" cy="111" r="2" fill="#ffffff" />
                <circle cx="131" cy="100" r="4.5" fill="#ffffff" />
                <circle cx="137" cy="111" r="2" fill="#ffffff" />
              </g>
              {/* Smile */}
              <path d="M 85,132 Q 100,148 115,132" stroke="#2d3436" strokeWidth="3" fill="transparent" strokeLinecap="round" />
              {/* Blush */}
              <ellipse cx="45" cy="122" rx="10" ry="6" fill="#ff7eb3" opacity="0.4" />
              <ellipse cx="155" cy="122" rx="10" ry="6" fill="#ff7eb3" opacity="0.4" />
              {/* Whiskers */}
              <line x1="10" y1="115" x2="45" y2="122" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <line x1="5" y1="132" x2="42" y2="132" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <line x1="10" y1="149" x2="45" y2="142" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <line x1="190" y1="115" x2="155" y2="122" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <line x1="195" y1="132" x2="158" y2="132" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <line x1="190" y1="149" x2="155" y2="142" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              {/* Front paws */}
              <ellipse cx="70" cy="178" rx="18" ry="14" fill="#e18b2c" />
              <ellipse cx="70" cy="175" rx="15" ry="11" fill="#ffb142" />
              <ellipse cx="130" cy="178" rx="18" ry="14" fill="#e18b2c" />
              <ellipse cx="130" cy="175" rx="15" ry="11" fill="#ffb142" />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Animated text */}
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentTextIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            className="text-[15px] font-bold text-center"
            style={{ color: textColor }}
          >
            {texts[currentTextIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
