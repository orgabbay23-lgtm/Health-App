import { motion } from "framer-motion";
import { Settings2, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../users/UserAvatar";
import type { UserAccentToken } from "../../../store";

interface DashboardTopBarProps {
  activeUser: {
    name: string;
    accent: UserAccentToken;
  };
  selectedDayKey: string;
  onOpenMealModal: () => void;
  onOpenProfileModal: () => void;
}

export function DashboardTopBar({
  activeUser,
  onOpenMealModal,
  onOpenProfileModal,
}: DashboardTopBarProps) {
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <UserAvatar name={activeUser.name} accent={activeUser.accent} size="md" className="ring-4 ring-white shadow-xl" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
        </motion.div>
        <div className="flex flex-col">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5"
          >
            בוקר טוב,
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-black text-slate-950 tracking-tight leading-none"
          >
            {activeUser.name}
          </motion.h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.div whileHover={{ rotate: 15 }}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-2xl bg-white/60 backdrop-blur-md border border-white shadow-soft-lg text-slate-400 hover:text-slate-950 transition-all"
            onClick={onOpenProfileModal}
          >
            <Settings2 size={22} />
          </Button>
        </motion.div>
        
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 rounded-2xl bg-slate-950 text-white shadow-2xl hover:bg-slate-900 active:scale-95 transition-all hidden md:flex"
          onClick={onOpenMealModal}
        >
          <Plus size={24} />
        </Button>
      </div>
    </header>
  );
}
