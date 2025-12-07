import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates } from '../types';

// Fix leaflet icon issue in React
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const customIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// A different icon for the user
const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapViewProps {
  walletLocation: Coordinates;
  userLocation: Coordinates | null;
  geofenceRadius?: number; // meters
}

export const MapView: React.FC<MapViewProps> = ({ walletLocation, userLocation, geofenceRadius = 50 }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl"></div>;

  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [walletLocation.lat, walletLocation.lng];

  return (
    <div className="h-full w-full relative z-0">
       <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Wallet Marker */}
        <Marker position={[walletLocation.lat, walletLocation.lng]} icon={customIcon}>
          <Popup>
            <div className="text-slate-900 font-bold">SafeWallet</div>
            <div className="text-slate-700">Ultima posizione nota</div>
          </Popup>
        </Marker>

        {/* User Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>Ti trovi qui</Popup>
          </Marker>
        )}

        {/* Geofence Visualization */}
        {geofenceRadius > 0 && (
           <Circle 
            center={[walletLocation.lat, walletLocation.lng]}
            pathOptions={{ fillColor: 'blue', color: 'blue', fillOpacity: 0.1 }}
            radius={geofenceRadius}
          />
        )}
      </MapContainer>
    </div>
  );
};