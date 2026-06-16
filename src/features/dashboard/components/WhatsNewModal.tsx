import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Palette, Smartphone, Wand2, X } from "lucide-react";

/* One-time, time-limited redesign announcement.
   - Shows once per device (localStorage flag).
   - Auto-expires after the campaign window so new users never see a stale promo. */
const SEEN_KEY = "has_seen_redesign_2026_06";
const EXPIRATION_DATE = new Date("2026-07-17T23:59:59").getTime();

const FEATURES = [
  {
    icon: Palette,
    title: "עיצוב חדש לגמרי",
    desc: "מראה נקי, מלוטש ומודרני מקצה לקצה",
    tint: "from-sky-400 to-indigo-500",
    glow: "shadow-sky-200/60",
  },
  {
    icon: Smartphone,
    title: "מושלם במובייל",
    desc: "חוויה חלקה, מהירה ונעימה יותר בנייד",
    tint: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-200/60",
  },
  {
    icon: Wand2,
    title: "פרטים קטנים, הבדל גדול",
    desc: "אנימציות עדינות ותחושת פרימיום בכל מסך",
    tint: "from-rose-400 to-fuchsia-500",
    glow: "shadow-rose-200/60",
  },
] as const;

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Pre-computed positions for the floating sparkle particles.
  const sparkles = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        left: 6 + Math.random() * 88,
        top: 4 + Math.random() * 42,
        size: 8 + Math.random() * 12,
        delay: Math.random() * 2.2,
        duration: 2.4 + Math.random() * 1.8,
      })),
    [],
  );

  useEffect(() => {
    if (Date.now() > EXPIRATION_DATE) return;
    if (localStorage.getItem(SEEN_KEY)) return;

    const timeout = setTimeout(() => {
      // Hold back the weight reminder for 24h so this welcome shows alone.
      try {
        localStorage.setItem("weight_reminder_last", Date.now().toString());
      } catch {
        /* ignore */
      }
      setIsOpen(true);
    }, 1300);
    return () => clearTimeout(timeout);
  }, []);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const canvas = document.querySelector(".ios-scroll-canvas") as HTMLElement | null;
    if (canvas) canvas.style.overflow = "hidden";
    return () => {
      const current = document.querySelector(".ios-scroll-canvas") as HTMLElement | null;
      if (current) current.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      /* ignore storage failures (private mode) */
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-5"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="עדכון עיצוב חדש"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="specular relative z-10 w-full max-w-[380px] overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/85 backdrop-blur-2xl shadow-premium-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Internal aurora glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-70">
              <div className="absolute -top-1/4 right-[-15%] h-[60%] w-[60%] rounded-full bg-indigo-200/50 blur-[70px]" />
              <div className="absolute bottom-[-20%] left-[-15%] h-[55%] w-[55%] rounded-full bg-sky-200/50 blur-[70px]" />
              <div className="absolute top-[20%] left-[20%] h-[40%] w-[40%] rounded-full bg-emerald-100/50 blur-[70px]" />
            </div>

            {/* Floating sparkles in the header zone */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden">
              {sparkles.map((s) => (
                <motion.div
                  key={s.id}
                  className="absolute"
                  style={{ left: `${s.left}%`, top: `${s.top}%` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 90, 180] }}
                  transition={{
                    duration: s.duration,
                    delay: s.delay,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles
                    style={{ width: s.size, height: s.size }}
                    className="text-amber-300 drop-shadow"
                    fill="currentColor"
                  />
                </motion.div>
              ))}
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="סגירה"
              className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/70 text-slate-400 backdrop-blur-md transition-colors hover:text-slate-700 active:scale-90"
            >
              <X size={18} />
            </button>

            <div className="relative flex flex-col items-center px-6 pb-7 pt-9 text-center">
              {/* Badge chip */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-indigo-600 shadow-sm backdrop-blur-md"
              >
                <Sparkles size={12} fill="currentColor" />
                מהדורה חדשה · יוני 2026
              </motion.div>

              {/* Icon badge */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 220, delay: 0.05 }}
                className="shine animate-float mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border-[5px] border-white bg-gradient-to-br from-slate-800 via-slate-950 to-indigo-950 text-white shadow-[0_18px_40px_-10px_rgba(30,27,75,0.6)]"
              >
                <Sparkles size={34} className="drop-shadow" />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-aurora mb-2 text-3xl font-black tracking-tight"
              >
                התחדשנו! ✨
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 px-2 text-[15px] font-medium leading-relaxed text-slate-500"
              >
                האפליקציה קיבלה מראה חדש לגמרי — רענן, מודרני ומלוטש. הנה מה שהשתנה:
              </motion.p>

              {/* Feature list */}
              <div className="mb-7 w-full space-y-2.5">
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.08, type: "spring", damping: 22, stiffness: 260 }}
                      className="flex items-center gap-3.5 rounded-2xl border border-white/70 bg-white/60 p-3 text-right backdrop-blur-md"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${f.tint} ${f.glow}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-black leading-tight text-slate-900">
                          {f.title}
                        </div>
                        <div className="text-[12.5px] font-medium leading-snug text-slate-500">
                          {f.desc}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                className="shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-950 to-indigo-950 py-4 text-[15px] font-black text-white shadow-[0_16px_36px_-10px_rgba(30,27,75,0.55)] transition-[filter] hover:brightness-110"
              >
                <Sparkles size={18} />
                יאללה, מתחילים!
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
