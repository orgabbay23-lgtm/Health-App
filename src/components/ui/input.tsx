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
          "flex h-11 w-full rounded-2xl border border-input bg-background/95 px-4 py-2 text-right text-[16px] shadow-[0_8px_20px_rgba(15,23,42,0.04)] ring-offset-background file:border-0 file:bg-transparent file:text-[16px] file:font-medium placeholder:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
