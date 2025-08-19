-- Create users table for custom authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (username = current_setting('app.current_username', true));

-- Insert user Luiz with password 123
INSERT INTO public.users (username, password, role) 
VALUES ('Luiz', '123', 'admin');

-- Update RLS policies for desempenho_linhas to work with custom auth
DROP POLICY IF EXISTS "Authenticated users can view performance data" ON public.desempenho_linhas;
DROP POLICY IF EXISTS "Only authenticated users can insert performance data" ON public.desempenho_linhas;
DROP POLICY IF EXISTS "Only authenticated users can update performance data" ON public.desempenho_linhas;

CREATE POLICY "Users can view performance data" 
ON public.desempenho_linhas 
FOR SELECT 
USING (current_setting('app.current_username', true) IS NOT NULL);

CREATE POLICY "Users can insert performance data" 
ON public.desempenho_linhas 
FOR INSERT 
WITH CHECK (current_setting('app.current_username', true) IS NOT NULL);

CREATE POLICY "Users can update performance data" 
ON public.desempenho_linhas 
FOR UPDATE 
USING (current_setting('app.current_username', true) IS NOT NULL);

CREATE POLICY "Users can delete performance data" 
ON public.desempenho_linhas 
FOR DELETE 
USING (current_setting('app.current_username', true) IS NOT NULL);

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username TEXT, p_password TEXT)
RETURNS TABLE(id UUID, username TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role
  FROM public.users u
  WHERE u.username = p_username AND u.password = p_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set current user context
CREATE OR REPLACE FUNCTION public.set_current_user(p_username TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_username', p_username, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;