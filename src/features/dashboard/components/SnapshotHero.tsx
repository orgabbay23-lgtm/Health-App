import { motion } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";

interface SnapshotHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
}

export function SnapshotHero({
  eyebrow,
  title,
  subtitle,
  stats,
}: SnapshotHeroProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden rounded-[34px] border-white/55 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,249,255,0.92))] shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
        <CardContent className="grid gap-8 p-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.22em] text-sky-500">
              {eyebrow}
            </p>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
                {title}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
