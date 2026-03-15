import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../store";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchUserData = useAppStore(state => state.fetchUserData);
  const clearUserData = useAppStore(state => state.clearUserData);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      
      if (sessionUser) {
        // Store will decide if it needs to show loader based on profile presence
        fetchUserData(sessionUser.id);
      } else {
        clearUserData();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        // We let fetchUserData handle the "isSilent" logic.
        // It will be silent if profile already exists.
        // event-based overrides can be added here if needed, but usually redundant now.
        fetchUserData(sessionUser.id);
      } else if (event === 'SIGNED_OUT') {
        clearUserData();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, clearUserData]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
