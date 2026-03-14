import { useState } from "react";
import { ModalShell } from "../../../components/ui/modal-shell";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

interface ByokModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: string) => void;
}

export function ByokModal({ isOpen, onClose, onSuccess }: ByokModalProps) {
  const [key, setKey] = useState("");

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem("GEMINI_API_KEY", key.trim());
      onSuccess(key.trim());
      onClose();
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="הגדרת מפתח Gemini API">
      <div className="space-y-4 p-4" dir="rtl">
        <p className="text-sm text-slate-600">
          כדי להשתמש בתכונות הבינה המלאכותית (AI), עליך להזין מפתח API אישי של Gemini.
          המפתח נשמר בדפדפן שלך בלבד ולא נשלח לשרתים שלנו.
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
          <Button onClick={handleSave} className="flex-1">
            שמור מפתח
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
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
