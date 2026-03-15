import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../utils/utils";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "variant"> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default:
        "bg-slate-950 text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:bg-slate-900 active:bg-slate-800",
      destructive:
        "bg-rose-500 text-white shadow-[0_10px_20px_-5px_rgba(244,63,94,0.3)] hover:bg-rose-600",
      outline:
        "border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm hover:bg-slate-50 hover:border-slate-300",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80",
      ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
      link: "text-slate-950 underline-offset-4 hover:underline font-bold",
    };

    const sizes = {
      default: "h-12 rounded-[1.25rem] px-6 text-sm font-black tracking-tight",
      sm: "h-10 rounded-xl px-4 text-xs font-bold",
      lg: "h-14 rounded-[1.5rem] px-10 text-base font-black",
      icon: "h-11 w-11 rounded-2xl flex items-center justify-center",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...(props as any)}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
