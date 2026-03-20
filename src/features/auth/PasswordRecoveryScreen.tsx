import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAppStore } from "../../store";

export function PasswordRecoveryScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setIsRecoveringPassword = useAppStore(state => state.setIsRecoveringPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success("הסיסמה שונתה בהצלחה!");
      setIsRecoveringPassword(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ minHeight: "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))" }}
      dir="rtl"
    >
      {/* Mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob-animate blob-1" />
        <div className="blob-animate blob-2" />
        <div className="blob-animate blob-3" />
        <div className="blob-animate blob-4" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-white/60 backdrop-blur-xl p-8 shadow-soft-2xl border border-white/60">
        <h1 className="mb-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          קביעת סיסמה חדשה
        </h1>
        
        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה חדשה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-left"
              dir="ltr"
              placeholder="מינימום 6 תווים"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">אימות סיסמה חדשה</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full text-left"
              dir="ltr"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "מעדכן..." : "עדכן סיסמה"}
          </Button>
        </form>
      </div>
    </div>
  );
}
