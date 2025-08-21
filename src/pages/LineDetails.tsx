import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SpencerLogo from '@/components/SpencerLogo';

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

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    const fetchLineData = async () => {
      if (!selectedDate || !lineCode) return;

      try {
        setLoading(true);
        setError(null);

        // Ensure user context is set before query
        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          await supabase.rpc('set_current_user', { p_username: userData.username });
        }

        const { data: performanceData, error: fetchError } = await supabase
          .from('desempenho_linhas')
          .select('*')
          .eq('codigo_linha', lineCode)
          .eq('data_referencia', selectedDate)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!performanceData) {
          setError('Nenhum dado encontrado para esta linha na data selecionada.');
          toast({
            variant: "destructive",
            title: "Dados não encontrados",
            description: `Não há dados para a linha ${lineCode} em ${(() => {
              const [year, month, day] = selectedDate.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              return format(date, "dd/MM/yyyy");
            })()}.`,
          });
        } else {
          setData(performanceData);
        }
      } catch (error) {
        console.error('Error fetching line data:', error);
        setError('Erro ao carregar os dados. Tente novamente.');
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados de desempenho.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLineData();
  }, [lineCode, selectedDate, toast]);

  const calculatePercentage = (real: number, prog: number): number => {
    if (prog === 0) return 0;
    return Math.round((real / prog) * 100);
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-secondary';
    if (percentage >= 70) return 'text-accent';
    return 'text-destructive';
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return <TrendingUp className="h-4 w-4" />;
    if (percentage >= 70) return <Activity className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando dados da linha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:bg-primary/10 self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10">
                <SpencerLogo className="h-full w-full" size="sm" />
              </div>
              <div className="text-right">
                <h1 className="font-bold">Linha {lineCode}</h1>
                <p className="text-xs text-muted-foreground">
                  {selectedDate && (() => {
                    const [year, month, day] = selectedDate.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    return format(date, "dd/MM/yyyy");
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Dados não encontrados</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <Card className="bg-gradient-primary text-primary-foreground shadow-glow">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl flex items-center justify-center gap-3">
                  <div className="h-8 w-8">
                    <SpencerLogo className="h-full w-full" size="sm" />
                  </div>
                  🚍 LINHA: {data.codigo_linha}
                </CardTitle>
                <div className="flex items-center justify-center gap-2 text-primary-foreground/80">
                  <Calendar className="h-4 w-4" />
                  {selectedDate && (() => {
                    const [year, month, day] = selectedDate.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                  })()}
                </div>
              </CardHeader>
            </Card>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* ICV Card */}
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Indicadores ICV
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">ICV TP:</span>
                      <div className="text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                          <span className="text-sm">Prog {data.icv_tp_prog}, Real {data.icv_tp_real}</span>
                          <Badge 
                            variant="outline" 
                            className={`${getPerformanceColor(calculatePercentage(data.icv_tp_real, data.icv_tp_prog))} border-current text-xs`}
                          >
                            {getPerformanceIcon(calculatePercentage(data.icv_tp_real, data.icv_tp_prog))}
                            {calculatePercentage(data.icv_tp_real, data.icv_tp_prog)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">ICV TS:</span>
                      <div className="text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                          <span className="text-sm">Prog {data.icv_ts_prog}, Real {data.icv_ts_real}</span>
                          <Badge 
                            variant="outline" 
                            className={`${getPerformanceColor(calculatePercentage(data.icv_ts_real, data.icv_ts_prog))} border-current text-xs`}
                          >
                            {getPerformanceIcon(calculatePercentage(data.icv_ts_real, data.icv_ts_prog))}
                            {calculatePercentage(data.icv_ts_real, data.icv_ts_prog)}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Perdas ICV:</span>
                      <Badge variant={data.perdas_icv > 5 ? "destructive" : "secondary"}>
                        {data.perdas_icv}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ICF Card */}
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Indicadores ICF
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">ICF Prog:</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>PM:</span> <Badge variant="outline">{data.icf_prog_pm}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>EP:</span> <Badge variant="outline">{data.icf_prog_ep}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>PT:</span> <Badge variant="outline">{data.icf_prog_pt}</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">ICF Real:</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>PM:</span> <Badge variant="secondary">{data.icf_real_pm}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>EP:</span> <Badge variant="secondary">{data.icf_real_ep}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>PT:</span> <Badge variant="secondary">{data.icf_real_pt}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* IPP Card */}
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Índice IPP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">TP:</span>
                      <Badge 
                        variant="outline" 
                        className={`${getPerformanceColor(data.ipp_tp)} border-current text-lg px-3 py-1`}
                      >
                        {getPerformanceIcon(data.ipp_tp)}
                        {data.ipp_tp}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">TS:</span>
                      <Badge 
                        variant="outline" 
                        className={`${getPerformanceColor(data.ipp_ts)} border-current text-lg px-3 py-1`}
                      >
                        {getPerformanceIcon(data.ipp_ts)}
                        {data.ipp_ts}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SOS Card */}
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-accent" />
                    Ocorrências S.O.S
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      <Badge 
                        variant={data.ocorrencias_sos > 3 ? "destructive" : data.ocorrencias_sos > 0 ? "default" : "secondary"}
                        className="text-2xl px-4 py-2"
                      >
                        {data.ocorrencias_sos}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {data.ocorrencias_sos === 1 ? 'ocorrência' : 'ocorrências'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Report Card */}
            <Card className="bg-white/50 backdrop-blur-sm shadow-elegant">
              <CardHeader>
                <CardTitle className="text-center">📊 Relatório Resumido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-6 rounded-lg font-mono text-sm space-y-2">
                  <div className="text-center font-bold text-primary text-lg mb-4">
                    --- 🚍 LINHA: {data.codigo_linha} ---
                  </div>
                  <div>• ICV TP: Prog {data.icv_tp_prog}, Real {data.icv_tp_real} ({calculatePercentage(data.icv_tp_real, data.icv_tp_prog)}%)</div>
                  <div>• ICV TS: Prog {data.icv_ts_prog}, Real {data.icv_ts_real} ({calculatePercentage(data.icv_ts_real, data.icv_ts_prog)}%)</div>
                  <div>• Perdas ICV: {data.perdas_icv}</div>
                  <div>• ICF Prog: PM({data.icf_prog_pm}), EP({data.icf_prog_ep}), PT({data.icf_prog_pt})</div>
                  <div>• ICF Real: PM({data.icf_real_pm}), EP({data.icf_real_ep}), PT({data.icf_real_pt})</div>
                  <div>• IPP: TP ({data.ipp_tp}%) TS ({data.ipp_ts}%)</div>
                  <div>• S.O.S: {data.ocorrencias_sos} {data.ocorrencias_sos === 1 ? 'ocorrência' : 'ocorrências'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default LineDetails;