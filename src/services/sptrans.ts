// src/services/sptrans.ts

// --- Tipos de Dados da API ---

export interface Vehicle {
  p: string; // Prefixo do veículo
  a: boolean; // Acessível para pessoas com deficiência
  ta: string; // Horário da última atualização
  py: number; // Latitude
  px: number; // Longitude
}

interface PositionResponse {
  hr: string;
  l: {
    c: string;
    cl: number;
    sl: number;
    lt0: string;
    lt1: string;
    qv: number;
    vs: Vehicle[];
  }[];
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
      const linesFound = await searchResponse.json();
      
      // --- CORREÇÃO: Verifica se a linha foi encontrada ---
      // Se não encontrarmos a linha, retornamos um array vazio imediatamente.
      if (!linesFound || linesFound.length === 0) {
        console.warn(`Nenhuma linha encontrada para o código: ${lineCode}`);
        return [];
      }
      
      const internalLineId = linesFound[0].cl;

      // --- CORREÇÃO: Endpoint correto é /Posicao/Linha ---
      const positionResponse = await fetch(`${API_BASE_URL}/Posicao/Linha?codigoLinha=${internalLineId}`);
      if (!positionResponse.ok) {
        throw new Error('Falha ao buscar a posição dos veículos.');
      }

      const data: PositionResponse = await positionResponse.json();

      let allVehicles: Vehicle[] = [];
      if (data.l && data.l.length > 0) {
        data.l.forEach(lineData => {
            allVehicles = allVehicles.concat(lineData.vs);
        });
      }
      
      return allVehicles;

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
