import { useState, useEffect, useRef } from "react";
import { ModalShell } from "../../components/ui/modal-shell";
import { Button } from "../../components/ui/button";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Sparkles, Check, UtensilsCrossed, Pencil, Plus, Trash2, RotateCcw, 
  CupSoda, Pizza, Sandwich, Salad, Drumstick, Fish, Egg, 
  Coffee, Wine, Beer, Apple, Banana, Cherry, Carrot, CakeSlice, Cookie, 
  IceCreamBowl, Donut, Croissant, Popcorn, Soup, Candy, Milk, Beef,
  Bean, Wheat, Grape, Citrus, Leaf, Ham, GlassWater
} from "lucide-react";
import { Input } from "../../components/ui/input";

interface ConfirmMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedText: string) => void;
  mealText: string;
}

const getFoodIcon = (text: string) => {
  const lowerText = text.toLowerCase();
  
  // Robust Hebrew word matching:
  // - Handles prefixes (ו,ה,ב,ל,מ,ש,כ)
  // - Ensures word boundaries to avoid sub-word matches (like 'תה' in 'חביתה')
  const match = (keywords: string[]) => {
    const pattern = new RegExp(`(?<![א-ת])(?:[ובהלמשכ]?)(?:${keywords.join('|')})(?![א-ת])`, 'g');
    return pattern.test(lowerText);
  };

  // 1. DRINKS (Categorized by type)
  if (match(['קפה', 'אספרסו', 'לאטה', 'הפוך', 'בוץ', 'מקיאטו', 'קפוצ׳ינו', 'נס', 'תה', 'חליטה', 'צ׳אי'])) return Coffee;
  if (match(['מים', 'סודה'])) return GlassWater;
  if (match(['יין', 'וודקה', 'ערק', 'וויסקי', 'ג׳ין', 'רום', 'טקילה', 'אלכוהול', 'קוקטייל', 'צ׳ייסר'])) return Wine;
  if (match(['בירה', 'לאגר', 'אייל', 'היינקן', 'קורונה', 'קרלסברג', 'גולדסטאר', 'מכבי'])) return Beer;
  if (match(['קולה', 'זירו', 'פנטה', 'ספרייט', 'פיוזטי', 'משקה', 'שוקו', 'אייס', 'שייק', 'מיץ', 'ענבים', 'תפוזים', 'לימונדה', 'נקטר', 'בקבוק', 'פחית', 'כוס'])) return CupSoda;
  
  // 2. PROTEINS (Meat, Poultry, Fish, Eggs)
  if (match(['ביצה', 'חביתה', 'עין', 'מקושקשת', 'שקשוקה', 'אומלט', 'ביצים', 'ביצה קשה'])) return Egg;
  if (match(['המבורגר', 'בורגר', 'קציצה', 'קציצות', 'קבב', 'בשר', 'סטייק', 'אנטריקוט', 'צלעות', 'סינטה', 'פילה', 'כבד', 'לבבות', 'מעורב', 'טחון', 'צלי', 'קרפצ׳יו'])) return Beef;
  if (match(['חזיר', 'בייקון', 'לבן', 'שינקן', 'האם', 'לרד'])) return Ham;
  if (match(['עוף', 'שניצל', 'כנפיים', 'פרגית', 'חזה עוף', 'כרעיים', 'פולקע', 'הודו', 'נאגטס', 'חזה הודו', 'פסטרמה', 'נקניק', 'נקניקיה', 'נקניקייה'])) return Drumstick;
  if (match(['דג', 'סלמון', 'טונה', 'אמנון', 'מושט', 'לברק', 'דניס', 'מוסר', 'סושי', 'סשימי', 'חריימה', 'גפילטע', 'סרדינים', 'אנשובי'])) return Fish;
  
  // 3. CARBS, GRAINS & LEGUMES
  if (match(['פיצה', 'משולש', 'פוקאצ׳ה'])) return Pizza;
  if (match(['כריך', 'סנדוויץ', 'באגט', 'פיתה', 'לאפה', 'טורטיה', 'טוסט', 'בייגל', 'לחמניה', 'לחם', 'פרוסה', 'חלה', 'בייגלה', 'קרקר', 'פתית', 'פריכית', 'לחמית'])) return Sandwich;
  if (match(['אורז', 'פתיתים', 'בורגול', 'קינואה', 'כוסמת', 'קוסקוס', 'חומוס', 'פלאפל', 'עדשים', 'שעועית', 'פול', 'גרגירים', 'טחינה', 'מג׳דרה', 'נזיד', 'מרק'])) return Bean;
  if (match(['שיבולת שועל', 'קורנפלקס', 'דגנים', 'גרנולה', 'דייסה', 'קוואקר', 'ברנפלקס'])) return Wheat;
  if (match(['פסטה', 'ספגטי', 'מקרוני', 'לזניה', 'רביולי', 'ניוקי', 'טורטליני', 'פנה', 'פטוצ׳יני'])) return UtensilsCrossed;
  
  // 4. DAIRY
  if (match(['גבינה', 'קוטג׳', 'קוטג', 'יוגורט', 'חלב', 'שמנת', 'חמאה', 'מעדן', 'לאבנה', 'פודינג', 'ריקוטה', 'מוצרלה', 'צהובה', 'לבנה', 'צפתית', 'בולגרית'])) return Milk;
  
  // 5. VEGETABLES
  if (match(['סלט', 'חסה', 'כרוב', 'פטרוזיליה', 'כוסברה', 'תרד', 'שמיר', 'נענע', 'עלי', 'רוקט', 'בזיליקום', 'אורגנו'])) return Leaf;
  if (match(['גזר', 'בטטה', 'תפוח אדמה', 'תפו"א', 'פירה', 'צ׳יפס', 'שורש', 'צנונית', 'לפת'])) return Carrot;
  if (match(['עגבניה', 'מלפפון', 'פלפל', 'גמבה', 'בצל', 'שום', 'תירס', 'אפונה', 'קישוא', 'חציל', 'פטריות', 'דלעת', 'ברוקולי', 'כרובית', 'חצילים', 'קישואים'])) return Salad;
  
  // 6. FRUITS
  if (match(['תפוז', 'קלמנטינה', 'לימון', 'אשכולית', 'פומלה', 'ליים', 'הדרים'])) return Citrus;
  if (match(['ענבים', 'צימוקים'])) return Grape;
  if (match(['בננה'])) return Banana;
  if (match(['דובדבן', 'תות', 'פטל', 'אוכמניות', 'פירות יער', 'חמוציות'])) return Cherry;
  if (match(['תפוח', 'פרי', 'פירות', 'אבטיח', 'מלון', 'אפרסק', 'משמש', 'אגס', 'מנגו', 'שזיף', 'תמר', 'אפרסמון', 'רימון', 'תאנה', 'אבוקדו', 'קיווי', 'אננס'])) return Apple;
  
  // 7. SWEETS, BAKERY & SNACKS
  if (match(['עוגה', 'פאי', 'טארט', 'מוס', 'עוגת'])) return CakeSlice;
  if (match(['עוגיה', 'עוגייה', 'ביסקוויט', 'וופל', 'נשיקות', 'מקרון'])) return Cookie;
  if (match(['גלידה', 'ארטיק', 'שלגון', 'סורבה', 'פרוזן', 'יוגורטיה'])) return IceCreamBowl;
  if (match(['דונאט', 'סופגניה', 'סופגנייה', 'ברלינר'])) return Donut;
  if (match(['קרואסון', 'בורקס', 'מאפה', 'פחזנית', 'רוגלך', 'ג׳חנון', 'מלוואח', 'זיווה', 'שניצלונים'])) return Croissant;
  if (match(['פופקורן', 'חטיף', 'במבה', 'ביסלי', 'דוריטוס', 'תפוצ׳יפס', 'פרינגלס', 'צ׳יטוס'])) return Popcorn;
  if (match(['ממתק', 'סוכריה', 'סוכרייה', 'שוקולד', 'קינוח', 'ריבה', 'דבש', 'סילאן', 'חלווה', 'נוטלה', 'מרשמלו', 'גומי'])) return Candy;
  
  // 8. OTHERS
  if (match(['מרק', 'חמין', 'נזיד', 'ציר'])) return Soup;

  return Check; // Default fallback
};

