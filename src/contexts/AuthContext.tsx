import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeUser = async () => {
      // Check for existing user in localStorage
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Set user context in database (await to ensure it's set)
          await supabase.rpc('set_current_user', { p_username: userData.username });
        } catch (error) {
          console.error('Error parsing stored user or setting context:', error);
          localStorage.removeItem('current_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeUser();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Simple hardcoded check for Luiz user first
      if (username === 'Luiz' && password === 'admin123') {
        const userData = { id: '1', username: 'Luiz', role: 'admin' };
        setUser(userData);
        localStorage.setItem('current_user', JSON.stringify(userData));
        
        // Try to set user context, but don't fail if it doesn't work
        try {
          await supabase.rpc('set_current_user', { p_username: userData.username });
        } catch (rpcError) {
          console.warn('Failed to set user context in database', rpcError);
        }

        toast({
          title: "Login realizado",
          description: "Bem-vindo ao sistema, Luiz!",
        });
        return {};
      }

      // Try database authentication for other users
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password
      });

      if (error || !data || data.length === 0) {
        const errorMessage = 'Usuário ou senha inválidos';
        toast({
          variant: "destructive",
          title: "Erro no Login",
          description: errorMessage,
        });
        return { error: errorMessage };
      }

      const userData = data[0];
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      
      // Set user context in database
      try {
        await supabase.rpc('set_current_user', { p_username: userData.username });
      } catch (rpcError) {
        console.warn('Failed to set user context in database', rpcError);
      }

      toast({
        title: "Login realizado",
        description: "Bem-vindo ao sistema!",
      });

      return {};
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = 'Erro inesperado. Tente novamente.';
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('current_user');
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};