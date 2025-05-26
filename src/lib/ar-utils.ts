export type LatLng = {
  lat: number;
  lng: number;
};

// TODO: Define appropriate default target location for GuruTracker
export const DEFAULT_TARGET_LATITUDE = 12.3052; // Example: Mysore
export const DEFAULT_TARGET_LONGITUDE = 76.6552; // Example: Mysore

export const TARGET_LOCATION: LatLng = {
  lat: DEFAULT_TARGET_LATITUDE,
  lng: DEFAULT_TARGET_LONGITUDE,
};

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function calculateBearing(userLocation: LatLng, targetLocation: LatLng): number {
  const lat1 = toRadians(userLocation.lat);
  const lon1 = toRadians(userLocation.lng);
  const lat2 = toRadians(targetLocation.lat);
  const lon2 = toRadians(targetLocation.lng);

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const theta = Math.atan2(y, x);
  const bearing = (toDegrees(theta) + 360) % 360; // in degrees
  return bearing;
}

export function calculateDistance(userLocation: LatLng, targetLocation: LatLng): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(targetLocation.lat - userLocation.lat);
  const dLon = toRadians(targetLocation.lng - userLocation.lng);
  const lat1 = toRadians(userLocation.lat);
  const lat2 = toRadians(targetLocation.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // in kilometers
}

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function angleDifference(angle1: number, angle2: number): number {
  const a1 = normalizeAngle(angle1);
  const a2 = normalizeAngle(angle2);
  let diff = a1 - a2;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }
  return diff;
}

export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
} 