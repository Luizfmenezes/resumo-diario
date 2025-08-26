-- Função que será executada pelo gatilho
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere uma nova linha na tabela public.profiles
  -- com o id, email (usado como username inicial) e role padrão do novo usuário.
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, NEW.email, 'admin'); -- Define 'admin' como a role padrão para novos usuários.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho (trigger) que aciona a função após cada novo usuário ser inserido em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
