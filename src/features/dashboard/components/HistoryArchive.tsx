import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { dayKeyToDate, getHistoryWindow } from "../../../utils/date-navigation";
import type { DailyLog } from "../../../store";
import { cn } from "../../../utils/utils";

interface HistoryArchiveProps {
  dailyLogs: Record<string, DailyLog>;
  selectedDayKey: string;
  onSelect: (dayKey: string) => void;
}

export function HistoryArchive({
  dailyLogs,
  selectedDayKey,
  onSelect,
}: HistoryArchiveProps) {
  const historyWindow = getHistoryWindow();
  const entries = Object.entries(dailyLogs)
    .filter(([dayKey]) => {
      const date = dayKeyToDate(dayKey);
      return date >= historyWindow.earliest && date <= historyWindow.latest;
    })
    .sort(([a], [b]) => b.localeCompare(a));

  return (
    <Card className="rounded-[30px] border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
            ARCHIVE
          </p>
          <h3 className="text-xl font-semibold text-slate-900">יומן אחרון</h3>
          <p className="text-sm text-slate-500">
            גישה מהירה לרישומים של החודשיים האחרונים
          </p>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              עדיין אין ימים שמורים להצגה.
            </div>
          ) : (
            entries.map(([dayKey, log], index) => (
              <motion.button
                key={dayKey}
                type="button"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-right transition",
                  selectedDayKey === dayKey
                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_35px_rgba(15,23,42,0.22)]"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
                )}
                onClick={() => onSelect(dayKey)}
              >
                <div className="space-y-1">
                  <p className="font-semibold">{formatDay(dayKey)}</p>
                  <p
                    className={cn(
                      "text-xs",
                      selectedDayKey === dayKey
                        ? "text-slate-300"
                        : "text-slate-500",
                    )}
                  >
                    {log.meals.length} ארוחות
                  </p>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                    selectedDayKey === dayKey
                      ? "bg-white/10 text-white"
                      : "bg-white text-slate-500 shadow-sm",
                  )}
                >
                  <CalendarClock size={14} />
                  {Math.round(log.aggregations.calories)} קק"ל
                </div>
              </motion.button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDay(dayKey: string) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(dayKeyToDate(dayKey));
}
