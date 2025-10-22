import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { sptransAPI, Vehicle } from '@/services/sptrans';
import { Bus, Wifi, WifiOff, Route } from 'lucide-react';

// Cores para diferentes linhas
const lineColors = [
  '#43ea7c', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
  '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'
];

// Função para criar ícones dinâmicos com cores específicas por linha
const createBusIcon = (direction: number, prefix: string, lineIndex: number) => {
  const circleColor = direction === 1 ? lineColors[lineIndex % lineColors.length] : '#1b5c2e';
  const boxColor = 'rgba(17,17,17,0.85)';
  
  return new L.DivIcon({
    html: `
      <div style="display:flex;align-items:center;height:40px;">
        <div style="
          background:${circleColor};
          border:3px solid #fff;
          border-radius:50%;
          width:36px;
          height:36px;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,.18);
          position:relative;
          z-index:2;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/>
            <path d="M16 6v6"/>
            <path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
            <circle cx="7" cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
        <div style="
          background:${boxColor};
          color:#fff;
          font-weight:600;
          font-size:11px;
          line-height:1;
          padding:0 8px;
          height:20px;
          display:flex;
          align-items:center;
          border-radius:4px;
          margin-left:-8px;
          position:relative;
          z-index:1;
          box-shadow:0 2px 6px rgba(0,0,0,.18);
          max-width:80px;
          overflow:hidden;
        ">
          <span style="position:relative;z-index:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${prefix}</span>
          <span style="
            position:absolute;
            left:-10px;
            top:50%;
            transform:translateY(-50%);
            width:0;
            height:0;
            border-top:10px solid transparent;
            border-bottom:10px solid transparent;
            border-right:10px solid ${boxColor};
            z-index:1;
          "></span>
        </div>
      </div>
    `,
    className: 'bus-icon',
    iconSize: [120, 20],
    iconAnchor: [18, 20],
    popupAnchor: [0, -20],
  });
};

