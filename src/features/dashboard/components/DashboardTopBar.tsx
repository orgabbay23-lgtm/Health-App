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
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/25 via-indigo-400/20 to-emerald-400/25 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

        <div className="specular relative flex items-center bg-white/70 backdrop-blur-xl border border-white/70 shadow-premium rounded-full p-1.5 transition-all hover:shadow-premium-lg">
          <PeriodTabs value={periodMode} onChange={onPeriodChange} />
        </div>
      </motion.div>
    </header>
  );
}
