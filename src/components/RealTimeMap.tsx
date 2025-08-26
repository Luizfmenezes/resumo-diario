// src/components/RealTimeMap.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { sptransAPI, Vehicle } from '@/services/sptrans';
import { Card, CardContent } from '@/components/ui/card';
import { Bus, Wifi, WifiOff } from 'lucide-react';

// --- Ícone do Autocarro ---
const busIcon = new L.DivIcon({
  html: `
    <div class="bus-icon-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#FFFFFF"/>
        <path d="M2 17l10 5 10-5" stroke="#FFFFFF"/>
        <path d="M2 12l10 5 10-5" stroke="#FFFFFF"/>
      </svg>
    </div>
  `,
  className: 'bus-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// --- Componente Auxiliar para Ajustar o Mapa ---
// Este componente irá aceder à instância do mapa e ajustar o zoom e o centro.
const MapUpdater: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
  const map = useMap();

  useEffect(() => {
    // Força o mapa a recalcular o seu tamanho, corrigindo o problema de renderização.
    map.invalidateSize();

    if (vehicles.length > 0) {
      const bounds = new L.LatLngBounds(vehicles.map(v => [v.py, v.px]));
      map.fitBounds(bounds, { padding: [50, 50] }); // Ajusta o zoom para mostrar todos os autocarros
    }
  }, [map, vehicles]);

  return null;
};


interface RealTimeMapProps {
  lineCode: string;
}

const RealTimeMap: React.FC<RealTimeMapProps> = ({ lineCode }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      const success = await sptransAPI.authenticate();
      setApiReady(success);
      if (!success) {
        setStatus('error');
      }
    };
    authenticate();
  }, []);

  useEffect(() => {
    if (!apiReady) return;

    const fetchPositions = async () => {
      // Define o estado para 'loading' a cada nova busca para dar feedback visual
      setStatus('loading'); 
      const data = await sptransAPI.getBusPositions(lineCode);
      setVehicles(data);
      setStatus(data.length > 0 ? 'success' : 'error');
    };

    fetchPositions();
    const intervalId = setInterval(fetchPositions, 15000);

    return () => clearInterval(intervalId);
  }, [lineCode, apiReady]);

  const initialPosition: [number, number] = [-23.5505, -46.6333];

  if (status === 'loading') {
    return (
      <Card className="bg-card shadow-card">
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          A conectar à API OlhoVivo e a procurar veículos...
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="bg-card shadow-card border-destructive/20">
        <CardContent className="p-6 text-center text-destructive">
          <WifiOff className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">Não foi possível obter a localização dos autocarros.</p>
          <p className="text-sm text-muted-foreground">
            A linha pode não estar em operação ou não foram encontrados veículos neste momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-card overflow-hidden">
      <div className="relative h-96 w-full">
        <MapContainer center={initialPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {vehicles.map(vehicle => (
            <Marker key={vehicle.p} position={[vehicle.py, vehicle.px]} icon={busIcon}>
              <Popup>
                <b>Autocarro: {vehicle.p}</b><br />
                {vehicle.a ? 'Acessível' : 'Não acessível'}.<br />
                Última atualização: {vehicle.ta}.
              </Popup>
            </Marker>
          ))}
          {/* Adiciona o componente que atualiza o mapa */}
          <MapUpdater vehicles={vehicles} />
        </MapContainer>
        <div className="absolute top-2 right-2 z-[1000] bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-foreground">{vehicles.length} veículo(s) online</span>
        </div>
      </div>
    </Card>
  );
};

export default RealTimeMap;
