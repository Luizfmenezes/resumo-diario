// src/components/RealTimeMap.tsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { sptransAPI, Vehicle } from '@/services/sptrans';
import { Card, CardContent } from '@/components/ui/card';
import { Bus, Wifi, WifiOff } from 'lucide-react';

// --- CORREÇÃO: Função para criar ícones dinâmicos ---
// Esta função cria um ícone de autocarro com uma cor específica baseada na direção.
const createBusIcon = (direction: number, prefix: string) => {
  const circleColor = direction === 1 ? '#43ea7c' : '#1b5c2e';
  const boxColor = 'rgba(17,17,17,0.85)'; // preto semi-transparente
  return new L.DivIcon({
    html: `
      <div style="display:flex;align-items:center;height:40px;">
        <div style="
          background:${circleColor};
          border:3px solid #fff; /* borda levemente reduzida */
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
          font-size:12px;
          line-height:1;
          padding:0 10px;
          height:24px;
          display:flex;
          align-items:center;
          border-radius:6px;
          margin-left:-10px; /* um pouco mais à direita */
          position:relative;
          z-index:1;
          box-shadow:0 2px 6px rgba(0,0,0,.18);
        ">
          <span style="position:relative;z-index:2;">${prefix}</span>
          <span style="
            position:absolute;
            left:-12px;
            top:50%;
            transform:translateY(-50%);
            width:0;
            height:0;
            border-top:12px solid transparent;
            border-bottom:12px solid transparent;
            border-right:12px solid ${boxColor};
            z-index:1;
          "></span>
        </div>
      </div>
    `,
    className: 'bus-icon',
    iconSize: [80, 20],
    iconAnchor: [18, 20],
    popupAnchor: [0, -20],
  });
};

// --- Componente Auxiliar para Ajustar o Mapa ---
const MapUpdater: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (vehicles.length > 0) {
        const bounds = new L.LatLngBounds(vehicles.map(v => [v.py, v.px]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [map, vehicles]);

  return null;
};


interface RealTimeMapProps {
  lineCode: string;
}

const RealTimeMap: React.FC<RealTimeMapProps> = ({ lineCode }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);

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

    let isMounted = true;

    const fetchPositions = async () => {
      const data = await sptransAPI.getBusPositions(lineCode);
      
      if (!isMounted) return;

      if (data.length > 0) {
        setVehicles(data);
        setError(null);
      } else if (initialLoad) {
        setError("Nenhum veículo encontrado para esta linha no momento.");
      }
      
      if (initialLoad) {
        setInitialLoad(false);
      }
    };

    fetchPositions();
    const intervalId = setInterval(fetchPositions, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [lineCode, apiReady, initialLoad]);

  if (initialLoad) {
    return (
      <Card className="bg-card shadow-card">
        <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          A procurar veículos da linha {lineCode}...
        </CardContent>
      </Card>
    );
  }
  
  if (error && vehicles.length === 0) {
    return (
      <Card className="bg-card shadow-card border-destructive/20">
        <CardContent className="p-6 text-center text-destructive flex flex-col items-center justify-center h-96">
          <WifiOff className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (vehicles.length === 0) {
      return (
        <Card className="bg-card shadow-card">
            <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-96">
                <Bus className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">Nenhum veículo online</p>
                <p className="text-sm">Não há autocarros a reportar a sua posição para esta linha neste momento.</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="bg-card shadow-card overflow-hidden">
      <div className="relative h-96 w-full">
        <MapContainer center={[-23.5505, -46.6333]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {vehicles.map(vehicle => (
            <Marker
              key={vehicle.p}
              position={[vehicle.py, vehicle.px]}
              icon={createBusIcon(vehicle.sl, vehicle.p)}
            >
              <Popup>
                <b>Autocarro: {vehicle.p}</b><br />
                Sentido: {vehicle.sl === 1 ? 'Terminal Principal' : 'Terminal Secundário'}<br />
                {vehicle.a ? 'Acessível' : 'Não acessível'}.<br />
                Última atualização: {vehicle.ta}.
              </Popup>
            </Marker>
          ))}
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
