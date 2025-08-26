import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Interface para os dados do nosso usuário logado
interface UserProfile {
  id: string;
  username: string;
  role: string;
}

// Interface para os dados que o contexto de autenticação irá fornecer
interface AuthContextType {
  profile: UserProfile | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Chave para guardar os dados do usuário no localStorage do navegador
const USER_SESSION_KEY = 'spencer-transporte-user-session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Ao carregar a aplicação, verifica se existe uma sessão guardada no localStorage
    const initializeSession = () => {
      try {
        const storedSession = localStorage.getItem(USER_SESSION_KEY);
        if (storedSession) {
          const userProfile: UserProfile = JSON.parse(storedSession);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Falha ao carregar sessão do localStorage", error);
        localStorage.removeItem(USER_SESSION_KEY); // Limpa em caso de erro
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    // Chama a nossa função 'authenticate_user' no banco de dados
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username,
      p_password: password,
    });

    if (error || !data || data.length === 0) {
      toast({ variant: "destructive", title: "Erro no Login", description: "Utilizador ou senha inválidos." });
      return;
    }

    const userProfile = data[0];
    setProfile(userProfile);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userProfile)); // Guarda a sessão

    toast({ title: "Login realizado", description: `Bem-vindo de volta, ${userProfile.username}!` });
  };

  const signOut = async () => {
    setProfile(null);
    localStorage.removeItem(USER_SESSION_KEY); // Remove a sessão
    toast({ title: "Logout realizado", description: "Até logo!" });
  };

  const value = {
    profile,
    signIn,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
