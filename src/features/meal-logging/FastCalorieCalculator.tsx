import { useState, useMemo } from "react";
import { Search, Calculator, Scale, Flame, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { fastCalorieDatabase, FastCalorieItem } from "../../data/fast-calorie-database";
import { cn } from "../../utils/utils";

export function FastCalorieCalculator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<FastCalorieItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [useCommonUnit, setUseCommonUnit] = useState<boolean>(true);

  // Filter top 8 results based on search
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerQuery = searchTerm.toLowerCase();
    return fastCalorieDatabase
      .filter((item) => item.name.toLowerCase().includes(lowerQuery))
      .slice(0, 8);
  }, [searchTerm]);

  const handleSelect = (item: FastCalorieItem) => {
    setSelectedItem(item);
    setSearchTerm("");
    // Default to common unit if available, else grams
    setUseCommonUnit(!!item.commonUnit);
    setQuantity(item.commonUnit ? 1 : 100);
  };

  const clearSelection = () => {
    setSelectedItem(null);
    setSearchTerm("");
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
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="חפש מאכל כדי לבדוק קלוריות... (למשל: במבה, שווארמה)"
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

          {!searchTerm && (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Calculator className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">המחשבון המהיר</p>
              <p className="text-xs opacity-70 mt-1 text-center">בדוק קלוריות בשנייה, ללא צורך לשמור ביומן.</p>
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
