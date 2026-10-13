/**
 * routingService.js
 * 
 * Service for calculating road-following routes between bus stops using OSRM
 * (Open Source Routing Machine).
 * 
 * Features:
 * - Sorts stops by defined order
 * - Validates coordinate sanity (skips missing/invalid coords)
 * - Converts between Leaflet [lat, lon] and OSRM [lon, lat] formats
 * - In-memory LRU/Map caching to prevent redundant API calls
 * - Handles timeouts, NoRoute, and network errors gracefully
 */

import { normalizeDirection, getDirectionAwareStops } from '../utils/routeDirection';

const OSRM_BASE_URL = (
  import.meta.env.VITE_OSRM_API_URL || 'https://router.project-osrm.org'
).replace(/\/+$/, '');

// In-memory cache to store previously calculated routes
// Key: formatted string of coordinates (lon1,lat1;lon2,lat2;...)
// Value: { success: true, coordinates, distance, duration }
const routeCache = new Map();
const MAX_CACHE_SIZE = 50;

/**
 * Normalizes and validates a stop coordinate object.
 * Supports both `longtitude` (from database schema typo) and standard `longitude`.
 *
 * @param {object|array} stop - Stop object or [lat, lng] array
 * @returns {{ lat: number, lng: number, order: number } | null}
 */
export const normalizeStop = (stop, index = 0) => {
  if (!stop) return null;

  let lat, lng, order;

  if (Array.isArray(stop)) {
    [lat, lng] = stop;
    order = index;
  } else {
    lat = stop.latitude;
    lng = stop.longtitude ?? stop.longitude;
    order = stop.order ?? index;
  }

  const numLat = Number(lat);
  const numLng = Number(lng);
  const numOrder = Number(order) || 0;

  // Validate numeric bounds
  if (
    isNaN(numLat) ||
    isNaN(numLng) ||
    numLat < -90 ||
    numLat > 90 ||
    numLng < -180 ||
    numLng > 180 ||
    (numLat === 0 && numLng === 0)
  ) {
    return null;
  }

  return {
    lat: numLat,
    lng: numLng,
    order: numOrder,
    name: stop.stopName || stop.name || `Stop ${index + 1}`,
    id: stop._id || stop.id || index,
  };
};

/**
 * Requests a road-following route from OSRM for an ordered list of bus stops.
 * 
 * @param {Array<object>} rawStops - Array of stop objects
 * @param {object} options - Optional configuration { timeoutMs: number, profile: string, direction: string, preserveOrder: boolean }
 * @returns {Promise<{
 *   success: boolean,
 *   coordinates?: Array<[number, number]>, // Leaflet format: [lat, lng]
 *   distance?: number,                    // Route distance in meters
 *   duration?: number,                    // Route travel time in seconds
 *   error?: string,
 *   code?: string,
 *   isFallback?: boolean
 * }>}
 */
export const getRoadRoute = async (rawStops = [], options = {}) => {
  const {
    timeoutMs = 8000,
    profile = 'driving',
    direction = 'OUTBOUND',
    preserveOrder = false,
  } = options;

  const normDirection = normalizeDirection(direction);

  try {
    // 1. Order stops respecting direction unless preserveOrder is explicitly requested
    const stopsToProcess = preserveOrder
      ? rawStops
      : getDirectionAwareStops(rawStops, normDirection);

    // 2. Filter, sanitize, and validate stops
    const validStops = (stopsToProcess || [])
      .map((s, idx) => normalizeStop(s, idx))
      .filter(Boolean);

    if (validStops.length < 2) {
      return {
        success: false,
        error: 'At least 2 valid stops with coordinates are required to calculate a road route.',
        code: 'INSUFFICIENT_STOPS',
      };
    }

    // 3. Format coordinates in OSRM requirement: longitude,latitude separated by semicolons
    // Example: 72.82138,21.22402;72.83150,21.23100
    const osrmCoords = validStops
      .map((s) => `${s.lng.toFixed(6)},${s.lat.toFixed(6)}`)
      .join(';');

    // 4. Check cache first with direction-specific key
    const cacheKey = `${profile}:${normDirection}:${osrmCoords}`;
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey);
    }

    // 5. Build OSRM request URL
    // driving profile, geometries=geojson, overview=full, steps=false
    const url = `${OSRM_BASE_URL}/route/v1/${profile}/${osrmCoords}?overview=full&geometries=geojson&steps=false`;

    // 6. Execute fetch with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `OSRM routing service responded with status ${response.status} (${response.statusText}).`,
        code: `HTTP_${response.status}`,
      };
    }

    const data = await response.json();

    // 7. Verify response code
    if (data.code === 'NoRoute') {
      return {
        success: false,
        error: 'No navigable road route found between the given stops.',
        code: 'NoRoute',
      };
    }

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return {
        success: false,
        error: data.message || 'OSRM failed to find a valid route.',
        code: data.code || 'ROUTING_FAILED',
      };
    }

    const primaryRoute = data.routes[0];
    const geoJsonCoordinates = primaryRoute?.geometry?.coordinates; // Array of [lon, lat]

    if (!Array.isArray(geoJsonCoordinates) || geoJsonCoordinates.length === 0) {
      return {
        success: false,
        error: 'Routing engine returned empty geometry.',
        code: 'EMPTY_GEOMETRY',
      };
    }

    // 8. Convert GeoJSON [lon, lat] into Leaflet [lat, lon]
    const leafletCoordinates = geoJsonCoordinates.map(([lon, lat]) => [lat, lon]);

    const result = {
      success: true,
      coordinates: leafletCoordinates,
      distance: primaryRoute.distance, // meters
      duration: primaryRoute.duration, // seconds
      code: 'Ok',
    };

    // Cache result with bounded cache size
    if (routeCache.size >= MAX_CACHE_SIZE) {
      const firstKey = routeCache.keys().next().value;
      routeCache.delete(firstKey);
    }
    routeCache.set(cacheKey, result);

    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'OSRM routing request timed out. Please check your internet connection.',
        code: 'TIMEOUT',
      };
    }

    return {
      success: false,
      error: err.message || 'Network error while contacting the OSRM routing engine.',
      code: 'NETWORK_ERROR',
    };
  }
};

/**
 * Clears the in-memory route cache (useful for testing or cache refresh).
 */
export const clearRouteCache = () => {
  routeCache.clear();
};

export default {
  getRoadRoute,
  normalizeStop,
  clearRouteCache,
};
