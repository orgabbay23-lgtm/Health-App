import { useState } from "react";
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
  const [inputKey, setInputKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const rawCleanKey = inputKey.replace(/\s+/g, '').trim();
    if (rawCleanKey) {
      setIsSaving(true);
      try {
        const { error } = await supabase.rpc('set_user_api_key', { secret_key: rawCleanKey });
        if (error) throw error;

        toast.success("מפתח ה-API נשמר בהצלחה בצורה מאובטחת!");
        setInputKey("");
        onSuccess(rawCleanKey);
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
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 450);
            }}
            className="text-left text-[16px]"
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
        <p className="text-center text-[13px] text-slate-500">
          ניתן להשיג מפתח בחינם ב- <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">Google AI Studio</a>
        </p>
      </div>
    </ModalShell>
  );
}
