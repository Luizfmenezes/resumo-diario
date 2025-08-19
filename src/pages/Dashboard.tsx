import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Bus, Calendar as CalendarIcon, LogOut, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const busLines = [
  '1017-10', '1020-10', '1024-10', '1025-10', 
  '1026-10', '8015-10', '8016-10', '9784-10', 'N137-11'
];

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleLineClick = (lineCode: string) => {
    const dateParam = format(selectedDate, 'yyyy-MM-dd');
    navigate(`/linha/${lineCode}?data=${dateParam}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-card border-b animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Sistema de Consulta</h1>
              <p className="text-sm text-muted-foreground">Desempenho de Linhas de Ônibus</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Usuário conectado</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Date Selection */}
        <Card className="bg-gradient-card shadow-elegant animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Selecione a Data para Consulta
            </CardTitle>
            <CardDescription>
              Escolha a data para visualizar o desempenho das linhas de ônibus
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-80 justify-start text-left font-normal bg-white/50 hover:bg-white/80 transition-all",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Selected Date Display */}
        <div className="text-center animate-fade-in">
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary/10 text-primary border-primary/20">
            <Activity className="mr-2 h-4 w-4" />
            Consulta para {format(selectedDate, "dd/MM/yyyy")}
          </Badge>
        </div>

        {/* Bus Lines Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">Linhas Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {busLines.map((line, index) => (
              <Card
                key={line}
                className="hover:shadow-glow transition-all duration-300 cursor-pointer group bg-gradient-card animate-scale-in hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleLineClick(line)}
              >
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all">
                    <Bus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Linha {line}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Clique para visualizar o desempenho
                  </p>
                  <div className="mt-4">
                    <Badge variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver Relatório
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-muted-foreground text-sm animate-fade-in">
          <p>
            Sistema desenvolvido para consulta de desempenho operacional • 
            Dados em tempo real do Supabase
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;