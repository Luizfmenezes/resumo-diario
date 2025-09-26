import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, LogIn, Activity, BarChart3, Clock, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  // Auto-redirect authenticated users
  useEffect(() => {
    if (!loading && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="mx-auto h-20 w-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-glow">
            <Bus className="h-10 w-10 text-white" />
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Sistema de Consulta de
              <span className="block text-primary-glow">Desempenho de Linhas</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
              Monitore e analise o desempenho operacional das linhas de ônibus em tempo real
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 hover:shadow-glow transition-all duration-300 animate-scale-in"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Acessar Sistema
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Funcionalidades do Sistema
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/20 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle>Relatórios Detalhados</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/80">
                  Visualize dados completos de ICV, ICF, IPP e ocorrências S.O.S para cada linha de ônibus.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/20 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <CardTitle>Consulta por Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/80">
                  Selecione qualquer data e consulte o histórico de desempenho das linhas operacionais.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/20 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Acesso Seguro</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/80">
                  Sistema com autenticação segura via Supabase, garantindo proteção dos dados operacionais.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm text-white/60 text-center py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="flex items-center justify-center gap-2">
            <Activity className="h-4 w-4" />
            Sistema desenvolvido com React, Supabase e Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
