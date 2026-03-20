import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export function AuthScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot_password">("signin");
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (authMode === "signup") {
        if (!termsAccepted) throw new Error("עליך להסכים לתנאי השימוש כדי להירשם.");
        if (!name.trim()) throw new Error("יש להזין שם מלא.");
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        toast.success("בדוק את המייל שלך לאימות החשבון!");
      } else if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (authMode === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast.success("שלחנו לך למייל קישור לאיפוס הסיסמא!");
        setAuthMode("signin"); // Go back to sign in
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        // Redirecting to root prevents 404s on static hosts. 
        // AuthProvider will automatically catch the session from the URL hash.
        options: { redirectTo: `${window.location.origin}/` }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ minHeight: "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))" }} dir="rtl">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob-animate blob-1" />
        <div className="blob-animate blob-2" />
        <div className="blob-animate blob-3" />
        <div className="blob-animate blob-4" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-white/60 backdrop-blur-xl p-8 shadow-soft-2xl border border-white/60">
        <h1 className="mb-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          {authMode === "signup" ? "צור חשבון" : authMode === "forgot_password" ? "איפוס סיסמא" : "התחברות"}
        </h1>
        
        {authMode === "forgot_password" && (
          <p className="text-center text-sm text-slate-600 mb-6">
            הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמא.
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full text-right" />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full text-left" dir="ltr" />
          </div>
          
          {authMode !== "forgot_password" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">סיסמה</Label>
                {authMode === "signin" && (
                  <button type="button" onClick={() => setAuthMode("forgot_password")} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    שכחת סיסמא?
                  </button>
                )}
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full text-left" dir="ltr" />
            </div>
          )}

          {authMode === "signup" && (
            <div className="flex items-start gap-2 pt-2">
              <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900" />
              <Label htmlFor="terms" className="text-xs leading-relaxed text-slate-600">
                אני מסכים/ה לתנאי השימוש ומאשר/ת את שמירת הנתונים.
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "טוען..." : authMode === "signup" ? "הרשם" : authMode === "forgot_password" ? "שלח קישור לאיפוס" : "התחבר"}
          </Button>
        </form>

        {authMode === "forgot_password" ? (
          <div className="mt-6 text-center">
            <button onClick={() => setAuthMode("signin")} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              חזרה להתחברות
            </button>
          </div>
        ) : (
          <>
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-4 text-sm text-slate-400">או</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" onClick={handleGoogleAuth} className="w-full bg-white/50 hover:bg-white/80 backdrop-blur-sm">
                התחבר עם Google
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              {authMode === "signup" ? "כבר יש לך חשבון? " : "אין לך חשבון? "}
              <button onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")} className="font-medium text-blue-600 hover:underline">
                {authMode === "signup" ? "התחבר" : "הרשם עכשיו"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
