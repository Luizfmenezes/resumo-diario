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
        try {
          const response = await fetch(`${API_BASE_URL}/Posicao/Linha?codigoLinha=${line.cl}`);
          if (!response.ok) return [];
          const positionData = await response.json();
          return positionData.vs.map((vehicle: any) => ({ ...vehicle, sl: line.sl }));
        } catch (error) {
          console.error(`Erro ao buscar posições da linha ${line.cl}:`, error);
          return [];
        }
      });

      const vehicleArrays = await Promise.all(positionPromises);
      const allVehicles = vehicleArrays.flat();
      return Array.from(new Map(allVehicles.map(v => [v.p, v])).values());
    } catch (error) {
      console.error('Erro ao buscar posições dos veículos:', error);
      return [];
    }
  }

  // Nova função para busca otimizada de múltiplas linhas
  public async getAllBusPositionsFromLines(lineCodes: string[]): Promise<{ [lineCode: string]: Vehicle[] }> {
    if (!await this.authenticate()) throw new Error('Não autenticado na API da SPTrans.');

    const results: { [lineCode: string]: Vehicle[] } = {};
    
    const promises = lineCodes.map(async (lineCode) => {
      try {
        const vehicles = await this.getBusPositions(lineCode);
        return { lineCode, vehicles };
      } catch (error) {
        console.error(`Erro ao buscar linha ${lineCode}:`, error);
        return { lineCode, vehicles: [] };
      }
    });

    const allResults = await Promise.all(promises);
    
    allResults.forEach(({ lineCode, vehicles }) => {
      results[lineCode] = vehicles;
    });

    return results;
  }

  // Nova função para buscar veículos por prefixos específicos
  public async findVehiclesByPrefixes(prefixes: string[], searchInLines?: string[]): Promise<{ [prefix: string]: (Vehicle & { foundInLine: string })[] }> {
    if (!await this.authenticate()) throw new Error('Não autenticado na API da SPTrans.');

    // Se o chamador não informou linhas específicas, buscar dinamicamente
    // todas as linhas disponíveis na API para garantir cobertura completa
    let linesToSearch: string[] = [];
    if (searchInLines && searchInLines.length > 0) {
      linesToSearch = searchInLines;
    } else {
      try {
        // Buscar todas as linhas (termosBusca vazio tende a retornar todas ou muitas linhas)
        const resp = await fetch(`${API_BASE_URL}/Linha/Buscar?termosBusca=`);
        if (!resp.ok) throw new Error('Falha ao listar linhas na API.');
        const allLines: any[] = await resp.json();
        // Mapear para os códigos de linha (campo lt ou outro apropriado)
        linesToSearch = allLines
          .map(l => l.lt)
          .filter(Boolean);

        // Fallback para um conjunto conhecido caso a API retorne vazio
        if (linesToSearch.length === 0) {
          linesToSearch = [
            '1017-10', '1020-10', '1024-10', '1025-10', '1026-10', 
            '8015-10', '8015-21', '8016-10', '848L-10', '9784-10', 'N137-11'
          ];
        }
      } catch (error) {
        console.error('Erro ao obter lista de linhas dinamicamente:', error);
        linesToSearch = [
          '1017-10', '1020-10', '1024-10', '1025-10', '1026-10', 
          '8015-10', '8015-21', '8016-10', '848L-10', '9784-10', 'N137-11'
        ];
      }
    }

    console.log(`🔍 Buscando prefixos ${prefixes.join(', ')} nas linhas: ${linesToSearch.join(', ')}`);

    // Buscar todos os veículos de todas as linhas de forma concorrente em lotes
    // para evitar sobrecarga de requisições simultâneas.
    const BATCH_SIZE = 8; // número de linhas por batch
    const allLineData: { [lineCode: string]: Vehicle[] } = {};

    for (let i = 0; i < linesToSearch.length; i += BATCH_SIZE) {
      const batch = linesToSearch.slice(i, i + BATCH_SIZE);
      try {
        const batchResults = await this.getAllBusPositionsFromLines(batch);
        Object.assign(allLineData, batchResults);
      } catch (err) {
        console.error('Erro ao buscar lote de linhas:', err);
      }
    }
    
    const results: { [prefix: string]: (Vehicle & { foundInLine: string })[] } = {};
    
    // Inicializar resultados para cada prefixo
    prefixes.forEach(prefix => {
      results[prefix] = [];
    });

    // Para cada linha, verificar se há veículos com os prefixos procurados
    Object.entries(allLineData).forEach(([lineCode, vehicles]) => {
      vehicles.forEach(vehicle => {
        prefixes.forEach(prefix => {
          const vp = String(vehicle.p || '').trim();
          const term = String(prefix).trim();

          // Busca: exata, startsWith e includes (para permitir pesquisas parciais)
          const prefixMatch = vp === term || vp.startsWith(term) || vp.includes(term);

          if (prefixMatch) {
            results[term].push({
              ...vehicle,
              foundInLine: lineCode
            });
            // log útil apenas em modo dev
            // console.log(`✅ Prefixo ${term} encontrado: veículo ${vp} na linha ${lineCode}`);
          }
        });
      });
    });

    // Log resumido dos resultados (apenas para dev)
    prefixes.forEach(prefix => {
      const count = results[prefix].length;
      if (count > 0) {
        console.debug(`🎯 Prefixo ${prefix}: ${count} veículo(s) encontrado(s)`);
      }
    });

    return results;
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
