import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, LogOut, Bus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import LoadServiceModal from '@/components/LoadServiceModal';
import LoadedDatesManager from '@/components/LoadedDatesManager';
import spencerLogoImage from '@/assets/spencer-logo.png';

const busLines = [
  '1017-10', '1020-10', '1024-10', '1025-10', 
  '1026-10', '8015-10', '8015-21', '8016-10', '848L-10', '9784-10', 'N137-11'
];

const getYesterday = () => {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(getYesterday());
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(localDate);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleLineClick = (lineCode: string) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateParam = `${year}-${month}-${day}`;
    navigate(`/linha/${lineCode}?date=${dateParam}`);
  };

  const handleServiceLoaded = () => {
    setRefreshKey(prev => prev + 1);
  };

  // --- CORREÇÃO: Verificar se o 'role' do perfil é 'admin' ---
  const isAdmin = profile?.role === 'admin';

  if (loading || !profile) { // Adicionado '!profile' para maior segurança
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground ml-4">A carregar dados do perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-sm shadow-card border-b border-border animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12">
              <img 
                src={spencerLogoImage} 
                alt="Spencer Transportes" 
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Spencer Transportes</h1>
              <p className="text-sm text-muted-foreground">Sistema de Consulta</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              {/* --- CORREÇÃO: Exibir o nome de usuário do perfil --- */}
              <p className="text-sm font-medium text-foreground">{profile.username}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE", { locale: ptBR })}</p>
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
        <div className="flex flex-col gap-4 mb-6">
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
                    onSelect={handleDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <LoadServiceModal onServiceLoaded={handleServiceLoaded} />
                <LoadedDatesManager onDatesChanged={handleServiceLoaded} />
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative max-w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Buscar linhas..."
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {busLines.map((line, index) => (
            <Card
              key={line}
              className="bg-secondary hover:bg-secondary/90 transition-all duration-200 cursor-pointer animate-scale-in border-0 touch-manipulation"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleLineClick(line)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center bg-white/20 rounded-lg">
                  <Bus className="h-6 w-6 text-white" />
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
