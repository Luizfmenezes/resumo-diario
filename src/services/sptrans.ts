// src/services/sptrans.ts

export interface Vehicle {
  p: string; 
  a: boolean;
  ta: string;
  py: number;
  px: number;
  sl: number; // --- ADICIONADO: Sentido da linha (1 ou 2) ---
}

interface LineSearchResult {
  cl: number; // Código da linha (ID interno)
  lc: boolean;
  lt: string;
  sl: number; // Sentido da linha (1 ou 2)
  tl: number;
  tp: string;
  ts: string;
}

interface PositionResponse {
  hr: string;
  vs: Omit<Vehicle, 'sl'>[]; // A resposta da API não inclui 'sl', nós adicionamos depois
}

const SPTRANS_API_TOKEN = 'b2ef23d8961253e24ff6ffd4e6beb4cc75c79a7323f6a3ab1cfa45e42d8d681b';
const API_BASE_URL = '/api'; 

class SPTransAPI {
  private isAuthenticated = false;

  public async authenticate(): Promise<boolean> {
    if (this.isAuthenticated) {
      return true;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/Login/Autenticar?token=${SPTRANS_API_TOKEN}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Falha na autenticação: ${response.statusText}`);
      }
      const success = await response.json();
      if (success) {
        this.isAuthenticated = true;
        console.log('Autenticação com a API OlhoVivo bem-sucedida!');
        return true;
      } else {
        console.error('Autenticação com a API OlhoVivo falhou.');
        this.isAuthenticated = false;
        return false;
      }
    } catch (error) {
      console.error('Erro ao autenticar na API OlhoVivo:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  public async getBusPositions(lineCode: string): Promise<Vehicle[]> {
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        throw new Error('Não autenticado na API da SPTrans.');
      }
    }

    try {
      const searchResponse = await fetch(`${API_BASE_URL}/Linha/Buscar?termosBusca=${lineCode}`);
      if (!searchResponse.ok) {
        throw new Error('Falha ao buscar o código da linha.');
      }
      const linesFound: LineSearchResult[] = await searchResponse.json();
      
      if (!linesFound || linesFound.length === 0) {
        console.warn(`Nenhuma linha encontrada para o código: ${lineCode}`);
        return [];
      }
      
      const positionPromises = linesFound.map(async (line) => {
        const response = await fetch(`${API_BASE_URL}/Posicao/Linha?codigoLinha=${line.cl}`);
        if (!response.ok) {
          console.error(`Erro ao buscar posição para a linha ${line.cl}: ${response.statusText}`);
          return []; // Retorna array vazio em caso de erro para esta linha
        }
        const positionData: PositionResponse = await response.json();
        // --- ADICIONADO: Adiciona o sentido (sl) a cada veículo ---
        return positionData.vs.map(vehicle => ({ ...vehicle, sl: line.sl }));
      });

      const vehicleArrays = await Promise.all(positionPromises);

      // Junta os veículos de todos os sentidos num único array
      const allVehicles = vehicleArrays.flat();
      
      const uniqueVehicles = Array.from(new Map(allVehicles.map(v => [v.p, v])).values());

      return uniqueVehicles;

    } catch (error) {
      console.error('Erro ao buscar posições dos veículos:', error);
      if (error instanceof Error && error.message.includes('401')) {
          this.isAuthenticated = false;
      }
      return [];
    }
  }
}

export const sptransAPI = new SPTransAPI();
