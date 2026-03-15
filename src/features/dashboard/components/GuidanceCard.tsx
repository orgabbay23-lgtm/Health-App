import { Sparkles } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { motion } from "framer-motion";

interface GuidanceCardProps {
  flags: string[];
}

export function GuidanceCard({ flags }: GuidanceCardProps) {
  if (flags.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-3"
    >
      {flags.map((flag) => (
        <Card key={flag} className="border-none bg-blue-50/60 backdrop-blur-sm shadow-soft-sm rounded-3xl overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-white/80 text-blue-500 shadow-sm">
              <Sparkles size={18} />
            </div>
            <p className="text-sm font-bold text-blue-900/80 leading-relaxed">
              {flag}
            </p>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
