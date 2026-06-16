import * as React from "react";
import { cn } from "../../utils/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 text-[16px] ring-offset-background shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all focus-visible:outline-none focus-visible:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Select.displayName = "Select";

export { Select };
