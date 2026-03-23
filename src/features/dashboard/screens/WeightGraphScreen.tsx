import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subMonths, isAfter, subYears } from "date-fns";
import { Trash2, Edit2, Plus, Calendar, Save, X as XIcon, ChevronRight, Scale } from "lucide-react";
import { useAppStore, type WeightLog } from "../../../store";
import { cn } from "../../../utils/utils";

const FILTERS = [
  { label: "הכל", value: "all" },
  { label: "שנה", value: "year" },
  { label: "6 חודשים", value: "6months" },
  { label: "3 חודשים", value: "3months" },
  { label: "חודש", value: "month" },
];

export function WeightGraphScreen() {
  const weightLogs = useAppStore((state) => state.weightLogs);
  const addWeightLog = useAppStore((state) => state.addWeightLog);
  const updateWeightLog = useAppStore((state) => state.updateWeightLog);
  const deleteWeightLog = useAppStore((state) => state.deleteWeightLog);
  const setActiveScreen = useAppStore((state) => state.setActiveScreen);
  const fetchWeightLogs = useAppStore((state) => state.fetchWeightLogs);

  useEffect(() => {
    fetchWeightLogs();
  }, [fetchWeightLogs]);

  const [filter, setFilter] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [dateValue, setDateValue] = useState(format(new Date(), 'yyyy-MM-dd'));

  const displayLogs = useMemo(() => {
    return [...weightLogs].sort((a, b) =>
      new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    );
  }, [weightLogs]);

  const filteredLogs = useMemo(() => {
    let cutoff: Date | null = null;
    const now = new Date();

    if (filter === "year") cutoff = subYears(now, 1);
    else if (filter === "6months") cutoff = subMonths(now, 6);
    else if (filter === "3months") cutoff = subMonths(now, 3);
    else if (filter === "month") cutoff = subMonths(now, 1);

    const sorted = [...displayLogs].sort((a, b) => 
      new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    );

    if (!cutoff) return sorted;

    return sorted.filter((log) => isAfter(new Date(log.logged_at), cutoff!));
  }, [displayLogs, filter]);

  const chartData = useMemo(() => {
    return filteredLogs.map((log) => ({
      id: log.id,
      dateStr: format(new Date(log.logged_at), "dd/MM"),
      fullDate: format(new Date(log.logged_at), "dd/MM/yyyy HH:mm"),
      weight: Number(log.weight),
    }));
  }, [filteredLogs]);

  const handleSubmit = async () => {
    const weight = parseFloat(inputValue);
    if (isNaN(weight) || weight <= 0) return;

    if (editingId) {
      await updateWeightLog(editingId, weight);
      setEditingId(null);
    } else {
      // If the selected date is today, use the current full timestamp
      // Otherwise, use the start of the selected day
      const isTodaySelected = dateValue === format(new Date(), 'yyyy-MM-dd');
      const finalDate = isTodaySelected ? new Date().toISOString() : new Date(dateValue).toISOString();
      
      await addWeightLog(weight, finalDate);
      setIsAdding(false);
    }
    setInputValue("");
  };

  const startEdit = (log: WeightLog) => {
    setEditingId(log.id);
    setInputValue(log.weight.toString());
    setIsAdding(false);
    // Scroll to top to see the edit form
    const scrollCanvas = document.querySelector('.ios-scroll-canvas');
    if (scrollCanvas) scrollCanvas.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-32 px-4" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center -mx-2 mb-4">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setActiveScreen("home")}
             className="p-2 hover:bg-slate-100 rounded-full transition-colors"
           >
             <ChevronRight size={24} className="text-slate-900" />
           </button>
           <h1 className="text-2xl font-black text-slate-900">מעקב משקל</h1>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setInputValue("");
          }}
          className="w-10 h-10 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          {isAdding || editingId ? <XIcon size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Scale size={18} />
            {editingId ? "ערוך רישום" : "הוסף משקל חדש"}
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1 px-1">משקל (ק״ג)</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-white rounded-2xl p-3 border-none shadow-sm focus:ring-2 focus:ring-slate-950"
                  autoFocus
                />
              </div>
              {!editingId && (
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1 px-1">תאריך</label>
                  <input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="w-full bg-white rounded-2xl p-3 border-none shadow-sm focus:ring-2 focus:ring-slate-950"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!inputValue}
                className="flex-1 bg-slate-950 text-white font-bold py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {editingId ? "עדכן" : "שמור"}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setInputValue("");
                }}
                className="flex-1 bg-white text-slate-500 font-bold py-3 rounded-2xl border border-slate-200 active:scale-95 transition-all"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex overflow-x-auto gap-2 -mx-2 px-2 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-5 py-2.5 rounded-full whitespace-nowrap text-[13px] font-bold transition-all flex-shrink-0",
              filter === f.value 
                ? "bg-slate-950 text-white shadow-md shadow-slate-950/20" 
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Graph Section */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[350px]">
        <div className="mb-4">
          <div className="text-sm font-bold text-slate-400">מגמת שינוי</div>
          {filteredLogs.length > 1 && (
             <div className={cn(
               "text-xl font-black",
               filteredLogs[filteredLogs.length-1].weight < filteredLogs[0].weight ? "text-emerald-500" : "text-rose-500"
             )}>
               {Math.abs(filteredLogs[filteredLogs.length-1].weight - filteredLogs[0].weight).toFixed(1)} ק״ג
               <span className="text-xs font-bold mr-1 opacity-70">
                 {filteredLogs[filteredLogs.length-1].weight < filteredLogs[0].weight ? "ירידה" : "עלייה"}
               </span>
             </div>
          )}
        </div>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis 
                dataKey="id"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={(id) => {
                  const item = chartData.find(d => d.id === id);
                  return item ? item.dateStr : "";
                }}
                interval="preserveStartEnd"
                minTickGap={30}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip 
                cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-50 text-right min-w-[120px]" dir="rtl">
                        <div className="text-[10px] text-slate-400 font-bold mb-1">{data.fullDate}</div>
                        <div className="text-base font-black text-slate-900">{data.weight} ק״ג</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#0f172a" 
                strokeWidth={4} 
                dot={{ r: 5, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 4, stroke: 'rgba(15, 23, 42, 0.1)' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        <h3 className="font-black text-xl text-slate-900 pr-2">היסטוריית מדידות</h3>
        <div className="space-y-3">
          {[...displayLogs].reverse().map((log) => (
            <motion.div 
              layout
              key={log.id}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Calendar size={22} />
                </div>
                <div>
                  <div className="font-black text-lg text-slate-900">{log.weight} ק״ג</div>
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    {format(new Date(log.logged_at), "dd/MM/yyyy")}
                    <span className="opacity-50">•</span>
                    {format(new Date(log.logged_at), "HH:mm")}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(log)}
                  className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("בטוח שברצונך למחוק רישום זה?")) {
                      deleteWeightLog(log.id);
                    }
                  }}
                  className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {weightLogs.length === 0 && (
          <div className="text-center py-16 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Scale size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">אין עדיין נתוני משקל.<br/>התחילו לתעד כדי לראות את הגרף!</p>
          </div>
        )}
      </div>
    </div>
  );
}
