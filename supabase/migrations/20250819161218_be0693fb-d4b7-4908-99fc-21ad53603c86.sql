-- Create users table for custom authentication
-- Esta tabela é para os seus dados de perfil, não para o login do Supabase Auth.
-- Vamos renomeá-la para 'profiles' para maior clareza e adicionar uma coluna user_id que referencia auth.users.
DROP TABLE IF EXISTS public.users; -- Remove a tabela antiga se existir
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilita RLS para a nova tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela de perfis
-- Os usuários podem ver o seu próprio perfil.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Os usuários podem atualizar o seu próprio perfil.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);


-- --- CORREÇÃO PRINCIPAL: Atualiza as políticas de RLS para a tabela de desempenho ---

-- Remove as políticas antigas baseadas em 'current_setting'
DROP POLICY IF EXISTS "Users can view performance data" ON public.desempenho_linhas;
DROP POLICY IF EXISTS "Users can insert performance data" ON public.desempenho_linhas;
DROP POLICY IF EXISTS "Users can update performance data" ON public.desempenho_linhas;
DROP POLICY IF EXISTS "Users can delete performance data" ON public.desempenho_linhas;

-- Cria novas políticas baseadas na função auth.role()
-- Permite que qualquer usuário autenticado ('authenticated') leia os dados.
CREATE POLICY "Authenticated users can view performance data"
ON public.desempenho_linhas
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários com a role 'admin' podem inserir, atualizar ou deletar dados.
-- Você pode buscar a role do usuário a partir de uma tabela de perfis.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can insert performance data"
ON public.desempenho_linhas
FOR INSERT
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update performance data"
ON public.desempenho_linhas
FOR UPDATE
USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete performance data"
ON public.desempenho_linhas
FOR DELETE
USING (get_user_role() = 'admin');


-- Remove as funções antigas que não são mais necessárias
DROP FUNCTION IF EXISTS public.authenticate_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.set_current_user(TEXT);
