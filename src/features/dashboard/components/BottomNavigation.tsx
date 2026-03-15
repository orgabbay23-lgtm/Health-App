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
    <div className="fixed bottom-0 left-0 w-full z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-4 gap-2 p-2 pb-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = item.key !== "add" && activeScreen === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "rounded-button px-2 py-2 text-xs font-medium transition min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1",
                  item.key === "add"
                    ? "bg-slate-950 text-white shadow-soft-sm"
                    : active
                      ? "text-slate-950 dark:text-white"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800",
                )}
                onClick={() =>
                  item.key === "add" ? onOpenMealModal() : onNavigate(item.key)
                }
              >
                <Icon size={20} className={active ? "text-blue-500" : ""} />
                <span className="text-[10px] leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
