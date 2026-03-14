import { Sparkles } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

interface GuidanceCardProps {
  flags: string[];
}

export function GuidanceCard({ flags }: GuidanceCardProps) {
  if (flags.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-[30px] border-sky-200/70 bg-sky-50/85 shadow-[0_18px_42px_rgba(14,165,233,0.12)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/80 p-3 text-sky-600 shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              דגשים קליניים מותאמים
            </h3>
            <p className="text-sm text-slate-500">
              המערכת זיהתה התאמות לפי הפרופיל האישי שלך
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag}
              className="rounded-[20px] border border-white/70 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-600"
            >
              {flag}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
