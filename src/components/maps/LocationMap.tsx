"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { SwamijiLocationClient } from '@/lib/types';

// Fix for default icon path issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationMapProps {
  location: SwamijiLocationClient;
}

export default function LocationMap({ location }: LocationMapProps) {
  if (!location) return null;

  const position: [number, number] = [location.latitude, location.longitude];

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '400px', width: '100%' }} className="rounded-lg shadow-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          {location.address || `Swamiji's current location.`} <br />
          Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
