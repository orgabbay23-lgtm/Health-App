import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { MAX_USERS, useAppStore } from "../../store";
import { CreateUserModal } from "./CreateUserModal";
import { UserAvatar } from "./UserAvatar";
import { accentThemeMap } from "./user-theme";

export function WelcomeScreen() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const users = useAppStore((state) => Object.values(state.users));
  const selectUser = useAppStore((state) => state.selectUser);

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(247,244,229,0.95),_rgba(255,255,255,0.94)_38%,_rgba(240,249,255,0.96)_78%),linear-gradient(180deg,_#f6f3ea_0%,_#f8fafc_48%,_#eef6ff_100%)] px-4 py-8 text-right"
      dir="rtl"
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-slate-500 shadow-sm">
            <Users size={14} />
            HEALTH APP
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              בוחרים משתמש וממשיכים בדיוק מאותה נקודה
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              לכל משתמש יש פרופיל קליני, יומן יומי, מועדפים ויעדי תזונה נפרדים. המסך
              הזה נשאר RTL מלא ומתאים לעבודה מהירה גם מהמובייל.
            </p>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user, index) => {
            const theme = accentThemeMap[user.accent];

            return (
              <motion.button
                key={user.id}
                type="button"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28 }}
                className="text-right"
                onClick={() => selectUser(user.id)}
              >
                <Card className="h-full overflow-hidden border-white/70 bg-white/88 shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <UserAvatar name={user.name} accent={user.accent} size="lg" />
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.soft}`}>
                        {user.profile ? "פעיל" : "דורש הגדרה"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold text-slate-950">{user.name}</h2>
                      <p className="text-sm text-slate-500">
                        {user.profile
                          ? `${Object.keys(user.dailyLogs).length} ימים מתועדים, ${user.savedMeals.length} מועדפים`
                          : "פרופיל חדש שמחכה להגדרה הראשונית"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: users.length * 0.05, duration: 0.28 }}
            className="text-right"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={users.length >= MAX_USERS}
          >
            <Card className="flex h-full min-h-[220px] items-center justify-center border-dashed border-slate-300 bg-white/65 shadow-none transition hover:border-slate-400 hover:bg-white/80">
              <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white">
                  <Plus size={24} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {users.length >= MAX_USERS ? "הגעת למגבלת המשתמשים" : "הוסף משתמש"}
                  </h2>
                  <p className="max-w-xs text-sm leading-6 text-slate-500">
                    {users.length >= MAX_USERS
                      ? `אפשר לנהל עד ${MAX_USERS} משתמשים במקביל.`
                      : "יוצרים פרופיל נוסף עם יומן, מועדפים ויעדי תזונה נפרדים."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        </div>

        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </div>
  );
}
