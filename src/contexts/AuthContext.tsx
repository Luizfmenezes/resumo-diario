import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';

// Interface para o nosso perfil de usuário, baseado na tabela 'profiles'
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
    setLoading(true);

    // Função segura para buscar o perfil do usuário
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
          return;
        }
        setProfile(userProfile);
      } catch (e) {
        console.error("Erro inesperado ao buscar perfil:", e);
        setProfile(null);
      }
    };

    // O listener onAuthStateChange lida com o carregamento inicial e com as mudanças de login/logout.
    // É a forma mais robusta de gerenciar a sessão.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Se um usuário está logado (seja por login ou refresh), buscamos seu perfil.
        await fetchUserProfile(currentUser);
      } else {
        // Se não há sessão, limpamos o perfil.
        setProfile(null);
      }
      
      // O carregamento só termina DEPOIS que a sessão e o perfil foram verificados.
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez.

  const signIn = async (username: string, password: string) => {
    const { data: email, error: rpcError } = await supabase.rpc('get_user_email_by_username', { 
      p_username: username 
    });

    if (rpcError || !email) {
      toast({ variant: "destructive", title: "Erro no Login", description: "Usuário ou senha inválidos." });
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      toast({ variant: "destructive", title: "Erro no Login", description: "Usuário ou senha inválidos." });
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
      {!loading && children}
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