const itemVariants: Variants = {
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

const highlightFoodQuantities = (text: string) => {
  if (!text) return text;
  
  const words = [
    'אחת', 'אחד', 'שתי', 'שני', 'שלוש', 'שלושה', 'ארבע', 'ארבעה', 'חמש', 'חמישה', 'שש', 'שישה', 'שבע', 'שבעה', 'שמונה', 'תשע', 'תשעה', 'עשר', 'עשרה', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'מאה', 'מאות',
    'גרם', 'גרמים', 'קילו', 'קילוגרם', 'ק"ג', 'קג', 'מ"ל', 'מל', 'ליטר', 'חצי', 'רבע', 'שליש', 'אחוז', 'כפות', 'כוסות', 'כפיות', 'כף', 'כוס', 'כפית', 'מנה', 'מנות', 'גביע', 'גביעים', 'חתיכה', 'חתיכות', 'פרוסה', 'פרוסות', 'יחידה', 'יחידות'
  ];
  
  const regexStr = `(\\d+(?:\\.\\d+)?|\\d+\\/\\d+|%|(?<=[\\s,.\\[\\]()+-]|^)(?:${words.join('|')})(?=[\\s,.\\[\\]()+-]|$))`;
  const regex = new RegExp(regexStr, 'g');
  
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} className="text-blue-600 font-black text-[1.1em]">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export function ConfirmMealModal({ isOpen, onClose, onConfirm, mealText }: ConfirmMealModalProps) {
  const parseMealToItems = (text: string) => {
    if (!text) return [];
    
    // 1. Normalize 'ועם' to 'עם'
    let normalizedText = text.replace(/(?:\s+ועם\s+)/g, ' עם ');
    
    // 2. Protect content inside parentheses
    const protectedPairs: string[] = [];
    normalizedText = normalizedText.replace(/\(([^)]+)\)/g, (match) => {
      protectedPairs.push(match);
      return `__PAREN_${protectedPairs.length - 1}__`;
    });
    
    // 3. Define regex patterns for identification
    const containers = /^(?:פיתה|לחמניה|באגט|לאפה|טורטיה|טוסט|כריך|סנדוויץ|סנדוויץ'|בייגל|פיתות|לחמניות|באגטים|לאפות|טורטיות|טוסטים|כריכים|בייגלים|פיצה|משולש|משולשי|המבורגר|פסטה|סלט|סלטים|מוקפץ)$/;
    const units = /^(?:כף|כפות|כפית|כפיות|גרם|קילו|ק"ג|מ"ל|חצי|רבע|שליש|פרוסה|פרוסות|קצת|מעט|טיפה|כוס|כוסות|בקבוק|פחית|קופסה|גביע|גביעים|מנה|מנות|חתיכה|חתיכות|שקית|שקיות)$/;
    const numbers = /^(?:אחת|אחד|שתי|שני|שניים|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה|שש|שישה|שבע|שבעה|שמונה|תשע|תשעה|עשר|עשרה|כמה|הרבה)$/;
    
    // 4. Basic split by strong separators (comma, plus, newline, etc.)
    const basicRegex = /(?:\s+בתוספת\s+)|(?:\s+פלוס\s+)|(?:\s*\+\s*)|(?:,)|(?:\n)/g;
    const intermediateParts = normalizedText.split(basicRegex).filter(item => item !== undefined);
    
    // 5. Conditional split for 'ו' (vav) conjunction
    const parts: string[] = [];
    for (const p of intermediateParts) {
      // Split by ' ו' (space + vav) 
      const vavParts = p.split(/(?:\s+ו(?=[\u0590-\u05FFa-zA-Z0-9]))/g);
      if (vavParts.length === 1) {
        parts.push(vavParts[0]);
        continue;
      }
      
      let current = vavParts[0];
      for (let i = 1; i < vavParts.length; i++) {
        const next = vavParts[i].trim();
        if (!next) continue;
        
        const nextWords = next.split(/\s+/);
        const firstNextWord = nextWords[0];
        
        // Expanded list of known food/drink words where 'ו' is part of the root.
        // We match the "remainder" of the word after the split (e.g., 'וניל' -> 'ניל').
        const isVavRootWord = /^(?:ניל|ודקה|דקה|יסקי|ויסקי|רמוט|ורמוט|סאבי|ואסבי|אסבי|פל|ופל|אפל|ופלים|אפלים|פלים|יניגרט|יטמינצ'יק|ינשטפן|יינשטפן|ונטון|ולינגטון|ינדלו|יסוצקי|ינה|ינר|וק|ול|ולדורף|ולדורך|ולנסיה|יטמין|יטלו|ינרשניצל|ולקאנו|פלס)$/.test(firstNextWord);
        
        if (!isVavRootWord) {
          parts.push(current);
          current = next;
        } else {
          // If it's a vav-root word (like vanilla/vodka), keep it together
          current += ' ו' + next;
        }
      }
      parts.push(current);
    }

    // 6. Final split logic for 'עם' (with)
    const finalItems: string[] = [];
    for (const part of parts) {
      if (!part) continue;
      
      const withParts = part.split(/(?:\s+עם\s+)/);
      if (withParts.length === 1) {
        finalItems.push(withParts[0]);
        continue;
      }
      
      let currentItem = withParts[0];
      for (let i = 1; i < withParts.length; i++) {
        const prev = currentItem.trim();
        const next = withParts[i].trim();
        
        const prevWords = prev.split(/\s+/);
        const lastPrevWord = prevWords[prevWords.length - 1];
        
        const nextWords = next.split(/\s+/);
        const firstNextWord = nextWords[0];
        
        const isContainer = containers.test(lastPrevWord);
        const isUnit = units.test(firstNextWord) || /^\d/.test(firstNextWord) || numbers.test(firstNextWord);
        
        // Don't split if it's a base dish (container) with a main filling, 
        // unless a clear unit/amount follows the 'עם'
        if (isContainer && !isUnit) {
          currentItem += ' עם ' + next;
        } else {
          finalItems.push(currentItem);
          currentItem = next;
        }
      }
      finalItems.push(currentItem);
    }
    
    return finalItems
      .map(item => {
        let restored = item.trim().replace(/^[-*•]+\s*/, '');
        // Restore parentheses
        protectedPairs.forEach((content, i) => {
          restored = restored.replace(`__PAREN_${i}__`, content);
        });
        return restored;
      })
      .filter(item => item.length > 0);
  };

  const [items, setItems] = useState<string[]>(() => parseMealToItems(mealText));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [canInteract, setCanInteract] = useState(false);
  
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [isButtonsVisible, setIsButtonsVisible] = useState(true);

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

  useEffect(() => {
    if (!isOpen) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsButtonsVisible(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "0px 0px 50px 0px" }
    );

    if (buttonsRef.current) {
      observer.observe(buttonsRef.current);
    }

    return () => observer.disconnect();
  }, [isOpen, items.length]);

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
const handleAddItem = () => {
  if (!canInteract) return;
  setItems([...items, ""]);
  setEditingIndex(items.length);
  setEditValue("");
};

const handleResetToOriginal = () => {
  if (!canInteract) return;
  setItems([mealText]);
  setEditingIndex(null);
};

const handleDeleteItem = (index: number) => {
  const newItems = [...items];
  newItems.splice(index, 1);
  setItems(newItems);
  if (editingIndex === index) {
    setEditingIndex(null);
  } else if (editingIndex !== null && editingIndex > index) {
    setEditingIndex(editingIndex - 1);
  }
};

const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  const handleConfirm = () => {
    if (editingIndex !== null) {
      handleSaveEdit(editingIndex);
    }
    const finalItems = editingIndex !== null ? items.map((it, idx) => idx === editingIndex ? editValue.trim() : it) : items;
    const joinedText = finalItems.filter(it => it.length > 0).join(" עם ");
    onConfirm(joinedText);
    onClose();
  };

  return (
    <>
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
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
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
                    {/* Check/Food icon circle */}
                    <div className={`flex-shrink-0 relative z-10 transition-transform duration-200 ${editingIndex === index ? 'scale-90 opacity-50' : ''}`}>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 lg:group-hover:bg-blue-500 transition-colors duration-300 flex items-center justify-center">
                        {editingIndex === index ? (
                           <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 transition-colors duration-300" strokeWidth={2.5} />
                        ) : (() => {
                           const FoodIcon = getFoodIcon(item);
                           return <FoodIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 lg:group-hover:text-white transition-colors duration-300" strokeWidth={3} />;
                        })()}
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
                      <span className="relative z-10 leading-relaxed w-full truncate whitespace-normal break-words">{highlightFoodQuantities(item)}</span>
                    )}
                    
                    {/* Performance-friendly hover gradient */}
                    {editingIndex !== index && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                    )}
                    
                    {/* Delete button */}
                    {editingIndex !== index && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(index);
                        }}
                        className="relative z-20 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100 sm:opacity-100"
                        aria-label="מחק מרכיב"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </motion.li>
                ))}

                {/* Action Buttons */}
                <motion.li
                  custom={items.length}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex items-center justify-center gap-2 pt-2 pb-1 flex-wrap"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleAddItem}
                    className="h-12 text-[16px] sm:text-[17px] text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 font-bold rounded-2xl gap-2 transition-all active:scale-95"
                  >
                    <Plus strokeWidth={3} className="w-5 h-5" />
                    הוספת מרכיב
                  </Button>

                  <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResetToOriginal}
                    className="h-10 text-[14px] sm:text-[15px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-bold rounded-xl gap-2 transition-all active:scale-95"
                  >
                    <RotateCcw strokeWidth={2.5} className="w-4 h-4" />
                    חזור למקור
                  </Button>
                </motion.li>
              </AnimatePresence>
            </ul>
          </div>

          <motion.div 
            ref={buttonsRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 15 }}
            className="flex flex-row items-stretch sm:items-center gap-2 sm:gap-4 pt-4 sm:pt-6 mt-auto shrink-0 will-change-transform"
          >
            <Button
              type="button"
              className="relative overflow-hidden flex-[2] h-14 sm:h-20 text-[17px] sm:text-[22px] font-black rounded-2xl sm:rounded-[1.25rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 gap-1.5 sm:gap-3 transition-transform active:scale-95 border-0 px-2 sm:px-4"
              onClick={handleConfirm}
            >
              {/* Shimmer overlay */}
              <motion.div 
                className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                animate={{ x: ['-150%', '250%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 1.5, delay: 1.5 }}
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

        {/* Floating Action Button for Mobile when scrolled out of view - INSIDE MODAL */}
        <AnimatePresence>
          {isOpen && !isButtonsVisible && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleConfirm}
              className="absolute bottom-6 left-6 z-[60] w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] flex items-center justify-center text-white"
            >
              <Check strokeWidth={3.5} className="w-6 h-6" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-white/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
              />
            </motion.button>
          )}
        </AnimatePresence>
      </ModalShell>
    </>
  );
}