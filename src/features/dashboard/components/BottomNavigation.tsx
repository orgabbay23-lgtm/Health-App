import { motion } from "framer-motion";
import { CalendarDays, Home, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "../../../utils/utils";
import type { DashboardScreen } from "../types";
import { SafeLayoutMotion } from "../../../components/SafeLayoutMotion";

interface BottomNavigationProps {
  activeScreen: DashboardScreen;
  onNavigate: (screen: DashboardScreen) => void;
  onOpenMealModal: () => void;
  onOpenMoreSheet: () => void;
}

const navigationItems: Array<{
  key: DashboardScreen | "add" | "more";
  label: string;
  icon: typeof Home;
}> = [
  { key: "home", label: "בית", icon: Home },
  { key: "calendar", label: "יומן", icon: CalendarDays },
  { key: "add", label: "הוסף", icon: Plus },
  { key: "more", label: "עוד", icon: MoreHorizontal },
];

export function BottomNavigation({
  activeScreen,
  onNavigate,
  onOpenMealModal,
  onOpenMoreSheet,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe-bottom z-[50] flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
          style={{ transform: "translateZ(0)" }}
          className="specular bg-white/70 backdrop-blur-2xl border border-white/70 shadow-premium-lg rounded-[3rem] p-3 neo-blur"
        >
        <div className="flex items-center justify-around">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isAdd = item.key === "add";
            const isMore = item.key === "more";
            const active = (!isAdd && !isMore && activeScreen === item.key) || 
                          (isMore && (activeScreen === "profile" || activeScreen === "weight"));

            return (
              <motion.button
                key={item.key}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (index * 0.05) }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-300",
                  isAdd
                    ? "shine h-16 w-16 rounded-[2rem] bg-gradient-to-br from-slate-800 via-slate-950 to-indigo-950 text-white shadow-[0_16px_36px_-8px_rgba(30,27,75,0.65)] -mt-12 border-[6px] border-white/70"
                    : "flex-1 h-12 rounded-2xl"
                )}
                onClick={() => {
                  if (isAdd) {
                    onOpenMealModal();
                  } else if (isMore) {
                    onOpenMoreSheet();
                  } else {
                    onNavigate(item.key as DashboardScreen);
                  }
                }}
              >
                {active && (
                  <SafeLayoutMotion
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-gradient-to-b from-slate-900/[0.09] to-slate-900/[0.03] ring-1 ring-inset ring-white/60 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative">
                  <Icon 
                    size={isAdd ? 32 : 24} 
                    className={cn(
                      "transition-all duration-300",
                      active ? "text-slate-950 scale-110" : isAdd ? "text-white" : "text-slate-400"
                    )} 
                  />
                  {active && (
                    <SafeLayoutMotion
                      layoutId="active-nav-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-950"
                    />
                  )}
                </div>

                {!isAdd && (
                   <span className={cn(
                     "text-[9px] font-black mt-1 uppercase tracking-tighter transition-colors duration-300",
                     active ? "text-slate-950" : "text-slate-400"
                   )}>
                     {item.label}
                   </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
      </div>
    </div>
  );
}
