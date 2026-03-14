import { cn } from "../../utils/utils";
import type { UserAccentToken } from "../../store";
import { accentThemeMap, getUserInitials } from "./user-theme";

interface UserAvatarProps {
  name: string;
  accent: UserAccentToken;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-20 w-20 text-xl",
};

export function UserAvatar({
  name,
  accent,
  size = "md",
  className,
}: UserAvatarProps) {
  const theme = accentThemeMap[accent];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-[28px] font-semibold shadow-[0_18px_38px_rgba(15,23,42,0.12)] ring-4",
        sizeMap[size],
        theme.avatar,
        theme.avatarRing,
        className,
      )}
      aria-hidden="true"
    >
      {getUserInitials(name)}
    </div>
  );
}
