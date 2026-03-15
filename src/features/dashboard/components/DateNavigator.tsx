import { type ChangeEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  type DashboardPeriod,
  type NavigationDirection,
  type PeriodDetails,
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
    <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-[13px] font-semibold tracking-[0.18em] text-slate-500">
          ניווט תאריכים
        </p>
        <h2 className="text-lg font-semibold text-slate-950">
          {periodDetails.label}
        </h2>
        <p className="text-sm text-slate-500">{periodDetails.caption}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
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

          <span className="min-w-[92px] px-2 text-center text-sm font-medium text-slate-700">
            {periodMode === "daily"
              ? "יום"
              : periodMode === "weekly"
                ? "שבוע"
                : "חודש"}
          </span>

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
          <span className="text-sm text-slate-500">בחירת תאריך</span>
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
