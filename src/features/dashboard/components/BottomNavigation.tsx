import { motion } from "framer-motion";
import { CalendarDays, Home, Plus, UserRound } from "lucide-react";
import { cn } from "../../../utils/utils";
import type { DashboardScreen } from "../types";

interface BottomNavigationProps {
  activeScreen: DashboardScreen;
  onNavigate: (screen: Exclude<DashboardScreen, never>) => void;
  onOpenMealModal: () => void;
}

const navigationItems: Array<{
  key: DashboardScreen | "add";
  label: string;
  icon: typeof Home;
}> = [
  { key: "home", label: "בית", icon: Home },
  { key: "calendar", label: "יומן", icon: CalendarDays },
  { key: "add", label: "הוסף", icon: Plus },
  { key: "profile", label: "פרופיל", icon: UserRound },
];

export function BottomNavigation({
  activeScreen,
  onNavigate,
  onOpenMealModal,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 md:hidden pb-safe">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        className="bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] rounded-[3rem] p-3 neo-blur"
      >
        <div className="flex items-center justify-around">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isAdd = item.key === "add";
            const active = !isAdd && activeScreen === item.key;

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
                    ? "h-16 w-16 rounded-[2rem] bg-slate-950 text-white shadow-2xl -mt-12 border-[6px] border-slate-50/50" 
                    : "flex-1 h-12 rounded-2xl"
                )}
                onClick={() =>
                  isAdd ? onOpenMealModal() : onNavigate(item.key as DashboardScreen)
                }
              >
                {active && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-slate-900/5 rounded-2xl -z-10"
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
                    <motion.div 
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
  );
}
