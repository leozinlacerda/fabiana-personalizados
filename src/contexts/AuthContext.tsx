import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, isAdmin as checkIsAdmin } from '@/lib/db';
type User = any;

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  refreshUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsAdmin(await checkIsAdmin());
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    const { data: { subscription } } = (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { supabase } = require('@/integrations/supabase/client');
        return supabase.auth.onAuthStateChange(() => refreshUser());
      } catch { return { data: { subscription: { unsubscribe: () => {} } } }; }
    })();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
