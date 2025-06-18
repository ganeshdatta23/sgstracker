export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Parse coordinates from a simple "lat,lng" string
export function parseDirectCoordinates(coordsStr: string): Coordinates | null {
  const parts = coordsStr.split(',').map((s) => s.trim());
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

// Parse coordinates from a Google Maps URL
export function parseGoogleMapsUrl(url: string): Coordinates | null {
  // Pattern 1: @lat,lng in the path
  let match = url.match(/@([-?\d\.]+),([-?\d\.]+)/);
  if (match && match[1] && match[2]) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 2: !3d<lat>!4d<lng> in the path
  match = url.match(/!3d([-?\d\.]+)[^!]*!4d([-?\d\.]+)/);
  if (match && match[1] && match[2]) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // Attempt to parse query parameters if it is a valid URL
  try {
    const urlObj = new URL(url);
    const queryParams = urlObj.searchParams;

    // Pattern 3: q=lat,lng or query=lat,lng
    const qParam = queryParams.get('q') || queryParams.get('query');
    if (qParam) {
      const coords = parseDirectCoordinates(qParam);
      if (coords) return coords;
    }

    // Pattern 4: ll=lat,lng
    const llParam = queryParams.get('ll');
    if (llParam) {
      const coords = parseDirectCoordinates(llParam);
      if (coords) return coords;
    }
  } catch (_) {
    // Not a valid URL structure; ignore
  }

  return null;
}

// Generic parser that accepts either URL or raw coordinates
export function parseUrlOrCoords(input: string): Coordinates | null {
  if (input.trim().startsWith('http')) {
    return parseGoogleMapsUrl(input);
  }
  return parseDirectCoordinates(input);
}

// Calculate initial bearing from (lat1, lon1) to (lat2, lon2)
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  // Convert from radians to degrees and normalize to [0,360)
  return (toDeg(θ) + 360) % 360;
} 