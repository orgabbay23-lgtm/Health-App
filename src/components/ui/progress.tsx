import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    const safeValue = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-3.5 w-full overflow-hidden rounded-full bg-slate-100/90",
          className,
        )}
        {...props}
      >
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 right-0 rounded-full bg-primary shadow-[0_8px_20px_rgba(59,130,246,0.28)]",
            indicatorClassName,
          )}
          style={{ transformOrigin: "right center" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: safeValue / 100 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
