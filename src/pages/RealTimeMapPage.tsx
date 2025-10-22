import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Map, Search, X, Building2, Route, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MultiLineRealTimeMap from '@/components/MultiLineRealTimeMap';
import ThemeToggle from '@/components/ThemeToggle';
import spencerLogoImage from '@/assets/spencer-logo.png';

const busLines = [
  '1017-10', '1020-10', '1024-10', '1025-10',
  '1026-10', '8015-10', '8015-21', '8016-10', '848L-10', '9784-10', 'N137-11'
];

// Rotas das linhas com coordenadas dos pontos principais
const lineRoutes = {
  '848L-10': {
    name: 'Recanto dos Humildes x Terminal Pirituba',
    color: '#FF6B6B',
    coordinates: [
      [-23.4956, -46.7089] as [number, number], // Terminal Pirituba
      [-23.4845, -46.6978] as [number, number], 
      [-23.4734, -46.6867] as [number, number],
      [-23.4623, -46.6756] as [number, number],
      [-23.4512, -46.6645] as [number, number], // Recanto dos Humildes (aproximado)
    ]
  },
  '1017-10': {
    name: 'Perus x Conexão Vila Íorio',
    color: '#4ECDC4',
    stops: [
      { coordinates: [-23.4012, -46.7456] as [number, number], name: 'Recanto dos Humildes 1', address: 'R. Recanto dos Humildes, 2' },
      { coordinates: [-23.4015, -46.7459] as [number, number], name: 'Recanto dos Humildes 2', address: 'R. Recanto dos Humildes, 85' },
      { coordinates: [-23.4025, -46.7468] as [number, number], name: 'Júlio Maciel', address: 'R. Júlio Maciel, 419' },
      { coordinates: [-23.4032, -46.7474] as [number, number], name: 'Elisa Pedroso', address: 'R. Elisa Pedroso, 45' },
      { coordinates: [-23.4048, -46.7489] as [number, number], name: 'Dr. Sylvio de Campos', address: 'Av. Dr. Sylvio de Campos, 375' },
      { coordinates: [-23.4055, -46.7495] as [number, number], name: 'Viaduto Da. Mora Guimarães', address: 'Viad. Da. Mora Guimarães' },
      { coordinates: [-23.4061, -46.7501] as [number, number], name: 'Fiorelli Peccicacco', address: 'Av. Fiorelli Peccicacco, 889' },
      { coordinates: [-23.4125, -46.7534] as [number, number], name: 'Raimundo Magalhães 1', address: 'Av. Raimundo P. de Magalhães, 13656' },
      { coordinates: [-23.4145, -46.7548] as [number, number], name: 'Raimundo Magalhães 2', address: 'Av. Raimundo P. de Magalhães, 14305' },
      { coordinates: [-23.4085, -46.7505] as [number, number], name: 'Dep. Cantidio Sampaio', address: 'Av. Dep. Cantidio Sampaio, 7763' },
      { coordinates: [-23.4278, -46.7425] as [number, number], name: 'Elísio Teixeira Leite 1', address: 'Av. Elísio Teixeira Leite, 7508' },
      { coordinates: [-23.4315, -46.7388] as [number, number], name: 'Elísio Teixeira Leite 2', address: 'Av. Elísio Teixeira Leite, 6703' },
      { coordinates: [-23.4345, -46.7358] as [number, number], name: 'Elísio Teixeira Leite 3', address: 'Av. Elísio Teixeira Leite, 6159' },
      { coordinates: [-23.4385, -46.7318] as [number, number], name: 'Elísio Teixeira Leite 4', address: 'Av. Elísio Teixeira Leite, 5039' },
      { coordinates: [-23.4408, -46.7295] as [number, number], name: 'Elísio Teixeira Leite 5', address: 'Av. Elísio Teixeira Leite, 4477' },
      { coordinates: [-23.4435, -46.7268] as [number, number], name: 'Prof. José Lourenço 1', address: 'R. Prof. José Lourenço, 985' },
      { coordinates: [-23.4455, -46.7248] as [number, number], name: 'Prof. José Lourenço 2', address: 'R. Prof. José Lourenço, 677' },
      { coordinates: [-23.4475, -46.7228] as [number, number], name: 'Prof. José Lourenço 3', address: 'R. Prof. José Lourenço, 129' },
      { coordinates: [-23.4485, -46.7218] as [number, number], name: 'Pça. 25 de Novembro', address: 'Pça. Vinte e Cinco de Novembro, 206' },
      { coordinates: [-23.4495, -46.7208] as [number, number], name: 'Dr. Joy Arruda', address: 'R. Doutor Joy Arruda, 279' },
      { coordinates: [-23.4505, -46.7198] as [number, number], name: 'Dr. João Toniolo', address: 'R. Dr. João Toniolo, 49' },
      { coordinates: [-23.4508, -46.7195] as [number, number], name: 'Dr. Edmundo Bitencourt', address: 'R. Dr. Edmundo Bitencourt, 199' },
      { coordinates: [-23.4515, -46.7188] as [number, number], name: 'Adele Zarzur', address: 'R. Adele Zarzur, 421' },
      { coordinates: [-23.4518, -46.7185] as [number, number], name: 'Praça Monsenhor Escriva', address: 'Praça Monsenhor Escriva' },
    ],
    coordinates: [
      // Início - Recanto dos Humildes
      [-23.4012, -46.7456] as [number, number], // R. Recanto dos Humildes, 2
      [-23.4015, -46.7459] as [number, number], // R. Recanto dos Humildes, 85
      [-23.4018, -46.7462] as [number, number], // R. Recanto dos Humildes, 8
      [-23.4021, -46.7465] as [number, number], // R. Recanto dos Humildes, 9
      [-23.4025, -46.7468] as [number, number], // R. Júlio Maciel, 419
      [-23.4028, -46.7471] as [number, number], // R. Júlio Maciel, 55
      [-23.4032, -46.7474] as [number, number], // R. Elisa Pedroso, 45
      [-23.4035, -46.7477] as [number, number], // R. Elisa Pedroso, 168
      [-23.4038, -46.7480] as [number, number], // R. Joaquim Xavier Pinheiro, 7
      [-23.4042, -46.7483] as [number, number], // Estr. S. Paulo/Jundiaí, 20
      [-23.4045, -46.7486] as [number, number], // R. Mogeiro, 136
      
      // Av. Dr. Sylvio de Campos
      [-23.4048, -46.7489] as [number, number], // Av. Dr. Sylvio de Campos, 375
      [-23.4051, -46.7492] as [number, number], // Av. Dr. Sylvio de Campos, 191
      [-23.4055, -46.7495] as [number, number], // Viad. Da. Mora Guimarães
      
      // Av. Comendador Fiorelli Peccicacco
      [-23.4058, -46.7498] as [number, number], // Avenida Comendador Fiorelli Peccicacco
      [-23.4061, -46.7501] as [number, number], // Avenida Fiorelli Peccicacco,889
      [-23.4065, -46.7504] as [number, number], // Avenida Fiorello Peccicacco 723
      
      // Av. Raimundo Pereira de Magalhães - principal corredor
      [-23.4068, -46.7507] as [number, number], // Avenida Raimundo Pereira de Magalhães
      [-23.4125, -46.7534] as [number, number], // Av. Raimundo Pereira de Magalhães, 13656
      [-23.4145, -46.7548] as [number, number], // Av. Raimundo Pereira de Magalhães, 14305
      [-23.4128, -46.7536] as [number, number], // Av. Raimundo Pereira de Magalhães, 13658
      [-23.4115, -46.7525] as [number, number], // Av. Raimundo Pereira de Magalhães, 13271
      [-23.4105, -46.7518] as [number, number], // Av. Raimundo Pereira de Magalhães, 13051
      [-23.4095, -46.7512] as [number, number], // Av. Raimundo Pereira de Magalhães 12495
      [-23.4085, -46.7505] as [number, number], // Av. Dep. Cantidio Sampaio, 7763
      
      // Av. Elísio Teixeira Leite - longo trecho
      [-23.4278, -46.7425] as [number, number], // Av. Elísio Teixeira Leite, 7508
      [-23.4285, -46.7418] as [number, number], // Avenida Elísio Teixeira Leite, 7380
      [-23.4288, -46.7415] as [number, number], // Avenida Elísio Teixeira Leite, 7367
      [-23.4295, -46.7408] as [number, number], // Avenida Elísio Teixeira Leite, 7189
      [-23.4315, -46.7388] as [number, number], // Av. Elísio Teixeira Leite, 6703
      [-23.4325, -46.7378] as [number, number], // Av. Elísio Teixeira Leite, 6537
      [-23.4345, -46.7358] as [number, number], // Av. Elísio Teixeira Leite, 6159
      [-23.4335, -46.7368] as [number, number], // Av. Elísio Teixeira Leite, 6405
      [-23.4365, -46.7338] as [number, number], // Av. Elísio Teixeira Leite, 5597
      [-23.4355, -46.7348] as [number, number], // Av. Elísio Teixeira Leite, 5745
      [-23.4385, -46.7318] as [number, number], // Av. Elísio Teixeira Leite, 5039
      [-23.4395, -46.7308] as [number, number], // Av. Elísio Teixeira Leite, 4811
      [-23.4408, -46.7295] as [number, number], // Av. Elísio Teixeira Leite, 4477
      [-23.4418, -46.7285] as [number, number], // Av. Elísio Teixeira Leite
      
      // Chegada na região central de Pirituba
      [-23.4425, -46.7278] as [number, number], // R. Cinco, 33
      [-23.4435, -46.7268] as [number, number], // R. Prof. José Lourenço, 985
      [-23.4445, -46.7258] as [number, number], // R. Prof. José Lourenço, 841
      [-23.4455, -46.7248] as [number, number], // R. Prof. José Lourenço, 677
      [-23.4465, -46.7238] as [number, number], // R. Prof. José Lourenço, 487
      [-23.4475, -46.7228] as [number, number], // R. Prof. José Lourenço, 129
      
      // Praça central
      [-23.4485, -46.7218] as [number, number], // Pça. Vinte e Cinco de Novembro, 206
      [-23.4488, -46.7215] as [number, number], // Pça. Vinte e Cinco de Novembro, 560
      
      // Final do percurso
      [-23.4495, -46.7208] as [number, number], // Rua Doutor Joy Arruda,279
      [-23.4498, -46.7205] as [number, number], // Rua Doutor Joy Arruda 131
      [-23.4505, -46.7198] as [number, number], // R. Dr. João Toniolo, 49
      [-23.4508, -46.7195] as [number, number], // R. Dr. Edmundo Bitencourt, 199
      [-23.4512, -46.7191] as [number, number], // R. Dr. Edmundo Bitencourt, 27
      [-23.4515, -46.7188] as [number, number], // R. Adele Zarzur, 421
      [-23.4518, -46.7185] as [number, number], // Praça Monsenhor Escriva - Conexão Vila Íorio
    ]
  },
  '1020-10': {
    name: 'Perus x Conexão Vila Íorio',
    color: '#45B7D1',
    coordinates: [
      [-23.3978, -46.7489] as [number, number], // Perus
      [-23.4056, -46.7356] as [number, number],
      [-23.4134, -46.7223] as [number, number],
      [-23.4212, -46.7090] as [number, number],
      [-23.4290, -46.6957] as [number, number],
      [-23.4533, -46.6934] as [number, number], // Conexão Vila Íorio (aproximado)
    ]
  },
  '1024-10': {
    name: 'Jardim Carumbé x Conexão Petrônio Portela',
    color: '#96CEB4',
    coordinates: [
      [-23.4645, -46.6823] as [number, number], // Jardim Carumbé (aproximado)
      [-23.4567, -46.6745] as [number, number],
      [-23.4489, -46.6667] as [number, number],
      [-23.4411, -46.6589] as [number, number],
      [-23.4333, -46.6511] as [number, number],
      [-23.4255, -46.6433] as [number, number], // Conexão Petrônio Portela (aproximado)
    ]
  },
  '1025-10': {
    name: 'Jardim Carumbé x Conexão Petrônio Portela',
    color: '#FECA57',
    coordinates: [
      [-23.4645, -46.6823] as [number, number], // Jardim Carumbé (aproximado)
      [-23.4578, -46.6778] as [number, number],
      [-23.4511, -46.6733] as [number, number],
      [-23.4444, -46.6688] as [number, number],
      [-23.4377, -46.6643] as [number, number],
      [-23.4255, -46.6433] as [number, number], // Conexão Petrônio Portela (aproximado)
    ]
  },
  '1026-10': {
    name: 'Vila Iara x Conexão Petrônio Portela',
    color: '#FF9FF3',
    coordinates: [
      [-23.4789, -46.6567] as [number, number], // Vila Iara (aproximado)
      [-23.4711, -46.6511] as [number, number],
      [-23.4633, -46.6455] as [number, number],
      [-23.4555, -46.6399] as [number, number],
      [-23.4477, -46.6343] as [number, number],
      [-23.4255, -46.6433] as [number, number], // Conexão Petrônio Portela (aproximado)
    ]
  },
  '8015-10': {
    name: 'Cemitério de Perus x Terminal Pirituba',
    color: '#54A0FF',
    coordinates: [
      [-23.3889, -46.7600] as [number, number], // Cemitério de Perus (aproximado)
      [-23.4022, -46.7467] as [number, number],
      [-23.4155, -46.7334] as [number, number],
      [-23.4288, -46.7201] as [number, number],
      [-23.4421, -46.7068] as [number, number],
      [-23.4956, -46.7089] as [number, number], // Terminal Pirituba
    ]
  },
  '8015-21': {
    name: 'Cemitério de Perus x Terminal Pirituba (Expresso)',
    color: '#5F27CD',
    coordinates: [
      [-23.3889, -46.7600] as [number, number], // Cemitério de Perus (aproximado)
      [-23.4156, -46.7356] as [number, number], // Rota expressa - menos paradas
      [-23.4423, -46.7112] as [number, number],
      [-23.4956, -46.7089] as [number, number], // Terminal Pirituba
    ]
  },
  '8016-10': {
    name: 'Jardim Rincão x Terminal Pirituba',
    color: '#00D2D3',
    coordinates: [
      [-23.5234, -46.6956] as [number, number], // Jardim Rincão (aproximado)
      [-23.5156, -46.6934] as [number, number],
      [-23.5078, -46.6912] as [number, number],
      [-23.5000, -46.6890] as [number, number],
      [-23.4922, -46.6868] as [number, number],
      [-23.4956, -46.7089] as [number, number], // Terminal Pirituba
    ]
  },
  '9784-10': {
    name: 'Jardim Dos Francos x Metrô Barra Funda',
    color: '#FD79A8',
    coordinates: [
      [-23.4678, -46.6234] as [number, number], // Jardim Dos Francos (aproximado)
      [-23.4756, -46.6312] as [number, number],
      [-23.4834, -46.6390] as [number, number],
      [-23.4912, -46.6468] as [number, number],
      [-23.4990, -46.6546] as [number, number],
      [-23.5268, -46.6658] as [number, number], // Metrô Barra Funda
    ]
  },
  'N137-11': {
    name: 'Linha Noturna Centro',
    color: '#A29BFE',
    coordinates: [
      [-23.5505, -46.6333] as [number, number], // Centro (Sé)
      [-23.5456, -46.6389] as [number, number], // República
      [-23.5398, -46.6456] as [number, number], // Consolação
      [-23.5341, -46.6523] as [number, number], // Higienópolis
      [-23.5505, -46.6333] as [number, number], // Centro (volta)
    ]
  }
};



