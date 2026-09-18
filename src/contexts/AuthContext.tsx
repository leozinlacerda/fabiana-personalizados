import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, isAdmin as checkIsAdmin, initializeDefaultData, migrateBase64Images, User } from '@/lib/localStorage';

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

  const refreshUser = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsAdmin(checkIsAdmin());
  };

  useEffect(() => {
    // Inicializar dados padrão
    initializeDefaultData();
    
    // Migrar imagens base64 existentes para IndexedDB
    migrateBase64Images().catch(() => {});
    
    // Verificar sessão existente
    refreshUser();
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
