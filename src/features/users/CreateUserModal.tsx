import { useEffect, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ModalShell } from "../../components/ui/modal-shell";
import {
  MAX_USERS,
  USER_ACCENT_TOKENS,
  type UserAccentToken,
  useAppStore,
} from "../../store";
import { cn } from "../../utils/utils";
import { accentThemeMap } from "./user-theme";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [accent, setAccent] = useState<UserAccentToken>(USER_ACCENT_TOKENS[0]);
  const createUser = useAppStore((state) => state.createUser);
  const userCount = useAppStore((state) => Object.keys(state.users).length);
  const isAtLimit = userCount >= MAX_USERS;

  const recommendedAccent = useMemo(
    () => USER_ACCENT_TOKENS[userCount % USER_ACCENT_TOKENS.length],
    [userCount],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName("");
    setAccent(recommendedAccent);
  }, [isOpen, recommendedAccent]);

  const handleSubmit = () => {
    const result = createUser({
      name,
      accent,
    });

    if (!result.ok) {
      if (result.reason === "limit") {
        toast.error(`ניתן ליצור עד ${MAX_USERS} משתמשים.`);
        return;
      }

      toast.error("יש להזין שם משתמש קצר וברור.");
      return;
    }

    toast.success("המשתמש נוסף. נמשיך להגדרת הפרופיל.");
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="הוספת משתמש"
      description={`אפשר ליצור עד ${MAX_USERS} פרופילים נפרדים עם נתונים, יומן ומועדפים משלהם.`}
      className="max-w-xl"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="user-name" className="text-sm font-medium text-slate-700">
            שם להצגה
          </label>
          <Input
            id="user-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="למשל: רוני"
            maxLength={24}
          />
          <p className="text-xs text-slate-500">
            שם קצר יעבוד טוב יותר במסך בחירת המשתמשים.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">צבע מזהה</p>
          <div className="grid grid-cols-5 gap-3">
            {USER_ACCENT_TOKENS.map((token) => {
              const theme = accentThemeMap[token];
              const active = accent === token;

              return (
                <button
                  key={token}
                  type="button"
                  className={cn(
                    "flex h-14 items-center justify-center rounded-2xl border transition",
                    theme.button,
                    active ? "ring-2 ring-slate-900 ring-offset-2" : "border-transparent",
                  )}
                  onClick={() => setAccent(token)}
                  aria-label={`בחירת צבע ${token}`}
                >
                  {active ? <Check size={18} className="text-slate-900" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isAtLimit}
            className="rounded-full px-5"
          >
            <Plus size={16} className="ms-2" />
            יצירת משתמש
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
