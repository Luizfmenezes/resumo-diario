import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Enquanto o AuthContext está a verificar a sessão (loading === true),
  // exibimos uma tela de carregamento central. Isto é crucial para
  // evitar o redirecionamento prematuro ao recarregar a página.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 2. Apenas depois de o carregamento terminar (loading === false),
  // verificamos se há um utilizador. Se não houver, redirecionamos para a página de login.
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 3. Se o carregamento terminou e há um utilizador, renderizamos o componente filho
  // (o Dashboard ou LineDetails). O próprio Dashboard irá então verificar se o 'profile'
  // já chegou antes de exibir os dados.
  return <>{children}</>;
};

export default ProtectedRoute;
