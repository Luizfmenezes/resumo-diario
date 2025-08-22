import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, TrendingUp, AlertTriangle, Activity, Clock, Users, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SpencerLogo from '@/components/SpencerLogo';

// --- Interfaces e Tipos ---
interface PerformanceData {
  id: string;
  data_referencia: string;
  codigo_linha: string;
  icv_tp_prog: number;
  icv_tp_real: number;
  icv_ts_prog: number;
  icv_ts_real: number;
  perdas_icv: number;
  icf_prog_pm: number;
  icf_prog_ep: number;
  icf_prog_pt: number;
  icf_real_pm: number;
  icf_real_ep: number;
  icf_real_pt: number;
  ipp_tp: number;
  ipp_ts: number;
  ocorrencias_sos: number;
}

// --- Componentes Auxiliares para o Novo Design ---

// Componente para a Barra de Progresso
const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-muted rounded-full h-2.5">
    <div 
      className="bg-primary h-2.5 rounded-full" 
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

// Componente para os cartões de estatística do Resumo Geral
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card className="bg-background/50 p-4 flex flex-col items-center justify-center text-center">
    <div className="text-primary mb-2">{icon}</div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{title}</p>
  </Card>
);


const LineDetails = () => {
  const { lineCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = searchParams.get('date');

  useEffect(() => {
    const fetchLineData = async () => {
      if (!selectedDate || !lineCode) return;
      try {
        setLoading(true);
        setError(null);
        const { data: performanceData, error: fetchError } = await supabase
          .from('desempenho_linhas')
          .select('*')
          .eq('codigo_linha', lineCode)
          .eq('data_referencia', selectedDate)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!performanceData) {
          setError('Nenhum dado encontrado para esta linha na data selecionada.');
        } else {
          setData(performanceData);
        }
      } catch (error) {
        console.error('Error fetching line data:', error);
        setError('Erro ao carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchLineData();
  }, [lineCode, selectedDate]);

  // --- Funções de Cálculo ---
  const calculatePercentage = (real: number, prog: number): number => {
    if (prog === 0) return 0;
    return Math.round((real / prog) * 100);
  };

  // --- Lógica de Renderização ---
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <h1 className="font-bold text-foreground">Linha {lineCode}</h1>
                <p className="text-xs text-muted-foreground">
                  {selectedDate && format(new Date(selectedDate + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </div>
               <div className="h-10 w-10">
                <SpencerLogo className="h-full w-full" />
              </div>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error ? (
          <Card className="border-destructive/50 bg-destructive/5 text-center">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Dados não encontrados</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-6 animate-fade-in">
            
            {/* Secção ICV */}
            <Card className="bg-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Activity className="h-5 w-5 text-primary" />
                  ICV - Cumprimento de Viagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-foreground">ICV TP</span>
                      <span className="text-xs text-muted-foreground">Prog: {data.icv_tp_prog} | Real: {data.icv_tp_real}</span>
                    </div>
                    <ProgressBar value={calculatePercentage(data.icv_tp_real, data.icv_tp_prog)} />
                    <p className="text-right text-sm font-bold text-primary mt-1">{calculatePercentage(data.icv_tp_real, data.icv_tp_prog)}%</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-foreground">ICV TS</span>
                      <span className="text-xs text-muted-foreground">Prog: {data.icv_ts_prog} | Real: {data.icv_ts_real}</span>
                    </div>
                    <ProgressBar value={calculatePercentage(data.icv_ts_real, data.icv_ts_prog)} />
                    <p className="text-right text-sm font-bold text-primary mt-1">{calculatePercentage(data.icv_ts_real, data.icv_ts_prog)}%</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <span className="font-semibold text-foreground">Perdas ICV</span>
                  <span className="font-bold text-lg text-destructive">{data.perdas_icv}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Secção ICF */}
              <Card className="bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="h-5 w-5 text-primary" />
                    ICF - Cumprimento de Frota
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-around">
                    <div className="text-center">
                      <h3 className="font-semibold text-muted-foreground mb-2">Programado</h3>
                      <div className="space-y-2">
                        <p>PM: <span className="font-bold text-foreground">{data.icf_prog_pm}</span></p>
                        <p>EP: <span className="font-bold text-foreground">{data.icf_prog_ep}</span></p>
                        <p>PT: <span className="font-bold text-foreground">{data.icf_prog_pt}</span></p>
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-auto" />
                    <div className="text-center">
                      <h3 className="font-semibold text-muted-foreground mb-2">Realizado</h3>
                      <div className="space-y-2">
                        <p>PM: <span className="font-bold text-foreground">{data.icf_real_pm}</span></p>
                        <p>EP: <span className="font-bold text-foreground">{data.icf_real_ep}</span></p>
                        <p>PT: <span className="font-bold text-foreground">{data.icf_real_pt}</span></p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Secção IPP */}
              <Card className="bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Clock className="h-5 w-5 text-primary" />
                    IPP - Índice de Pontualidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around items-center pt-4">
                    <div className="text-center">
                        <p className="text-4xl font-bold text-primary">{data.ipp_tp}%</p>
                        <p className="text-sm text-muted-foreground">TP</p>
                    </div>
                     <div className="text-center">
                        <p className="text-4xl font-bold text-primary">{data.ipp_ts}%</p>
                        <p className="text-sm text-muted-foreground">TS</p>
                    </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Secção S.O.S */}
            <Card className="bg-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  S.O.S - Ocorrências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center bg-muted/50 p-4 rounded-lg">
                    <span className="text-5xl font-bold text-destructive">{data.ocorrencias_sos}</span>
                    <p className="ml-3 text-muted-foreground">{data.ocorrencias_sos === 1 ? 'ocorrência' : 'ocorrências'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Secção Resumo Geral */}
            <Card className="bg-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Resumo Geral
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  title="ICV Médio"
                  value={`${Math.round((calculatePercentage(data.icv_tp_real, data.icv_tp_prog) + calculatePercentage(data.icv_ts_real, data.icv_ts_prog)) / 2)}%`}
                  icon={<Activity />}
                />
                <StatCard 
                  title="IPP Médio"
                  value={`${Math.round((data.ipp_tp + data.ipp_ts) / 2)}%`}
                  icon={<Clock />}
                />
                <StatCard 
                  title="Frota Total"
                  value={data.icf_real_pt.toString()} // Usando ICF Real PT como Frota Total
                  icon={<Users />}
                />
                <StatCard 
                  title="Viagens Total"
                  value={data.icv_tp_real.toString()} // Usando ICV TP Real como Viagens Total
                  icon={<TrendingUp />}
                />
              </CardContent>
            </Card>

          </div>
        ) : null}
      </main>
    </div>
  );
};

export default LineDetails;
