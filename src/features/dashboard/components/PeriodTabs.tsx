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
    <div className="inline-flex rounded-full border border-white/70 bg-white/88 p-1 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
              active
                ? "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
            )}
            onClick={() => onChange(item.value)}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
