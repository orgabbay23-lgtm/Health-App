import { useState, useEffect } from "react";
import { ModalShell } from "../../../components/ui/modal-shell";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

interface ByokModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: string) => void;
}

export function ByokModal({ isOpen, onClose, onSuccess }: ByokModalProps) {
  const [key, setKey] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleSave = async () => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      setIsSaving(true);
      try {
        const { error } = await supabase.rpc('set_user_api_key', { secret_key: trimmedKey });
        if (error) throw error;
        
        toast.success("מפתח ה-API נשמר בהצלחה בצורה מאובטחת!");
        onSuccess(trimmedKey);
        onClose();
      } catch (error) {
        console.error("Error saving API key:", error);
        toast.error("שגיאה בשמירת המפתח. נסה שוב.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="הגדרת מפתח Gemini API">
      <div className="space-y-4 p-4" dir="rtl">
        <p className="text-sm text-slate-600">
          כדי להשתמש בתכונות הבינה המלאכותית (AI), עליך להזין מפתח API אישי של Gemini.
          המפתח נשמר באופן מוצפן ומאובטח בשרת (Supabase Vault) ואינו נגיש לאף אחד מלבד השרת.
        </p>
        <div className="space-y-2">
          <Label htmlFor="api-key">מפתח API</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="AIza..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="text-left"
            dir="ltr"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
            {isSaving ? "שומר..." : "שמור מפתח"}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSaving}>
            ביטול
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400">
          ניתן להשיג מפתח בחינם ב- <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">Google AI Studio</a>
        </p>
      </div>
    </ModalShell>
  );
}

