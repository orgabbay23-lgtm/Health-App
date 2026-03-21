import { useEffect, useMemo, useCallback, useState, useId } from "react";
import {
  motion,
  useSpring,
  useTransform,
  AnimatePresence,
  useMotionValue,
} from "framer-motion";
import {
  Droplets,
  Plus,
  RotateCcw,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../../../store";
import {
  calculateDailyWaterTarget,
  goalDeficitToWaterGoal,
} from "../../../utils/hydration-utils";
import type { UserProfile } from "../../../store";

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

interface WaterTrackerProps {
  userProfile: UserProfile;
}

const QUICK_ADD_OPTIONS = [
  { ml: 250, label: "כוס", icon: Plus },
  { ml: 500, label: "בקבוק קטן", icon: Plus },
  { ml: 750, label: "בקבוק בינוני", icon: Plus },
  { ml: 1000, label: "בקבוק גדול", icon: Plus },
] as const;

/* Elegant carafe SVG path — viewBox 0 0 160 290 */
const BOTTLE_PATH =
  "M 60 0 L 60 45 C 60 58 20 75 20 105 L 20 248 C 20 278 45 290 80 290 C 115 290 140 278 140 248 L 140 105 C 140 75 100 58 100 45 L 100 0 Z";
const VB_W = 160;
const VB_H = 290;

/* ═══════════════════════════════════════════════════════════
   SVG Bubble
   ═══════════════════════════════════════════════════════════ */

function SvgBubble({ delay, cx }: { delay: number; cx: number }) {
  const r = 2 + Math.random() * 4;
  return (
    <motion.circle
      cx={cx}
      r={r}
      fill="rgba(255,255,255,0.35)"
      initial={{ cy: VB_H, opacity: 0.7 }}
      animate={{ cy: VB_H - 100 - Math.random() * 60, opacity: 0 }}
      transition={{ duration: 1.5 + Math.random(), delay, ease: "easeOut" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   WaterTracker
   ═══════════════════════════════════════════════════════════ */

export function WaterTracker({ userProfile }: WaterTrackerProps) {
  const {
    dailyWaterAmount,
    dailyWaterTarget,
    customWaterTarget,
    fetchTodayWater,
    logWater,
    setDailyWaterTarget,
    setCustomWaterTarget,
    removeLastWaterLog,
  } = useAppStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [celebrationBubbles, setCelebrationBubbles] = useState<number[]>([]);
  const [addBubbles, setAddBubbles] = useState<{ id: number; x: number }[]>(
    []
  );

  /* unique SVG element IDs */
  const uid = useId().replace(/:/g, "");
  const clipId = `wt-clip-${uid}`;
  const depGrad = `wt-dep-${uid}`;
  const shiGrad = `wt-shi-${uid}`;

  /* ── Business logic (preserved) ────────────────────────── */

  useEffect(() => {
    if (customWaterTarget !== null && customWaterTarget !== undefined) {
      setDailyWaterTarget(customWaterTarget);
      return;
    }

    const target = calculateDailyWaterTarget({
      weight: userProfile.weight,
      age: userProfile.age,
      gender: userProfile.gender,
      activityLevel: userProfile.activityLevel,
      goal: goalDeficitToWaterGoal(userProfile.goalDeficit),
    });
    setDailyWaterTarget(target);
  }, [
    userProfile.weight,
    userProfile.age,
    userProfile.gender,
    userProfile.activityLevel,
    userProfile.goalDeficit,
    customWaterTarget,
    setDailyWaterTarget,
  ]);

  useEffect(() => {
    fetchTodayWater();
  }, [fetchTodayWater]);

  const progress = Math.min(dailyWaterAmount / dailyWaterTarget, 1);
  const percentage = Math.round(progress * 100);
  const isComplete = dailyWaterAmount >= dailyWaterTarget;
  const fillColor = isComplete ? '#34d399' : '#38bdf8';

  const progressMV = useMotionValue(progress);
  useEffect(() => {
    progressMV.set(progress);
  }, [progress, progressMV]);

  const spring = useSpring(progressMV, {
    mass: 1.3,
    stiffness: 90,
    damping: 11,
  });

  /* SVG fill transform */
  const liquidY = useTransform(spring, (v) => VB_H * (1 - v));

  /* Wave path — 2× viewBox width for seamless horizontal loop */
  const wavePath = useMemo(() => {
    const w = VB_W * 2;
    const amp = 5;
    let d = `M 0 0`;
    for (let x = 0; x <= w; x += 8) {
      d += ` L ${x} ${amp * Math.sin((x / w) * Math.PI * 6)}`;
    }
    d += ` L ${w} 30 L 0 30 Z`;
    return d;
  }, []);

  /* ── Handlers (preserved) ──────────────────────────────── */

  const handleAddWater = useCallback(
    async (ml: number) => {
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

      const bubbles = Array.from({ length: 4 }, (_, i) => ({
        id: Date.now() + i,
        x: 25 + Math.random() * 110,
      }));
      setAddBubbles((p) => [...p, ...bubbles]);
      setTimeout(
        () =>
          setAddBubbles((p) =>
            p.filter((b) => !bubbles.some((nb) => nb.id === b.id))
          ),
        2500
      );

      await logWater(ml);

      const newTotal = dailyWaterAmount + ml;
      if (newTotal >= dailyWaterTarget && dailyWaterAmount < dailyWaterTarget) {
        if (navigator.vibrate) navigator.vibrate([50, 80, 50, 80, 100]);
        setCelebrationBubbles(Array.from({ length: 12 }, (_, i) => i));
        setTimeout(() => setCelebrationBubbles([]), 3000);
      }
    },
    [logWater, dailyWaterAmount, dailyWaterTarget]
  );

  const handleUndo = useCallback(async () => {
    if (navigator.vibrate) navigator.vibrate(20);
    await removeLastWaterLog();
  }, [removeLastWaterLog]);

  const handleEditTarget = useCallback(() => {
    const input = prompt("הזן יעד מים חדש (במ״ל), או השאר ריק כדי לחזור להמלצה המותאמת אישית:", dailyWaterTarget.toString());
    if (input === null) return;
    
    if (input.trim() === "") {
      setCustomWaterTarget(null);
      toast.success("היעד הוחזר לחישוב אוטומטי");
      return;
    }

    const value = parseInt(input, 10);
    if (isNaN(value) || value <= 0) {
      toast.error("יש להזין מספר חיובי");
      return;
    }
    setCustomWaterTarget(value);
    toast.success(`היעד עודכן ל-${value} מ״ל`);
  }, [dailyWaterTarget, setCustomWaterTarget]);

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="relative w-full" dir="rtl">
      <div className="relative rounded-[2.5rem] border border-white/60 bg-white/30 backdrop-blur-xl shadow-soft-2xl">
        {/* ═══ Header — always visible, tap to toggle ═══ */}
        <motion.div
          className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
          onClick={() => setIsExpanded((v) => !v)}
          whileTap={{ scale: 0.98 }}
        >
          {/* Left: icon + title + optional progress text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-black tracking-tight text-slate-950 leading-tight">
                מעקב שתייה
              </h3>
              <AnimatePresence mode="wait">
                {!isExpanded && (
                  <motion.span
                    key="sub"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[13px] font-bold text-slate-500 block"
                  >
                    {dailyWaterAmount.toLocaleString()} /{" "}
                    {dailyWaterTarget.toLocaleString()} מ״ל
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: badge + chevron */}
          <div className="flex items-center gap-2.5 shrink-0">
            <AnimatePresence mode="wait">
              {!isExpanded && (
                <motion.div
                  key="badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className={`px-2.5 py-0.5 rounded-full text-[13px] font-black ${
                    isComplete
                      ? "bg-emerald-500/90 text-white"
                      : "bg-sky-100/80 text-sky-700"
                  }`}
                >
                  {isComplete ? "הושלם ✓" : `${percentage}%`}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ Collapsed progress bar ═══ */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              key="bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-5 pb-4 -mt-1"
            >
              <div className="h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: isComplete
                      ? "linear-gradient(90deg, #34d399, #10b981)"
                      : "linear-gradient(90deg, #7dd3fc, #0ea5e9, #0284c7)",
                  }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Expanded body ═══ */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-5 pb-6">
                {/* Target edit row */}
                <div className="flex items-center justify-end mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTarget();
                    }}
                    className="group flex items-center gap-1.5 transition-colors"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-slate-500">
                        יעד יומי
                      </div>
                      <div className="text-[15px] font-black text-slate-800">
                        {(dailyWaterTarget / 1000).toFixed(1)} ליטר
                      </div>
                    </div>
                    <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                  </button>
                </div>

                {/* ── SVG Carafe Bottle ── */}
                <div
                  className="relative mx-auto"
                  style={{ width: 180, height: 290 }}
                >
                  <svg
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    className="w-full h-full"
                    style={{
                      filter:
                        "drop-shadow(0 6px 20px rgba(14,165,233,0.18))",
                    }}
                  >
                    <defs>
                      <clipPath id={clipId}>
                        <path d={BOTTLE_PATH} />
                      </clipPath>
                      <linearGradient
                        id={depGrad}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                        <stop
                          offset="100%"
                          stopColor="rgba(30,58,138,0.12)"
                        />
                      </linearGradient>
                      <linearGradient
                        id={shiGrad}
                        x1="0.15"
                        y1="0"
                        x2="0.85"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="rgba(255,255,255,0)"
                        />
                        <stop
                          offset="30%"
                          stopColor="rgba(255,255,255,0.14)"
                        />
                        <stop
                          offset="50%"
                          stopColor="rgba(255,255,255,0.14)"
                        />
                        <stop
                          offset="100%"
                          stopColor="rgba(255,255,255,0)"
                        />
                      </linearGradient>
                    </defs>

                    {/* Empty bottle background */}
                    <path
                      d={BOTTLE_PATH}
                      fill="rgba(241,245,249,0.5)"
                      stroke="rgba(148,163,184,0.15)"
                      strokeWidth="1"
                    />

                    {/* Liquid fill — clipped to bottle silhouette */}
                    <g clipPath={`url(#${clipId})`}>
                      <motion.g style={{ y: liquidY }}>
                        {/* Solid fill */}
                        <rect
                          x="0"
                          y="0"
                          width={VB_W}
                          height={VB_H}
                          fill={fillColor}
                        />
                        {/* Wave surface */}
                        <motion.path
                          d={wavePath}
                          style={{ fill: fillColor, y: -6 }}
                          animate={{ x: [0, -VB_W] }}
                          transition={{
                            repeat: Infinity,
                            duration: 4,
                            ease: "linear",
                          }}
                        />
                      </motion.g>

                      {/* Depth gradient overlay */}
                      <rect
                        x="0"
                        y="0"
                        width={VB_W}
                        height={VB_H}
                        fill={`url(#${depGrad})`}
                      />
                    </g>

                    {/* Glass-like shine highlight */}
                    <path d={BOTTLE_PATH} fill={`url(#${shiGrad})`} />

                    {/* Crisp bottle outline */}
                    <path
                      d={BOTTLE_PATH}
                      fill="none"
                      stroke="rgba(255,255,255,0.45)"
                      strokeWidth="1.5"
                    />

                    {/* Bubbles — add & celebration */}
                    <g clipPath={`url(#${clipId})`}>
                      <AnimatePresence>
                        {addBubbles.map((b) => (
                          <SvgBubble key={b.id} delay={0} cx={b.x} />
                        ))}
                      </AnimatePresence>
                      <AnimatePresence>
                        {celebrationBubbles.map((i) => (
                          <motion.circle
                            key={`c-${i}`}
                            cx={20 + Math.random() * 120}
                            r={2 + Math.random() * 5}
                            fill="rgba(255,255,255,0.65)"
                            initial={{ cy: VB_H, opacity: 1 }}
                            animate={{
                              cy: VB_H - 140 - Math.random() * 100,
                              opacity: 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 1.5 + Math.random() * 1.5,
                              delay: i * 0.08,
                              ease: "easeOut",
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    </g>
                  </svg>

                  {/* Stats overlay — positioned over bottle body */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ paddingTop: 50 }}
                  >
                    <motion.span
                      className="font-black tracking-tight leading-none"
                      style={{
                        fontSize: "2rem",
                        color: progress > 0.5 ? "white" : "#0f172a",
                        textShadow:
                          progress > 0.5
                            ? "0 1px 10px rgba(0,0,0,0.25)"
                            : "0 1px 6px rgba(255,255,255,0.9)",
                      }}
                      key={dailyWaterAmount}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                    >
                      {dailyWaterAmount.toLocaleString()}
                    </motion.span>
                    <span
                      className="text-[13px] font-bold mt-1"
                      style={{
                        color:
                          progress > 0.5
                            ? "rgba(255,255,255,0.85)"
                            : "#64748b",
                        textShadow:
                          progress > 0.5
                            ? "0 1px 4px rgba(0,0,0,0.2)"
                            : "none",
                      }}
                    >
                      / {dailyWaterTarget.toLocaleString()} מ״ל
                    </span>

                    <motion.div
                      className={`mt-2 px-3 py-0.5 rounded-full text-[13px] font-black tracking-wide ${
                        isComplete
                          ? "bg-emerald-500/90 text-white"
                          : "bg-white/60 text-slate-700"
                      }`}
                      style={{
                        backdropFilter: isComplete ? "none" : "blur(8px)",
                        WebkitBackdropFilter: isComplete
                          ? "none"
                          : "blur(8px)",
                      }}
                      animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                      transition={
                        isComplete
                          ? { repeat: 2, duration: 0.4, ease: "easeInOut" }
                          : {}
                      }
                    >
                      {isComplete ? "הושלם! ✓" : `${percentage}%`}
                    </motion.div>
                  </div>
                </div>

                {/* ── Glass quick-add buttons ── */}
                <div className="flex flex-wrap gap-2.5 mt-8 justify-center">
                  {QUICK_ADD_OPTIONS.map(({ ml, label, icon: Icon }) => (
                    <motion.button
                      key={ml}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleAddWater(ml)}
                      className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 hover:bg-white/25 transition-all"
                    >
                      <Icon className="w-4 h-4 text-sky-500" strokeWidth={2.5} />
                      <span className="text-[14px] font-black">+{ml}</span>
                      <span className="text-[12px] font-bold text-slate-500">{label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* ── Undo last drink ── */}
                <AnimatePresence>
                  {dailyWaterAmount > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={handleUndo}
                      className="flex items-center justify-center gap-2 mt-3 mx-auto py-2 px-4 rounded-xl bg-white/40 backdrop-blur-sm border border-white/50 text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[13px] font-bold">
                        ביטול שתייה אחרונה
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
