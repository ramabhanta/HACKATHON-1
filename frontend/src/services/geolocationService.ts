export interface DetectedLocation {
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  village: string;
  taluk?: string;
  district: string;
  state: string;
  pincode: string;
  displayName: string;
  formatted: string;
  timestamp: number;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'GEOCODE_FAILED';
  message: string;
}

const STORAGE_KEY = 'user_location';

/**
 * Retrieves cached GPS location from localStorage if available
 */
export function getCachedLocation(): DetectedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const latitude = typeof data.latitude === 'number' ? data.latitude : data.lat;
    const longitude = typeof data.longitude === 'number' ? data.longitude : data.lng;
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return {
        ...data,
        latitude,
        longitude,
        lat: latitude,
        lng: longitude
      };
    }
  } catch (err) {
    console.warn('⚠️ [GeolocationService] Failed to parse cached location:', err);
  }
  return null;
}

/**
 * Saves detected GPS location to localStorage
 */
export function saveCachedLocation(location: DetectedLocation): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch (err) {
    console.warn('⚠️ [GeolocationService] Failed to cache location:', err);
  }
}

/**
 * Wraps browser navigator.geolocation.getCurrentPosition with Promise and robust error mapping
 */
export function getCurrentCoordinates(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject({
        code: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by your browser.'
      } as GeolocationError);
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      error => {
        let code: GeolocationError['code'] = 'GEOCODE_FAILED';
        let message = 'Unable to retrieve location coordinates.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            code = 'PERMISSION_DENIED';
            message = 'Location access denied. Please select or type your district/village manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            code = 'POSITION_UNAVAILABLE';
            message = 'Location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            code = 'TIMEOUT';
            message = 'GPS location request timed out. Please try again or enter location manually.';
            break;
        }

        reject({ code, message } as GeolocationError);
      },
      options
    );
  });
}

/**
 * Reverse geocodes coordinates (lat, lon) into Indian administrative boundaries
 * Prioritizes backend proxy /api/geo/reverse, with fallback to OpenStreetMap Nominatim
 */
export async function reverseGeocode(lat: number, lon: number): Promise<DetectedLocation> {
  // 1. Try Backend API Proxy first (handles OSM User-Agent and headers reliably)
  try {
    const res = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.location) {
        const loc: DetectedLocation = {
          ...data.location,
          latitude: data.location.latitude ?? lat,
          longitude: data.location.longitude ?? lon,
          lat: data.location.latitude ?? lat,
          lng: data.location.longitude ?? lon,
          timestamp: Date.now()
        };
        saveCachedLocation(loc);
        return loc;
      }
    }
  } catch (backendErr) {
    console.warn('⚠️ [GeolocationService] Backend reverse geocode route unavailable, attempting direct Nominatim fallback:', backendErr);
  }

  // 2. Direct browser fallback to OpenStreetMap Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const village =
        addr.village ||
        addr.town ||
        addr.hamlet ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.city_district ||
        addr.city ||
        'Kadiri Rural';

      const taluk =
        addr.county ||
        addr.subdistrict ||
        addr.state_district ||
        addr.town ||
        'Kadiri';

      const district =
        addr.state_district ||
        addr.district ||
        addr.county ||
        addr.city ||
        'Sri Sathya Sai';

      const state = addr.state || 'Andhra Pradesh';
      const pincode = addr.postcode || '515591';
      const displayName = data.display_name || `${village}, ${district}`;

      const loc: DetectedLocation = {
        latitude: lat,
        longitude: lon,
        lat,
        lng: lon,
        village,
        taluk,
        district,
        state,
        pincode,
        displayName,
        formatted: `${village}, ${district}`,
        timestamp: Date.now()
      };

      saveCachedLocation(loc);
      return loc;
    }
  } catch (clientErr) {
    console.warn('⚠️ [GeolocationService] Direct Nominatim fetch failed:', clientErr);
  }

  // 3. Fallback based on coordinate boundary
  const isKarnataka = lat >= 11.5 && lat <= 18.5 && lon >= 74.0 && lon <= 78.5;
  const village = isKarnataka ? 'Chikkaballapur Rural' : 'Kadiri Rural';
  const district = isKarnataka ? 'Chikkaballapur' : 'Sri Sathya Sai';
  const state = isKarnataka ? 'Karnataka' : 'Andhra Pradesh';
  const pincode = isKarnataka ? '562101' : '515591';

  const fallbackLoc: DetectedLocation = {
    latitude: lat,
    longitude: lon,
    lat,
    lng: lon,
    village,
    taluk: village.replace(' Rural', ''),
    district,
    state,
    pincode,
    displayName: `${village}, ${district}, ${state}`,
    formatted: `${village}, ${district}`,
    timestamp: Date.now()
  };

  saveCachedLocation(fallbackLoc);
  return fallbackLoc;
}

/**
 * One-tap autonomous location detector:
 * Triggers GPS, performs reverse geocoding, caches result and returns structured location
 */
export async function detectLocation(): Promise<DetectedLocation> {
  const coords = await getCurrentCoordinates();
  return await reverseGeocode(coords.latitude, coords.longitude);
}
