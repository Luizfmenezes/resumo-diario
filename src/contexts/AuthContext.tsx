import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';

// Interface para o nosso perfil de utilizador, baseado na tabela 'profiles'
interface Profile {
  username: string;
  role: string;
}

// Interface para os dados que o contexto de autenticação irá fornecer
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Função segura para buscar o perfil do utilizador
    const fetchUserProfile = async (user: User) => {
      try {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Perfil não encontrado ou erro na busca:", error.message);
          setProfile(null);
        } else {
          setProfile(userProfile);
        }
      } catch (e) {
        console.error("Erro inesperado ao buscar perfil:", e);
        setProfile(null);
      }
    };

    // 1. Verificação da sessão inicial ao carregar a página
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user);
        }
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      } finally {
        // ESSENCIAL: Garante que o loading termine, mesmo se houver erro
        setLoading(false);
      }
    };

    initializeSession();

    // 2. Listener para mudanças de autenticação (login/logout em outra aba, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setProfile(null);
      }
    });

    // Função de limpeza para remover o listener quando o componente for desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez.

  const signIn = async (username: string, password: string) => {
    const { data: email, error: rpcError } = await supabase.rpc('get_user_email_by_username', { 
      p_username: username 
    });

    if (rpcError || !email) {
      toast({ variant: "destructive", title: "Erro no Login", description: "Utilizador ou senha inválidos." });
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      toast({ variant: "destructive", title: "Erro no Login", description: "Utilizador ou senha inválidos." });
    } else {
      toast({ title: "Login realizado", description: "Bem-vindo de volta!" });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logout realizado", description: "Até logo!" });
  };

  const value = {
    session,
    user,
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
