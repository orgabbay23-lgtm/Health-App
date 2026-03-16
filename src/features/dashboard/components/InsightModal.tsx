import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { useAppStore } from "../../../store";
import { answerInsightFollowUp } from "../../../utils/gemini";

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  insightKey: string;
  userProfile: Record<string, unknown>;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/(?<!\S)\*(?!\s)/g, "")
    .replace(/(?<!\s)\*(?!\S)/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function InsightModal({ isOpen, onClose, insightKey, userProfile }: InsightModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

  const record = useAppStore((s) => s.aiInsights[insightKey]);
  const saveInsightFollowUp = useAppStore((s) => s.saveInsightFollowUp);

  const insightText = record?.insight ?? "";
  const followUpQuestion = record?.followUpQuestion;
  const followUpAnswer = record?.followUpAnswer;

  useEffect(() => {
    if (!isOpen) return undefined;

    const scrollCanvas = document.querySelector('.ios-scroll-canvas') as HTMLElement | null;
    if (scrollCanvas) {
      scrollCanvas.style.overflow = 'hidden';
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scrollCanvas) {
        scrollCanvas.style.overflow = '';
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (followUpAnswer && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [followUpAnswer]);

  const handleAskFollowUp = async () => {
    const trimmed = question.trim();
    if (!trimmed || isAskingFollowUp) return;

    setIsAskingFollowUp(true);
    try {
      const answer = await answerInsightFollowUp(insightText, trimmed, userProfile);
      saveInsightFollowUp(insightKey, trimmed, answer);
      setQuestion("");
    } catch (error: any) {
      if (error.message === "API_KEY_INVALID" || error.message === "MISSING_API_KEY") {
        toast.error("מפתח API חסר או לא תקין.");
      } else {
        toast.error(error.message || "שגיאה בתשובה לשאלה");
      }
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskFollowUp();
    }
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center overflow-hidden"
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: "100%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 320,
              mass: 0.8,
            }}
            className="relative w-full bg-white/80 backdrop-blur-2xl text-right shadow-soft-2xl border border-white/60 mt-auto max-h-[92vh] rounded-t-[3rem] rounded-b-none pb-safe md:mt-0 md:max-h-[90vh] md:max-w-2xl md:rounded-[3rem] md:mb-8 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mesh gradient background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden -z-10 rounded-t-[3rem] md:rounded-[3rem]">
              <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-violet-100 blur-[80px]" />
              <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-amber-100 blur-[80px]" />
            </div>

            {/* Drag indicator (mobile) */}
            <div className="w-full flex justify-center pt-4 pb-2 md:hidden">
              <div className="h-1.5 w-16 rounded-full bg-slate-200/80" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-8 py-6 md:py-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-50 p-2.5 text-violet-600">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  המלצה אישית
                </h2>
              </div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 h-11 w-11 border border-slate-100"
                  onClick={onClose}
                  aria-label="סגור חלון"
                >
                  <X size={20} />
                </Button>
              </motion.div>
            </div>

            {/* Scrollable content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-8 min-h-0"
            >
              {/* Main insight */}
              <div className="text-right text-base leading-relaxed whitespace-pre-wrap text-slate-700">
                {stripMarkdown(insightText)}
              </div>

              {/* Follow-up Q&A section */}
              <AnimatePresence>
                {followUpQuestion && followUpAnswer ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="mt-6 space-y-3"
                  >
                    {/* Divider */}
                    <div className="border-t border-slate-200/60" />

                    {/* User question bubble */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-violet-100/70 backdrop-blur-sm border border-violet-200/40 px-4 py-3">
                        <p className="text-base leading-relaxed text-violet-900 font-medium">{followUpQuestion}</p>
                      </div>
                    </div>

                    {/* AI answer bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-white/70 backdrop-blur-sm border border-white/50 shadow-soft-sm px-4 py-3">
                        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {stripMarkdown(followUpAnswer)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Follow-up input area */}
            <div className="shrink-0 px-8 pb-8 pt-4">
              {!followUpAnswer ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      disabled={isAskingFollowUp}
                      placeholder="יש לך שאלה על ההמלצה?"
                      className="w-full rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-sm px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300/50 focus:border-violet-300 disabled:opacity-50 text-right"
                      dir="rtl"
                    />
                    {isAskingFollowUp ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-sm">
                        <Loader2 size={18} className="text-violet-500 animate-spin" />
                      </div>
                    ) : null}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAskFollowUp}
                    disabled={!question.trim() || isAskingFollowUp}
                    className="flex items-center justify-center rounded-xl bg-violet-600 p-3 text-white shadow-soft-sm hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="שלח שאלה"
                  >
                    <Send size={16} className="rotate-180" />
                  </motion.button>
                </div>
              ) : (
                <p className="text-center text-[13px] text-slate-400">
                  ניתן לרענן את ההמלצה לשאלה חדשה
                </p>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
