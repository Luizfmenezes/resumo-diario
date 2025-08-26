// src/services/sptrans.ts

// --- Tipos de Dados Comuns ---
export interface Vehicle {
  p: string; 
  a: boolean;
  ta: string;
  py: number;
  px: number;
  sl: number;
}

interface LineSearchResult {
  cl: number;
  lc: boolean;
  lt: string;
  sl: number;
  tl: number;
  tp: string; // Nome do terminal principal
  ts: string; // Nome do terminal secundário
}

// --- Novos Tipos para a Previsão de Chegada ---
interface ArrivalVehicle {
  p: string; // Prefixo
  t: string; // Previsão de chegada (ex: "23:40")
  a: boolean; // Acessível
  ta: string; // Horário da atualização GPS
  py: number;
  px: number;
}

interface StopPrediction {
  cp: number; // Código do ponto de parada
  np: string; // Nome do ponto
  py: number;
  px: number;
  vs: ArrivalVehicle[]; // Veículos previstos para chegar neste ponto
}

export interface ArrivalPredictionResponse {
  hr: string; // Horário da consulta
  ps: StopPrediction[]; // Lista de pontos de parada
}

const SPTRANS_API_TOKEN = 'b2ef23d8961253e24ff6ffd4e6beb4cc75c79a7323f6a3ab1cfa45e42d8d681b';
const API_BASE_URL = '/api'; 

class SPTransAPI {
  private isAuthenticated = false;

  public async authenticate(): Promise<boolean> {
    if (this.isAuthenticated) return true;
    try {
      const response = await fetch(`${API_BASE_URL}/Login/Autenticar?token=${SPTRANS_API_TOKEN}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Falha na autenticação: ${response.statusText}`);
      const success = await response.json();
      this.isAuthenticated = success;
      if(success) console.log('Autenticação com a API OlhoVivo bem-sucedida!');
      return success;
    } catch (error) {
      console.error('Erro ao autenticar na API OlhoVivo:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  public async getBusPositions(lineCode: string): Promise<Vehicle[]> {
    if (!await this.authenticate()) throw new Error('Não autenticado na API da SPTrans.');

    try {
      const searchResponse = await fetch(`${API_BASE_URL}/Linha/Buscar?termosBusca=${lineCode}`);
      if (!searchResponse.ok) throw new Error('Falha ao buscar o código da linha.');
      const linesFound: LineSearchResult[] = await searchResponse.json();
      
      if (!linesFound || linesFound.length === 0) return [];
      
      const positionPromises = linesFound.map(async (line) => {
        const response = await fetch(`${API_BASE_URL}/Posicao/Linha?codigoLinha=${line.cl}`);
        if (!response.ok) return [];
        const positionData = await response.json();
        return positionData.vs.map((vehicle: any) => ({ ...vehicle, sl: line.sl }));
      });

      const vehicleArrays = await Promise.all(positionPromises);
      const allVehicles = vehicleArrays.flat();
      return Array.from(new Map(allVehicles.map(v => [v.p, v])).values());
    } catch (error) {
      console.error('Erro ao buscar posições dos veículos:', error);
      return [];
    }
  }

  // --- NOVA FUNÇÃO: Buscar Previsão de Chegada ---
  public async getArrivalPrediction(lineCode: string): Promise<{ tp: ArrivalPredictionResponse; ts: ArrivalPredictionResponse; terminalNames: { tp: string, ts: string } } | null> {
    if (!await this.authenticate()) throw new Error('Não autenticado na API da SPTrans.');

    try {
        const searchResponse = await fetch(`${API_BASE_URL}/Linha/Buscar?termosBusca=${lineCode}`);
        if (!searchResponse.ok) throw new Error('Falha ao buscar o código da linha.');
        const linesFound: LineSearchResult[] = await searchResponse.json();

        if (!linesFound || linesFound.length === 0) return null;

        const lineTP = linesFound.find(l => l.sl === 1);
        const lineTS = linesFound.find(l => l.sl === 2);

        if (!lineTP || !lineTS) return null;

        const [predictionTP, predictionTS] = await Promise.all([
            fetch(`${API_BASE_URL}/Previsao/Linha?codigoLinha=${lineTP.cl}`).then(res => res.json()),
            fetch(`${API_BASE_URL}/Previsao/Linha?codigoLinha=${lineTS.cl}`).then(res => res.json())
        ]);

        return {
            tp: predictionTP,
            ts: predictionTS,
            terminalNames: { tp: lineTP.tp, ts: lineTS.ts }
        };
    } catch (error) {
        console.error('Erro ao buscar previsão de chegada:', error);
        return null;
    }
  }
}

export const sptransAPI = new SPTransAPI();
