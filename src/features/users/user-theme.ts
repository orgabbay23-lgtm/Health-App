import type { UserAccentToken } from "../../store";

export const accentThemeMap: Record<
  UserAccentToken,
  {
    avatar: string;
    avatarRing: string;
    soft: string;
    button: string;
  }
> = {
  sun: {
    avatar: "bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 text-slate-950",
    avatarRing: "ring-amber-200/70",
    soft: "bg-amber-50 text-amber-700",
    button: "border-amber-200 bg-amber-50 hover:bg-amber-100",
  },
  sky: {
    avatar: "bg-gradient-to-br from-sky-300 via-cyan-300 to-blue-400 text-slate-950",
    avatarRing: "ring-sky-200/70",
    soft: "bg-sky-50 text-sky-700",
    button: "border-sky-200 bg-sky-50 hover:bg-sky-100",
  },
  mint: {
    avatar: "bg-gradient-to-br from-emerald-200 via-teal-200 to-lime-300 text-slate-950",
    avatarRing: "ring-emerald-200/70",
    soft: "bg-emerald-50 text-emerald-700",
    button: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
  },
  rose: {
    avatar: "bg-gradient-to-br from-rose-200 via-fuchsia-200 to-pink-300 text-slate-950",
    avatarRing: "ring-rose-200/70",
    soft: "bg-rose-50 text-rose-700",
    button: "border-rose-200 bg-rose-50 hover:bg-rose-100",
  },
  slate: {
    avatar: "bg-gradient-to-br from-slate-300 via-zinc-300 to-stone-300 text-slate-950",
    avatarRing: "ring-slate-200/70",
    soft: "bg-slate-100 text-slate-700",
    button: "border-slate-200 bg-slate-100 hover:bg-slate-200/70",
  },
};

export function getUserInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}
