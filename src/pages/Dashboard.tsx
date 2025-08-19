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
import LoadServiceModal from '@/components/LoadServiceModal';
import LoadedDatesManager from '@/components/LoadedDatesManager';

const busLines = [
  '1017-10', '1020-10', '1024-10', '1025-10', 
  '1026-10', '8015-10', '8016-10', '9784-10', 'N137-11'
];

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleLineClick = (lineCode: string) => {
    const dateParam = format(selectedDate, 'yyyy-MM-dd');
    navigate(`/linha/${lineCode}?date=${dateParam}`);
  };

  const handleServiceLoaded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-card border-b border-border animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <Bus className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Consulta de Linhas</h1>
              <p className="text-sm text-muted-foreground">13 de Agosto de 2025</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.username}</p>
              <p className="text-xs text-muted-foreground">Quarta-Feira</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2 border-border"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Controls Section */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Date Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      "border-border bg-card hover:bg-accent"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:bg-primary/10"
                onClick={() => setRefreshKey(prev => prev + 1)}
              >
                🔄 Atualizar
              </Button>
            </div>
            
            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <LoadServiceModal onServiceLoaded={handleServiceLoaded} />
                <LoadedDatesManager onDatesChanged={handleServiceLoaded} />
              </div>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Buscar linhas..."
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Bus Lines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {busLines.map((line, index) => (
            <Card
              key={line}
              className="bg-secondary hover:bg-secondary/90 transition-all duration-200 cursor-pointer animate-scale-in border-0 touch-manipulation"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleLineClick(line)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-lg truncate">
                    Linha {line}
                  </h3>
                  <p className="text-white/80 text-sm">
                    Consultar resumo
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="text-center text-muted-foreground text-sm animate-fade-in mt-8">
          <p>
            Sistema desenvolvido para consulta de desempenho operacional
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;