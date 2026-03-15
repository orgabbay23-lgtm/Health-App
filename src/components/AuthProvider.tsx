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
        const existingProfile = useAppStore.getState().profile;
        
        // AGGRESSIVE FILTERING for iOS:
        // If we already have a profile, we don't need to re-fetch on token refresh or background user updates.
        // This prevents the loading gate from flickering or resetting.
        const isBackgroundEvent = event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED';
        const shouldSkipFetch = !!existingProfile && isBackgroundEvent;
        
        if (!shouldSkipFetch) {
          // If it's a fresh sign in or we're missing data, fetch everything
          fetchUserData(sessionUser.id, !!existingProfile);
        }
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
