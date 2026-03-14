import { ChangeEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  DashboardPeriod,
  NavigationDirection,
  PeriodDetails,
  canShiftReferenceDate,
  clampToHistoryWindow,
  dayKeyToDate,
  formatDayKey,
  getHistoryWindow,
  shiftReferenceDate,
} from "../../../utils/date-navigation";

interface DateNavigatorProps {
  periodMode: DashboardPeriod;
  periodDetails: PeriodDetails;
  onDateChange: (nextDate: Date) => void;
}

export function DateNavigator({
  periodMode,
  periodDetails,
  onDateChange,
}: DateNavigatorProps) {
  const historyWindow = getHistoryWindow();

  const handleShift = (direction: NavigationDirection) => {
    onDateChange(
      shiftReferenceDate(periodDetails.referenceDate, periodMode, direction),
    );
  };

  const handleDateInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) {
      return;
    }

    onDateChange(clampToHistoryWindow(dayKeyToDate(event.target.value)));
  };

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.18em] text-sky-500">
          TIME WINDOW
        </p>
        <h2 className="text-xl font-semibold text-slate-900">
          {periodDetails.label}
        </h2>
        <p className="text-sm text-slate-500">{periodDetails.caption}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-white"
            onClick={() => handleShift("previous")}
            disabled={
              !canShiftReferenceDate(
                periodDetails.referenceDate,
                periodMode,
                "previous",
              )
            }
            aria-label="עבור לטווח הקודם"
          >
            <ChevronRight size={18} />
          </Button>

          <div className="min-w-[132px] px-2 text-center text-sm font-medium text-slate-700">
            {periodMode === "daily"
              ? "יום"
              : periodMode === "weekly"
                ? "שבוע"
                : "חודש"}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-white"
            onClick={() => handleShift("next")}
            disabled={
              !canShiftReferenceDate(
                periodDetails.referenceDate,
                periodMode,
                "next",
              )
            }
            aria-label="עבור לטווח הבא"
          >
            <ChevronLeft size={18} />
          </Button>
        </div>

        <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <CalendarDays size={16} className="text-slate-400" />
          <span className="text-sm text-slate-500">בחר תאריך</span>
          <input
            type="date"
            dir="ltr"
            value={formatDayKey(periodDetails.referenceDate)}
            min={formatDayKey(historyWindow.earliest)}
            max={formatDayKey(historyWindow.latest)}
            onChange={handleDateInput}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
          />
        </label>
      </div>
    </div>
  );
}
