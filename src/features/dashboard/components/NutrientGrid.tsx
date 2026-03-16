import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { MicronutrientKey, MicronutrientTotals } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { NutrientCard } from "./NutrientCard";

interface NutrientGridProps {
  current: MicronutrientTotals;
  target: MicronutrientTotals;
  userProfile: UserProfile;
}

const TIER_1: MicronutrientKey[] = [
  "fiber",
  "vitaminD",
  "vitaminB12",
  "iron",
  "magnesium",
  "iodine",
];

const TIER_2: MicronutrientKey[] = [
  "zinc",
  "vitaminC",
  "vitaminA",
  "folicAcid",
  "calcium",
  "omega3",
];

const TIER_3: MicronutrientKey[] = [
  "potassium",
  "vitaminK",
  "vitaminE",
  "selenium",
  "vitaminB6",
  "vitaminB3",
  "vitaminB1",
  "vitaminB2",
  "vitaminB5",
  "biotin",
  "copper",
  "manganese",
  "chromium",
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
};

export function NutrientGrid({
  current,
  target,
  userProfile,
}: NutrientGridProps) {
  const [showTier2, setShowTier2] = useState(false);
  const [showTier3, setShowTier3] = useState(false);

  return (
    <div className="space-y-4">
      {/* Tier 1 — Always visible */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {TIER_1.map((nutrient, index) => (
          <NutrientCard
            key={nutrient}
            nutrient={nutrient}
            current={current[nutrient]}
            target={target[nutrient]}
            userProfile={userProfile}
            index={index}
          />
        ))}
      </div>

      {/* Expand to Tier 2 */}
      {!showTier2 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowTier2(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 text-[13px] font-bold text-slate-500 shadow-soft-sm"
        >
          <span>הרחב</span>
          <ChevronDown className="w-4 h-4" />
        </motion.button>
      )}

      <AnimatePresence>
        {showTier2 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-2 gap-3 md:grid-cols-3"
          >
            {TIER_2.map((nutrient) => (
              <motion.div key={nutrient} variants={staggerItem}>
                <NutrientCard
                  nutrient={nutrient}
                  current={current[nutrient]}
                  target={target[nutrient]}
                  userProfile={userProfile}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand to Tier 3 */}
      {showTier2 && !showTier3 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowTier3(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 text-[13px] font-bold text-slate-500 shadow-soft-sm"
        >
          <span>ערכים נוספים</span>
          <ChevronDown className="w-4 h-4" />
        </motion.button>
      )}

      <AnimatePresence>
        {showTier3 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-2 gap-3 md:grid-cols-3"
          >
            {TIER_3.map((nutrient) => (
              <motion.div key={nutrient} variants={staggerItem}>
                <NutrientCard
                  nutrient={nutrient}
                  current={current[nutrient]}
                  target={target[nutrient]}
                  userProfile={userProfile}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse button */}
      {showTier2 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowTier2(false); setShowTier3(false); }}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 text-[13px] font-bold text-slate-500 shadow-soft-sm"
        >
          <span>צמצם</span>
          <ChevronDown className="w-4 h-4 rotate-180" />
        </motion.button>
      )}
    </div>
  );
}
