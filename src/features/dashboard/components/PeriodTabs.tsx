import type { LucideIcon } from "lucide-react";
import { Calendar, CalendarRange, ChartColumnBig } from "lucide-react";
import { cn } from "../../../utils/utils";
import { type DashboardPeriod } from "../../../utils/date-navigation";

interface PeriodTabsProps {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
}

const items: Array<{
  value: DashboardPeriod;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "daily", label: "היום", icon: Calendar },
  { value: "weekly", label: "השבוע", icon: CalendarRange },
  { value: "monthly", label: "החודש", icon: ChartColumnBig },
];

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <div className="inline-flex items-center gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all duration-300",
              active
                ? "bg-slate-950 text-white shadow-lg scale-105"
                : "text-slate-500 hover:bg-white/50 hover:text-slate-900",
            )}
            onClick={() => onChange(item.value)}
          >
            <Icon size={14} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
