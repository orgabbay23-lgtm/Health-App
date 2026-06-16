import * as React from "react";
import { cn } from "../../utils/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, dir, type, ...props }, ref) => {
    return (
      <input
        dir={dir ?? "rtl"}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 text-right text-[16px] shadow-[0_8px_20px_rgba(15,23,42,0.04)] ring-offset-background file:border-0 file:bg-transparent file:text-[16px] file:font-medium placeholder:text-muted-foreground/90 transition-all focus-visible:outline-none focus-visible:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
