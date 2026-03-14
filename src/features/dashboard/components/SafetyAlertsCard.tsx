import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import {
  formatNutritionValue,
  NutritionSafetyAlert,
} from "../../../utils/nutrition-utils";

interface SafetyAlertsCardProps {
  alerts: NutritionSafetyAlert[];
}

export function SafetyAlertsCard({ alerts }: SafetyAlertsCardProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-[30px] border-rose-200/70 bg-rose-50/85 shadow-[0_18px_42px_rgba(244,63,94,0.12)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/80 p-3 text-rose-600 shadow-sm">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              התראות בטיחות
            </h3>
            <p className="text-sm text-slate-500">
              האזהרות מחושבות מול גבולות הצריכה העליונים
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-[20px] border border-white/70 bg-white/92 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-rose-600">{alert.title}</p>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                  חריגה
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {alert.message}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                נוכחי: {formatNutritionValue(alert.currentValue)} {alert.unit} |
                גבול: {formatNutritionValue(alert.limit)} {alert.unit}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