// Função para detectar se é um prefixo (código do veículo) ou linha
const isPrefix = (term: string) => {
  // Prefixos geralmente são números de 4-5 dígitos
  return /^\d{4,5}$/.test(term.trim());
};

const RealTimeMapPage = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<{item: string, type: 'line' | 'prefix'}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSpencerD1, setShowSpencerD1] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showStops, setShowStops] = useState(false);
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.trim();
      const results: {item: string, type: 'line' | 'prefix'}[] = [];
      
      // Pesquisar por linhas
      const lineResults = busLines.filter(line =>
        line.toLowerCase().includes(term.toLowerCase()) &&
        !selectedItems.includes(line)
      ).map(line => ({ item: line, type: 'line' as const }));
      
      results.push(...lineResults);
      
      // Se parece com um prefixo, adicionar como opção de prefixo
      if (isPrefix(term)) {
        results.push({ item: term, type: 'prefix' });
      }
      
      setFilteredItems(results);
      setShowSuggestions(true);
    } else {
      setFilteredItems([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, selectedItems]);

  const handleAddItem = (item: string) => {
    if (!selectedItems.includes(item)) {
      // Se está no modo Spencer D1, desativar o filtro ao adicionar item manual
      if (showSpencerD1) {
        setShowSpencerD1(false);
        setSelectedItems([item]);
      } else {
        setSelectedItems([...selectedItems, item]);
      }
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveItem = (item: string) => {
    const newItems = selectedItems.filter(i => i !== item);
    setSelectedItems(newItems);
    
    // Se estava no modo Spencer D1 e removeu um item, desativar o filtro
    if (showSpencerD1 && newItems.length < busLines.length) {
      setShowSpencerD1(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredItems.length > 0) {
      handleAddItem(filteredItems[0].item);
    }
  };

  const handleSpencerD1Filter = () => {
    if (showSpencerD1) {
      // Desativar filtro completamente - limpar seleção
      setSelectedItems([]);
      setShowSpencerD1(false);
    } else {
      // Ativar filtro - selecionar todas as linhas Spencer D1
      setSelectedItems([...busLines]);
      setShowSpencerD1(true);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading || !profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground ml-4">A carregar dados do perfil...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header fixo no topo */}
      <header className="bg-card/95 backdrop-blur-sm shadow-lg border-b border-border z-50 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="h-8 w-8 sm:h-10 sm:w-10">
              <img
                src={spencerLogoImage}
                alt="Spencer Transportes"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Map className="h-4 w-4" />
                Mapa Tempo Real
              </h1>
            </div>
          </div>

          {/* Área de pesquisa central */}
          <div className="flex-1 max-w-md mx-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar linhas (ex: 1017-10) ou prefixos (ex: 12345)..."
                className="pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
            </div>

            {/* Sugestões de pesquisa */}
            {showSuggestions && filteredItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredItems.map((suggestion) => (
                  <button
                    key={`${suggestion.type}-${suggestion.item}`}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                    onClick={() => handleAddItem(suggestion.item)}
                  >
                    {suggestion.type === 'line' ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>Linha {suggestion.item}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>Prefixo {suggestion.item}</span>
                        <small className="text-muted-foreground">(busca em todas as linhas)</small>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={showSpencerD1 ? "default" : "outline"}
              size="sm"
              onClick={handleSpencerD1Filter}
              className="flex items-center gap-1 text-xs"
            >
              <Building2 className="h-3 w-3" />
              <span className="hidden sm:inline">Spencer D1</span>
            </Button>
            <Button
              variant={showRoutes ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRoutes(!showRoutes)}
              className="flex items-center gap-1 text-xs"
            >
              <Route className="h-3 w-3" />
              <span className="hidden sm:inline">Rotas</span>
            </Button>
            <Button
              variant={showStops ? "default" : "outline"}
              size="sm"
              onClick={() => setShowStops(!showStops)}
              className="flex items-center gap-1 text-xs"
            >
              <MapPin className="h-3 w-3" />
              <span className="hidden sm:inline">Paradas</span>
            </Button>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-foreground">{profile.username}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Badges das linhas selecionadas */}
        {selectedItems.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {showSpencerD1 && (
              <Badge variant="default" className="flex items-center gap-1 px-2 py-1 bg-primary">
                <Building2 className="h-3 w-3" />
                <span className="text-xs">Spencer D1 - Todas as Linhas</span>
                <button
                  onClick={() => {
                    setShowSpencerD1(false);
                    setSelectedItems([]);
                  }}
                  className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {!showSpencerD1 && selectedItems.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                <span className="text-xs">
                  {isPrefix(item) ? `Prefixo ${item}` : `Linha ${item}`}
                </span>
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Mapa em tela cheia */}
      <main className="flex-1 relative">
        <div className="h-full w-full">
          <MultiLineRealTimeMap 
            lineCodes={selectedItems} 
            showRoutes={showRoutes}
            showStops={showStops}
            lineRoutes={lineRoutes}
          />
        </div>
        
        {/* Overlay quando nenhuma linha selecionada */}
        {selectedItems.length === 0 && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
            <div className="text-center">
              <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma linha selecionada</h2>
              <p className="text-muted-foreground">Pesquise e selecione linhas para visualizar no mapa</p>
            </div>
          </div>
        )}

        {/* Contador de veículos - overlay no mapa */}
        {selectedItems.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
            <div className="text-sm">
              {showSpencerD1 ? (
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Spencer D1 - Todas as {busLines.length} linhas
                </p>
              ) : (
                <p className="font-medium text-foreground">
                  {selectedItems.filter(item => !isPrefix(item)).length > 0 && 
                    `${selectedItems.filter(item => !isPrefix(item)).length} linha${selectedItems.filter(item => !isPrefix(item)).length !== 1 ? 's' : ''}`}
                  {selectedItems.filter(item => !isPrefix(item)).length > 0 && selectedItems.filter(item => isPrefix(item)).length > 0 && ', '}
                  {selectedItems.filter(item => isPrefix(item)).length > 0 && 
                    `${selectedItems.filter(item => isPrefix(item)).length} prefixo${selectedItems.filter(item => isPrefix(item)).length !== 1 ? 's' : ''}`}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Atualização automática a cada 15s
                {showRoutes && ' • Rotas visíveis'}
                {showStops && ' • Paradas visíveis'}
              </p>
            </div>
          </div>
        )}
      </main>


    </div>
  );
};

export default RealTimeMapPage;