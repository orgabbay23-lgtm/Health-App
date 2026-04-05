import { useState, useEffect } from "react";
import { ModalShell } from "../../components/ui/modal-shell";
import { Button } from "../../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, UtensilsCrossed, Pencil } from "lucide-react";
import { Input } from "../../components/ui/input";

interface ConfirmMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedText: string) => void;
  mealText: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  show: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 14,
      mass: 1,
      delay: 0.3 + (i * 0.12)
    }
  }),
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

export function ConfirmMealModal({ isOpen, onClose, onConfirm, mealText }: ConfirmMealModalProps) {
  const parseMealToItems = (text: string) => {
    if (!text) return [];
    // Split by "עם", "בתוספת", "פלוס", "+", ",", "\n", and "ו" as conjunction
    const regex = /(?:\s+עם\s+)|(?:\s+בתוספת\s+)|(?:\s+פלוס\s+)|(?:\s*\+\s*)|(?:,\s*(?:ו(?=[\u0590-\u05FFa-zA-Z0-9]))?)|(?:\n\s*(?:ו(?=[\u0590-\u05FFa-zA-Z0-9]))?)|(?:\s+ו(?=[\u0590-\u05FFa-zA-Z0-9]))/g;
    return text.split(regex)
      .filter(item => item !== undefined)
      .map(item => item.trim().replace(/^[-*•]+\s*/, ''))
      .filter(item => item.length > 0);
  };

  const [items, setItems] = useState<string[]>(() => parseMealToItems(mealText));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [canInteract, setCanInteract] = useState(false);

  // Sync state if mealText changes while open (though usually it mounts fresh)
  useEffect(() => {
    if (isOpen) {
      setItems(parseMealToItems(mealText));
      setEditingIndex(null);
      setCanInteract(false);
      const timer = setTimeout(() => setCanInteract(true), 400); // Prevent ghost clicks on mobile
      return () => clearTimeout(timer);
    }
  }, [isOpen, mealText]);

  const handleEditClick = (index: number, currentText: string) => {
    if (!canInteract) return;
    setEditingIndex(index);
    setEditValue(currentText);
  };

  const handleSaveEdit = (index: number) => {
    const newItems = [...items];
    if (editValue.trim() === "") {
      // If empty, remove the item
      newItems.splice(index, 1);
    } else {
      newItems[index] = editValue.trim();
    }
    setItems(newItems);
    setEditingIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="סיכום ארוחה">
      <div className="space-y-5 sm:space-y-6 mt-1 flex flex-col pb-4">
        
        {/* Magical Header Area */}
        <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-right space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse mb-2 sm:mb-6 shrink-0">
           <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.1 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100 flex items-center justify-center shadow-inner relative shrink-0 will-change-transform"
           >
              <motion.div
                 animate={{ y: [0, -4, 0] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="will-change-transform"
              >
                <UtensilsCrossed className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 drop-shadow-sm" />
              </motion.div>
              
              {/* Sparkles around */}
              <motion.div 
                initial={{ opacity: 0, scale: 0, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                className="absolute -top-1 -right-1 text-yellow-400 will-change-transform"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0, rotate: 45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.7, duration: 0.8, type: "spring" }}
                className="absolute -bottom-1 -left-1 text-blue-400 will-change-transform"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
           </motion.div>
           
           <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col will-change-transform"
           >
              <span className="text-slate-600 font-black text-[16px] sm:text-[18px] leading-tight">
                זיהינו את המרכיבים הבאים. הכל נכון?
              </span>
              <span className="text-[12px] sm:text-sm font-bold text-slate-400 mt-0.5">
                (ניתן ללחוץ על כל מרכיב כדי לערוך אותו)
              </span>
           </motion.div>
        </div>

        <div className="px-1 sm:px-2">
          <ul className="space-y-3">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.li 
                  key={`${index}-${item}`}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  whileHover={editingIndex === index ? {} : { scale: 1.02, x: -4 }}
                  whileTap={editingIndex === index ? {} : { scale: 0.96 }}
                  onClick={() => {
                    if (editingIndex !== index) {
                      handleEditClick(index, item);
                    }
                  }}
                  className={`group relative flex items-center gap-3 sm:gap-4 text-slate-700 font-black text-base sm:text-lg bg-white p-4 rounded-2xl border ${editingIndex === index ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-slate-200/80 shadow-sm'} ${editingIndex === index ? '' : 'cursor-pointer'} shrink-0 will-change-transform`}
                  style={{ WebkitTransform: "translateZ(0)" }}
                >
                  {/* Check icon circle */}
                  <div className={`flex-shrink-0 relative z-10 transition-transform duration-200 ${editingIndex === index ? 'scale-90 opacity-50' : ''}`}>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 md:group-hover:bg-blue-500 transition-colors duration-300 flex items-center justify-center">
                      {editingIndex === index ? (
                         <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 transition-colors duration-300" strokeWidth={2.5} />
                      ) : (
                         <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 md:group-hover:text-white transition-colors duration-300" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  
                  {editingIndex === index ? (
                    <div className="flex-1 flex gap-2 w-full relative z-20" onClick={e => e.stopPropagation()}>
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onBlur={() => handleSaveEdit(index)}
                        className="h-10 sm:h-12 text-lg sm:text-xl font-bold bg-white border-blue-200 focus-visible:ring-blue-500 px-3"
                        dir="rtl"
                      />
                    </div>
                  ) : (
                    <span className="relative z-10 leading-tight w-full truncate whitespace-normal break-words">{item}</span>
                  )}
                  
                  {/* Performance-friendly hover gradient */}
                  {editingIndex !== index && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 15 }}
          className="flex flex-row items-stretch sm:items-center gap-2 sm:gap-4 pt-4 sm:pt-6 mt-auto shrink-0 will-change-transform"
        >
          <Button
            type="button"
            className="relative overflow-hidden flex-[2] h-14 sm:h-20 text-[17px] sm:text-[22px] font-black rounded-2xl sm:rounded-[1.25rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 gap-1.5 sm:gap-3 transition-transform active:scale-95 border-0 px-2 sm:px-4"
            onClick={() => {
              if (editingIndex !== null) {
                handleSaveEdit(editingIndex);
              }
              const finalItems = editingIndex !== null ? items.map((it, idx) => idx === editingIndex ? editValue.trim() : it) : items;
              const joinedText = finalItems.filter(it => it.length > 0).join(" עם ");
              onConfirm(joinedText);
              onClose();
            }}
          >
            {/* Shimmer overlay */}
            <motion.div 
              className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              animate={{ translateX: ['-150%', '250%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 1.5 }}
            />
            <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 animate-pulse relative z-10" />
            <span className="relative z-10 leading-tight">אשר והוסף לארוחות</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-[1] h-14 sm:h-14 text-[15px] sm:text-[17px] font-bold rounded-2xl border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-transform active:scale-95 will-change-transform px-2 sm:px-4 leading-tight"
            onClick={onClose}
          >
            חזור לתיקונים
          </Button>
        </motion.div>
      </div>
    </ModalShell>
  );
}