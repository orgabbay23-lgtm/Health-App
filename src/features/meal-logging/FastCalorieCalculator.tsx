import { useState, useMemo } from "react";
import { Search, Calculator, Scale, Flame, X, WandSparkles, Loader2, ArrowRight } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { fastCalorieDatabase, FastCalorieItem } from "../../data/fast-calorie-database";
import { fetchFastCalorieFromAI } from "../../utils/gemini";
import { toast } from "sonner";
import { cn } from "../../utils/utils";

export function FastCalorieCalculator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<FastCalorieItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [useCommonUnit, setUseCommonUnit] = useState<boolean>(true);

  // AI Fallback States
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Smart, flexible multi-word scoring engine for local DB
  const searchResults = useMemo(() => {
    const cleanedTerm = searchTerm.trim().toLowerCase();
    if (!cleanedTerm) return [];
    
    const queryWords = cleanedTerm.split(/\s+/).filter(Boolean);
    
    const scoredItems = fastCalorieDatabase.map(item => {
      let totalScore = 0;
      let matchedWordsCount = 0;
      const itemName = item.name.toLowerCase();
      const itemWords = itemName.split(/\s+/);
      
      for (const qWord of queryWords) {
        let wordScore = 0;
        const withoutVav = qWord.startsWith('ו') ? qWord.substring(1) : qWord;
        
        for (const variant of [qWord, withoutVav]) {
          if (!variant) continue;
          let currentScore = 0;
          if (itemName === variant) currentScore = 100;
          else if (itemName.startsWith(variant)) currentScore = 50;
          else if (itemWords.includes(variant)) currentScore = 30;
          else if (itemWords.some(w => w.startsWith(variant))) currentScore = 20;
          else if (itemName.includes(variant)) currentScore = 5;
          
          if (currentScore > wordScore) wordScore = currentScore;
        }
        if (wordScore > 0) {
          totalScore += wordScore;
          matchedWordsCount++;
        }
      }
      
      if (matchedWordsCount === queryWords.length && queryWords.length > 0) {
        totalScore += 1000;
      }
      return { item, score: totalScore };
    });

    return scoredItems
      .filter(scored => scored.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(scored => scored.item)
      .slice(0, 8);
  }, [searchTerm]);

  const handleSelect = (item: FastCalorieItem) => {
    setSelectedItem(item);
    setSearchTerm("");
    setIsAiMode(false);
    setAiQuery("");
    setUseCommonUnit(!!item.commonUnit);
    setQuantity(item.commonUnit ? 1 : 100);
  };

  const clearSelection = () => {
    setSelectedItem(null);
    setSearchTerm("");
    setIsAiMode(false);
  };

  const handleAiSubmit = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const aiResult = await fetchFastCalorieFromAI(aiQuery);
      handleSelect(aiResult);
    } catch (error) {
      toast.error("לא הצלחנו לפענח את המאכל, נסה לנסח אחרת.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Real-time calculation
  const totalCalories = useMemo(() => {
    if (!selectedItem) return 0;
    let weightInGrams = quantity;
    if (useCommonUnit && selectedItem.commonUnit) {
      weightInGrams = quantity * selectedItem.commonUnit.weightInGrams;
    }
    return Math.round((weightInGrams / 100) * selectedItem.caloriesPer100g);
  }, [selectedItem, quantity, useCommonUnit]);

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300" dir="rtl">
      {!selectedItem ? (
        <div className="space-y-4">
          {!isAiMode ? (
            <>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder='חפש במאגר... (למשל: "במבה", "אורז")'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 h-12 text-base shadow-sm border-slate-200 rounded-xl"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-xl shadow-md overflow-hidden flex flex-col">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item)}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors text-right"
                    >
                      <div>
                        <span className="font-medium text-slate-800 block">{item.name}</span>
                        <span className="text-xs text-slate-500">
                          {item.caloriesPer100g} קק"ל ל-100 גרם
                        </span>
                      </div>
                      <Calculator className="w-4 h-4 text-blue-400 opacity-50" />
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-2 text-center">
                <button 
                  onClick={() => setIsAiMode(true)} 
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors py-2 px-4 bg-indigo-50 hover:bg-indigo-100 rounded-full"
                >
                  <WandSparkles className="w-4 h-4" />
                  לא מצאת במאגר? שאל את ה-AI
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-1 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-5 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <WandSparkles className="w-5 h-5" />
                  <h3 className="font-bold">חיפוש חכם ב-AI</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  הקלד כל מאכל שתרצה וה-AI ימצא את הערכים שלו מיד.
                  <br/>
                  <span className="font-medium text-slate-700">לדוגמה: "כף ממרח נוטלה" או "100 גרם אורז לבן מבושל"</span>
                </p>
                
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder="מה תרצה לחשב?"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
                    disabled={isAiLoading}
                    className="flex-1 border-indigo-100 focus-visible:ring-indigo-500"
                  />
                  <Button 
                    onClick={handleAiSubmit} 
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 w-12 shrink-0 p-0"
                  >
                    {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  </Button>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setIsAiMode(false)} className="w-full text-slate-400 hover:text-slate-600 h-8 text-xs">
                  חזור לחיפוש רגיל
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{selectedItem.name}</h3>
              <p className="text-sm text-slate-500">{selectedItem.caloriesPer100g} קק"ל ל-100 גרם</p>
            </div>
            <Button variant="ghost" size="icon" onClick={clearSelection} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">כמות</label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="h-11 text-lg font-medium text-center rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">מידה</label>
              <div className="flex bg-slate-100 p-1 rounded-xl h-11 relative">
                <button
                  onClick={() => setUseCommonUnit(false)}
                  className={cn(
                    "flex-1 flex items-center justify-center text-sm font-medium rounded-lg transition-all z-10",
                    !useCommonUnit ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Scale className="w-4 h-4 ml-1" /> גרם
                </button>
                {selectedItem.commonUnit && (
                  <button
                    onClick={() => setUseCommonUnit(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center text-sm font-medium rounded-lg transition-all z-10",
                      useCommonUnit ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {selectedItem.commonUnit.name}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 flex flex-col items-center justify-center border border-blue-100/50">
            <span className="text-sm font-medium text-blue-600/80 mb-1 flex items-center gap-1">
              <Flame className="w-4 h-4" /> סך הכל קלוריות
            </span>
            <div className="text-4xl font-black text-blue-700 tracking-tight">
              {totalCalories}
            </div>
            <span className="text-xs text-blue-500 mt-2 font-medium">
              עבור {quantity} {useCommonUnit && selectedItem.commonUnit ? selectedItem.commonUnit.name : 'גרם'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
