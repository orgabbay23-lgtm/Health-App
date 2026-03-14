export function getProgressAppearance(
  currentValue: number,
  targetValue: number,
) {
  if (targetValue <= 0) {
    return {
      barClass: "bg-sky-500",
      badgeClass: "bg-sky-50 text-sky-700",
      percentage: 0,
    };
  }

  const percentage = Math.max(
    0,
    Math.round((currentValue / targetValue) * 100),
  );

  if (percentage < 80) {
    return {
      barClass: "bg-sky-500",
      badgeClass: "bg-sky-50 text-sky-700",
      percentage,
    };
  }

  if (percentage <= 100) {
    return {
      barClass: "bg-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700",
      percentage,
    };
  }

  return {
    barClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700",
    percentage,
  };
}