// Componente para ajustar o mapa
const MapUpdater: React.FC<{ allVehicles: Vehicle[] }> = ({ allVehicles }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (allVehicles.length > 0) {
        const bounds = new L.LatLngBounds(allVehicles.map(v => [v.py, v.px]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [map, allVehicles]);

  return null;
};

// Função para detectar se é um prefixo (código do veículo) ou linha
const isPrefix = (term: string) => {
  // Prefixos geralmente são números de 4-5 dígitos
  return /^\d{4,5}$/.test(term.trim());
};

interface BusStop {
  coordinates: [number, number];
  name: string;
  address: string;
}

interface RouteData {
  name: string;
  color: string;
  coordinates: [number, number][];
  stops?: BusStop[];
}

interface MultiLineRealTimeMapProps {
  lineCodes: string[];
  showRoutes?: boolean;
  showStops?: boolean;
  lineRoutes?: Record<string, RouteData>;
}

const MultiLineRealTimeMap: React.FC<MultiLineRealTimeMapProps> = ({ 
  lineCodes, 
  showRoutes = false,
  showStops = false,
  lineRoutes = {} 
}) => {
  const [allVehicles, setAllVehicles] = useState<(Vehicle & { lineCode: string; lineIndex: number; searchType: 'line' | 'prefix' })[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState<string>('');

  useEffect(() => {
    sptransAPI.authenticate().then(success => {
      setApiReady(success);
      if (!success) {
        setError("Falha na autenticação com a API da SPTrans.");
        setInitialLoad(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!apiReady) return;
    
    // Se não há códigos selecionados, apenas limpar os veículos
    if (lineCodes.length === 0) {
      setAllVehicles([]);
      setVehicleCount(0);
      setInitialLoad(false);
      return;
    }

    let isMounted = true;

    const fetchAllPositions = async () => {
      try {
        setError(null); // Limpar erro anterior
        setLoadingProgress(''); // Limpar progresso anterior
        const allVehiclesData: (Vehicle & { lineCode: string; lineIndex: number; searchType: 'line' | 'prefix' })[] = [];
        
        // Separar linhas e prefixos
        const lines = lineCodes.filter(code => !isPrefix(code));
        const prefixes = lineCodes.filter(code => isPrefix(code));
        
        console.log('🚌 Iniciando busca:', { lines, prefixes });

        // Buscar veículos por linha (estratégia otimizada)
        if (lines.length > 0) {
          setLoadingProgress(`Carregando ${lines.length} linha${lines.length !== 1 ? 's' : ''}...`);
          console.log('📍 Buscando veículos por linhas...');
          const linePromises = lines.map(async (lineCode, index) => {
            try {
              const vehicles = await sptransAPI.getBusPositions(lineCode);
              console.log(`✅ Linha ${lineCode}: ${vehicles.length} veículos`);
              return vehicles.map(vehicle => ({
                ...vehicle,
                lineCode,
                lineIndex: index,
                searchType: 'line' as const
              }));
            } catch (error) {
              console.error(`❌ Erro na linha ${lineCode}:`, error);
              return [];
            }
          });

          const lineResults = await Promise.all(linePromises);
          allVehiclesData.push(...lineResults.flat());
          setLoadingProgress(`${lines.length} linha${lines.length !== 1 ? 's' : ''} carregada${lines.length !== 1 ? 's' : ''} ✓`);
        }

        // Para prefixos, usar a função otimizada que agora busca dinamicamente
        // todas as linhas quando necessário. Limpar termos antes de enviar.
        if (prefixes.length > 0) {
          const cleaned = prefixes.map(p => String(p).trim()).filter(Boolean);
          setLoadingProgress(`Localizando ${cleaned.length} prefixo${cleaned.length !== 1 ? 's' : ''}...`);
          console.log('🎯 Buscando veículos por prefixos de forma otimizada...', cleaned);

          try {
            const prefixResults = await sptransAPI.findVehiclesByPrefixes(cleaned);

            Object.entries(prefixResults).forEach(([prefix, vehicles], prefixIndex) => {
              if (vehicles && vehicles.length > 0) {
                vehicles.forEach(vehicle => {
                  allVehiclesData.push({
                    ...vehicle,
                    lineCode: (vehicle as any).foundInLine || lines[0] || 'unknown',
                    lineIndex: lines.length + prefixIndex,
                    searchType: 'prefix' as const
                  });
                });
              }
            });

            setLoadingProgress(prev => (prev ? prev + ' ✓' : 'Consulta de prefixos concluída ✓'));
          } catch (error) {
            console.error('❌ Erro na busca otimizada de prefixos:', error);
            setError('Erro ao consultar prefixos. Tente novamente mais tarde.');
          }
        }
        
        if (!isMounted) return;

        // Remover duplicados baseado no prefixo do veículo
        const uniqueVehicles = Array.from(
          new Map(allVehiclesData.map(v => [v.p, v])).values()
        );

        console.log(`📈 Total de veículos únicos encontrados: ${uniqueVehicles.length}`);

        setAllVehicles(uniqueVehicles);
        setVehicleCount(uniqueVehicles.length);
        
        if (uniqueVehicles.length === 0 && initialLoad) {
          setError("Nenhum veículo encontrado para os itens selecionados no momento.");
        } else {
          setError(null);
        }
        
        if (initialLoad) {
          setInitialLoad(false);
        }
      } catch (err) {
        console.error('💥 Erro geral ao buscar posições:', err);
        if (isMounted) {
          setError("Erro ao buscar posições dos veículos. Tentando novamente...");
          setInitialLoad(false);
        }
      }
    };

    fetchAllPositions();
    const intervalId = setInterval(fetchAllPositions, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [lineCodes, apiReady, initialLoad]);

  // Sempre renderizar o mapa, mas mostrar overlays de status quando necessário

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={[-23.5505, -46.6333]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Renderizar rotas das linhas se habilitado */}
        {showRoutes && Object.entries(lineRoutes).map(([lineCode, route]) => {
          // Só mostrar rota se a linha estiver selecionada ou se não há linhas selecionadas
          const shouldShowRoute = lineCodes.length === 0 || lineCodes.includes(lineCode);
          
          if (!shouldShowRoute) return null;
          
          return (
            <Polyline
              key={`route-${lineCode}`}
              positions={route.coordinates}
              pathOptions={{
                color: route.color,
                weight: 4,
                opacity: 0.8
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p><strong>Linha {lineCode}</strong></p>
                  <p>{route.name}</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Renderizar paradas das linhas se habilitado */}
        {showStops && Object.entries(lineRoutes).map(([lineCode, route]) => {
          // Só mostrar paradas se a linha estiver selecionada ou se não há linhas selecionadas
          const shouldShowStops = lineCodes.length === 0 || lineCodes.includes(lineCode);
          
          if (!shouldShowStops || !route.stops) return null;
          
          return route.stops.map((stop, index) => (
            <CircleMarker
              key={`stop-${lineCode}-${index}`}
              center={stop.coordinates}
              pathOptions={{
                color: route.color,
                fillColor: route.color,
                fillOpacity: 0.8,
                weight: 2
              }}
              radius={6}
            >
              <Popup>
                <div className="text-sm">
                  <p><strong>{stop.name}</strong></p>
                  <p className="text-muted-foreground">{stop.address}</p>
                  <p className="text-xs mt-1">
                    <span className="inline-block w-3 h-0.5 rounded mr-1" style={{ backgroundColor: route.color }}></span>
                    Linha {lineCode}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ));
        })}

        {/* Renderizar veículos */}
        {allVehicles.map(vehicle => (
          <Marker
            key={`${vehicle.lineCode}-${vehicle.p}`}
            position={[vehicle.py, vehicle.px]}
            icon={createBusIcon(vehicle.sl, vehicle.p, vehicle.lineIndex)}
          >
            <Popup>
              <div className="text-sm">
                <p><strong>Linha:</strong> {vehicle.lineCode}</p>
                <p><strong>Autocarro:</strong> {vehicle.p}</p>
                {vehicle.searchType === 'prefix' && (
                  <p className="text-xs text-blue-600 font-medium">🎯 Encontrado por prefixo</p>
                )}
                <p><strong>Sentido:</strong> {vehicle.sl === 1 ? 'Terminal Principal' : 'Terminal Secundário'}</p>
                <p><strong>Acessibilidade:</strong> {vehicle.a ? 'Acessível' : 'Não acessível'}</p>
                <p><strong>Última atualização:</strong> {vehicle.ta}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapUpdater allVehicles={allVehicles} />
      </MapContainer>
      
      {/* Overlay de carregamento */}
      {initialLoad && lineCodes.length > 0 && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground font-medium">
              {loadingProgress || (lineCodes.some(code => isPrefix(code)) 
                ? 'A consultar dados de todas as linhas para localizar prefixos...' 
                : 'A procurar veículos das linhas selecionadas...')}
            </p>
            {lineCodes.some(code => isPrefix(code)) && !loadingProgress.includes('✓') && (
              <p className="text-xs text-muted-foreground mt-2">
                Consultando {['1017-10', '1020-10', '1024-10', '1025-10', '1026-10', '8015-10', '8015-21', '8016-10', '848L-10', '9784-10', 'N137-11'].length} linhas...
              </p>
            )}
            {loadingProgress.includes('✓') && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                Processamento concluído!
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay de erro */}
      {error && allVehicles.length === 0 && lineCodes.length > 0 && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="text-center text-destructive">
            <WifiOff className="h-12 w-12 mx-auto mb-3" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}
      
      {/* Status overlay */}
      {lineCodes.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
          <div className="flex items-center gap-2 text-sm">
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="font-medium text-foreground">
              {vehicleCount} veículo{vehicleCount !== 1 ? 's' : ''} online
            </span>
          </div>
          
          {/* Mostrar detalhes do que está sendo monitorado */}
          {(() => {
            const lines = lineCodes.filter(code => !isPrefix(code));
            const prefixes = lineCodes.filter(code => isPrefix(code));
            const prefixVehicles = allVehicles.filter(v => v.searchType === 'prefix');
            
            return (
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {lines.length > 0 && (
                  <p>📋 {lines.length} linha{lines.length !== 1 ? 's' : ''} monitorada{lines.length !== 1 ? 's' : ''}</p>
                )}
                {prefixes.length > 0 && (
                  <p>🎯 {prefixes.length} prefixo{prefixes.length !== 1 ? 's' : ''} ({prefixVehicles.length} encontrado{prefixVehicles.length !== 1 ? 's' : ''})</p>
                )}
                {showRoutes && <p>📍 Rotas visíveis no mapa</p>}
                {showStops && <p>🚏 Paradas visíveis no mapa</p>}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legenda das rotas quando nenhuma linha está selecionada */}
      {showRoutes && lineCodes.length === 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border max-w-xs max-h-96 overflow-y-auto">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
            <Route className="h-3 w-3" />
            Rotas das Linhas
          </h3>
          <div className="space-y-1">
            {Object.entries(lineRoutes).map(([lineCode, route]) => (
              <div key={lineCode} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-0.5 rounded" 
                  style={{ backgroundColor: route.color }}
                ></div>
                <span className="font-medium">{lineCode}</span>
                <span className="text-muted-foreground truncate">{route.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiLineRealTimeMap;