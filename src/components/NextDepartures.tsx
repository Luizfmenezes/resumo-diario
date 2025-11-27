// src/components/NextDepartures.tsx

import React, { useState, useEffect } from 'react';
import { sptransAPI, ArrivalPredictionResponse } from '@/services/sptrans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, Loader2 } from 'lucide-react';

interface NextDeparturesProps {
  lineCode: string;
}

interface DepartureInfo {
  terminalName: string;
  departures: string[];
}

const NextDepartures: React.FC<NextDeparturesProps> = ({ lineCode }) => {
  const [departuresTP, setDeparturesTP] = useState<DepartureInfo | null>(null);
  const [departuresTS, setDeparturesTS] = useState<DepartureInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDepartures = async () => {
      try {
        const predictionData = await sptransAPI.getArrivalPrediction(lineCode);
        if (!isMounted) return;

        if (!predictionData) {
          setError('Não foi possível obter a previsão de partidas.');
          setDeparturesTP(null);
          setDeparturesTS(null);
          setLoading(false);
          return;
        }

        // Função auxiliar para extrair próximos horários de um sentido
        const extractTimes = (resp: ArrivalPredictionResponse | undefined, limit: number): string[] => {
          if (!resp || !resp.ps || resp.ps.length === 0) return [];
          // Agregar todos os veículos de todos os pontos
          const allTimes: string[] = resp.ps.flatMap(p => (p.vs || []).map(v => v.t).filter(Boolean));
          // Remover duplicados e ordenar
          const uniqueSorted = Array.from(new Set(allTimes)).sort((a, b) => {
            // Ordena HH:MM
            const [ah, am] = a.split(':').map(Number);
            const [bh, bm] = b.split(':').map(Number);
            return ah * 60 + am - (bh * 60 + bm);
          });
          return uniqueSorted.slice(0, limit);
        };

        // Partidas dos terminais: considerar primeiros horários de circulação no sentido oposto
        // Para simplificação: mostramos próximos horários do próprio sentido (não invertendo)
        const tpDepartures = extractTimes(predictionData.tp, 5);
        const tsDepartures = extractTimes(predictionData.ts, 5);

        setDeparturesTP({
          terminalName: predictionData.terminalNames.tp || 'Terminal Principal',
          departures: tpDepartures,
        });
        setDeparturesTS({
          terminalName: predictionData.terminalNames.ts || 'Terminal Secundário',
          departures: tsDepartures,
        });
        setError(null);
      } catch (e) {
        console.error('Erro ao obter previsões:', e);
        if (isMounted) {
          setError('Erro ao carregar previsões.');
          setDeparturesTP(null);
          setDeparturesTS(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDepartures();
    const intervalId = setInterval(fetchDepartures, 30000); // Atualiza a cada 30 segundos

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [lineCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        A carregar previsões...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-destructive">
        <AlertTriangle className="h-4 w-4 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="text-center">
        <h3 className="font-semibold text-foreground truncate" title={departuresTP?.terminalName}>
          Saídas de {departuresTP?.terminalName || 'Terminal Principal'}
        </h3>
        <Separator className="my-2" />
        <div className="space-y-1">
          {departuresTP && departuresTP.departures.length > 0 ? (
            departuresTP.departures.map((time, index) => (
              <p key={index} className="text-lg font-mono text-primary font-bold">
                {time}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Sem previsões</p>
          )}
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground truncate" title={departuresTS?.terminalName}>
          Saídas de {departuresTS?.terminalName || 'Terminal Secundário'}
        </h3>
        <Separator className="my-2" />
        <div className="space-y-1">
          {departuresTS && departuresTS.departures.length > 0 ? (
            departuresTS.departures.map((time, index) => (
              <p key={index} className="text-lg font-mono text-primary font-bold">
                {time}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Sem previsões</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NextDepartures;
