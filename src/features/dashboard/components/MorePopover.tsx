import { motion, AnimatePresence } from "framer-motion";
import { UserRound, LineChart, X } from "lucide-react";
import type { DashboardScreen } from "../types";
import { useEffect, useRef } from "react";

interface MorePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: DashboardScreen) => void;
}

export function MorePopover({ isOpen, onClose, onNavigate }: MorePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Transparent backdrop to catch clicks if needed, or rely on useEffect */}
          <div className="absolute inset-0 pointer-events-auto bg-black/5 backdrop-blur-[2px]" onClick={onClose} />
          
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.8, y: 20, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ transformOrigin: "bottom left" }}
            className="absolute bottom-24 left-6 w-64 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/50 p-3 pointer-events-auto overflow-hidden"
          >
            <div className="flex flex-col gap-1" dir="rtl">
              <button
                onClick={() => {
                  onNavigate("profile");
                  onClose();
                }}
                className="flex items-center gap-3 p-4 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-colors text-right w-full group"
              >
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
                  <UserRound size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">פרופיל</div>
                  <div className="text-[10px] text-slate-500">עריכת פרטים ויעדים</div>
                </div>
              </button>

              <div className="h-px bg-slate-100 mx-2" />

              <button
                onClick={() => {
                  onNavigate("weight");
                  onClose();
                }}
                className="flex items-center gap-3 p-4 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-colors text-right w-full group"
              >
                <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
                  <LineChart size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">מעקב משקל</div>
                  <div className="text-[10px] text-slate-500">גרף והיסטוריית מדידות</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
