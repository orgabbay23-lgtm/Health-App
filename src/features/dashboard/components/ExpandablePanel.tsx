import { type ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { cn } from "../../../utils/utils";

interface ExpandablePanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function ExpandablePanel({
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: ExpandablePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-right"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="space-y-1">
          <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
          {description ? (
            <p className="text-sm text-slate-500">{description}</p>
          ) : null}
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="text-slate-400" size={20} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <CardHeader className="hidden" />
            <CardContent className="pt-0">{children}</CardContent>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
