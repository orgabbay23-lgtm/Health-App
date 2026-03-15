import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { motion } from "framer-motion";
import {
  formatNutritionValue,
  type NutritionSafetyAlert,
} from "../../../utils/nutrition-utils";

interface SafetyAlertsCardProps {
  alerts: NutritionSafetyAlert[];
}

export function SafetyAlertsCard({ alerts }: SafetyAlertsCardProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {alerts.map((alert) => (
        <Card key={alert.id} className="border-none bg-rose-50/60 backdrop-blur-sm shadow-soft-sm rounded-3xl overflow-hidden">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/80 text-rose-500 shadow-sm">
                <AlertTriangle size={18} />
              </div>
              <h4 className="text-sm font-bold text-rose-900/80 leading-tight">
                {alert.title}
              </h4>
            </div>

            <p className="text-sm font-medium text-rose-800/70 leading-relaxed px-1">
              {alert.message}
            </p>

            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-rose-400 mt-1 px-1">
              <span>נוכחי: {formatNutritionValue(alert.currentValue)} {alert.unit}</span>
              <span>גבול: {formatNutritionValue(alert.limit)} {alert.unit}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

