import { motion } from "framer-motion";
import { PeriodTabs } from "./PeriodTabs";
import type { DashboardPeriod } from "../../../utils/date-navigation";

interface DashboardTopBarProps {
  periodMode: DashboardPeriod;
  onPeriodChange: (nextMode: DashboardPeriod) => void;
}

export function DashboardTopBar({
  periodMode,
  onPeriodChange,
}: DashboardTopBarProps) {
  return (
    <header className="sticky top-4 z-50 flex justify-center w-full px-4">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative group"
      >
        {/* Glassmorphism Background Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/20 to-emerald-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative flex items-center bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.08)] rounded-full p-1.5 transition-all hover:shadow-[0_12px_48px_rgba(15,23,42,0.12)]">
          <PeriodTabs value={periodMode} onChange={onPeriodChange} />
        </div>
      </motion.div>
    </header>
  );
}
