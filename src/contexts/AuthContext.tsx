import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Interface para os dados que o contexto de autenticação irá fornecer
interface AuthContextType {
  user: { username: string; role: string } | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verifica se há utilizador autenticado no localStorage
    const checkAuthState = () => {
      const storedUser = localStorage.getItem('authenticated_user');
      const sessionExpiry = localStorage.getItem('session_expiry');
      
      if (storedUser && sessionExpiry) {
        const now = new Date().getTime();
        const expiry = parseInt(sessionExpiry);
        
        if (now < expiry) {
          // Sessão ainda válida
          setUser(JSON.parse(storedUser));
        } else {
          // Sessão expirada
          localStorage.removeItem('authenticated_user');
          localStorage.removeItem('session_expiry');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuthState();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password
      });

      if (error || !data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro no Login",
          description: "Utilizador ou senha inválidos."
        });
        return;
      }

      const userData = data[0];
      
      // Define o utilizador atual para as políticas RLS
      await supabase.rpc('set_current_user', { p_username: username });
      
      // Armazena dados do utilizador no localStorage com expiração de 24 horas
      const sessionExpiry = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('authenticated_user', JSON.stringify(userData));
      localStorage.setItem('session_expiry', sessionExpiry.toString());
      
      setUser(userData);
      
      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!"
      });
    } catch (error) {
      console.error('Erro no signIn:', error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: "Erro interno do servidor."
      });
    }
  };

  const signOut = async () => {
    localStorage.removeItem('authenticated_user');
    localStorage.removeItem('session_expiry');
    setUser(null);
    toast({ title: "Logout realizado", description: "Até logo!" });
  };

  const value = {
    user,
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
