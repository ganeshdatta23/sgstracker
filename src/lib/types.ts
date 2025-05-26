export interface SwamijiLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  googleMapsUrl: string | null;
  created_at: string;
  updated_at: string;
}

export interface SwamijiLocationClient extends Omit<SwamijiLocation, 'created_at' | 'updated_at'> {
  updatedAt: Date; // For client-side use after conversion
}
