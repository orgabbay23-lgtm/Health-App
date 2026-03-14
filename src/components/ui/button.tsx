import * as React from "react";
import { cn } from "../../utils/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
        "bg-primary text-primary-foreground shadow-[0_14px_32px_rgba(15,23,42,0.18)] hover:bg-primary/92",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/92",
      outline:
        "border border-input bg-background/90 shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-11 rounded-2xl px-4 py-2",
      sm: "h-9 rounded-xl px-3",
      lg: "h-12 rounded-2xl px-8",
      icon: "h-10 w-10 rounded-full",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
