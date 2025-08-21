import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';

// Interface para o nosso perfil de usuário
interface Profile {
  username: string;
  role: string;
}

// Interface para os dados do contexto de autenticação
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
    // Função segura para buscar o perfil do usuário
    const fetchUserProfile = async (user: User) => {
      console.log("Buscando perfil para o usuário com ID:", user.id);

      try {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', user.id)
          .single();

        console.log("Resultado da busca de perfil (data):", userProfile);
        console.log("Resultado da busca de perfil (error):", error);

        if (error) {
          console.error("Erro na busca de perfil (RLS ou dado não encontrado):", error.message);
          setProfile(null);
          return null;
        }
        
        if (!userProfile) {
            console.log("PERFIL NÃO ENCONTRADO! Verifique se o ID do usuário existe na tabela 'profiles' e se os dados correspondem.");
        }

        return userProfile;
      } catch (e) {
        console.error("Erro inesperado ao buscar perfil:", e);
        return null;
      }
    };

    // Lógica de inicialização da sessão
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchUserProfile(session.user);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Listener para mudanças de autenticação (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      
      if (loading) setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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

  // --- DEBUG LOG FINAL ---
  // Este log nos mostra o valor do 'profile' toda vez que o AuthProvider renderiza.
  console.log("AuthProvider is rendering with profile:", profile);

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
