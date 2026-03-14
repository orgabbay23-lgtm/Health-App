import { CalendarDays, Home, Plus, UserRound } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
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
    <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
      <Card className="border-white/80 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.14)] backdrop-blur">
        <CardContent className="grid grid-cols-4 gap-2 p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = item.key !== "add" && activeScreen === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "rounded-[20px] px-2 py-3 text-xs font-medium transition",
                  item.key === "add"
                    ? "bg-slate-950 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]"
                    : active
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-500 hover:bg-slate-50",
                )}
                onClick={() =>
                  item.key === "add" ? onOpenMealModal() : onNavigate(item.key)
                }
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
