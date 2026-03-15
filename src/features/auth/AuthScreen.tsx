import { useState } from "react";
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        if (!termsAccepted) {
          throw new Error("עליך להסכים לתנאי השימוש כדי להירשם.");
        }
        if (!name.trim()) {
           throw new Error("יש להזין שם מלא.");
        }
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        alert("בדוק את המייל שלך לאימות החשבון!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-slate-800">
          {isSignUp ? "צור חשבון" : "התחברות"}
        </h1>
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-right"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-left"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-left"
              dir="ltr"
            />
          </div>
          
          {isSignUp && (
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              <Label htmlFor="terms" className="text-xs leading-relaxed text-slate-600">
                אני מסכים לתנאי השימוש ומאשר את שמירת מפתח ה-API שלי בצורה מוצפנת ומאובטחת בשרת
              </Label>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "טוען..." : isSignUp ? "הרשם" : "התחבר"}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-4 text-sm text-slate-400">או</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleGoogleAuth}
            className="w-full bg-white hover:bg-slate-50"
          >
            התחבר עם Google
          </Button>
          
          <p className="text-center text-xs text-slate-500">
            לא עובד? <span className="cursor-help underline decoration-dotted" title="אם לא נפתח חלון התחברות, ייתכן שחוסם פופ-אפים (Popup Blocker) מונע זאת. נסה לבטל אותו עבור אתר זה.">בדוק את חוסם הפופ-אפים שלך</span>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isSignUp ? "כבר יש לך חשבון? " : "אין לך חשבון? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-blue-600 hover:underline"
          >
            {isSignUp ? "התחבר" : "הרשם עכשיו"}
          </button>
        </p>
      </div>
    </div>
  );
}
