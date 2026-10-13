/**
 * Shared utility for route direction handling across Admin, Driver, and Student portals.
 *
 * Source of truth: Trip.direction / BusSchedule.direction ('OUTBOUND' | 'RETURN')
 * Canonical route stops in database remain strictly ordered 1..N.
 * Direction determines traversal & visual display ordering.
 */

/**
 * Normalizes direction string to 'RETURN' or 'OUTBOUND'
 * @param {string|null|undefined} direction
 * @returns {'RETURN'|'OUTBOUND'}
 */
export const normalizeDirection = (direction) => {
  return String(direction || '').toUpperCase() === 'RETURN' ? 'RETURN' : 'OUTBOUND';
};

/**
 * Returns stops arranged in traversal order for the given direction.
 * OUTBOUND: canonical stop 1 -> stop N
 * RETURN: terminal stop N -> stop 1
 *
 * @param {Array} stops - Array of route stops (can be RouteStop objects or normalized stop objects)
 * @param {string} direction - 'OUTBOUND' or 'RETURN'
 * @returns {Array} Traversal ordered stops
 */
export const getDirectionAwareStops = (stops = [], direction = 'OUTBOUND') => {
  if (!Array.isArray(stops) || stops.length === 0) return [];
  const sorted = [...stops].sort((a, b) => {
    const orderA = a?.order ?? a?.stopOrder ?? 0;
    const orderB = b?.order ?? b?.stopOrder ?? 0;
    return orderA - orderB;
  });
  return normalizeDirection(direction) === 'RETURN' ? [...sorted].reverse() : sorted;
};

/**
 * Shared route traversal alias as specified by Driver architecture.
 * OUTBOUND: [A, B, C, D]
 * RETURN: [D, C, B, A]
 *
 * @param {Array} routeStops
 * @param {string} direction
 * @returns {Array} Traversal ordered stops
 */
export const getTripOrderedStops = (routeStops = [], direction = 'OUTBOUND') => {
  return getDirectionAwareStops(routeStops, direction);
};

/**
 * Extracts a human-readable stop name from various stop object representations.
 *
 * @param {Object|null|undefined} stopItem
 * @returns {string} Stop name or '—'
 */
export const getStopName = (stopItem) => {
  if (!stopItem) return '—';
  return (
    stopItem?.stop?.stopName ||
    stopItem?.stop?.name ||
    stopItem?.stopName ||
    stopItem?.name ||
    '—'
  );
};

/**
 * Generates human-readable route summary "Start Stop → End Stop" respecting direction.
 * Matches Driver portal summary format.
 *
 * @param {string} direction - 'OUTBOUND' or 'RETURN'
 * @param {Array} stops - Canonical or raw stops
 * @returns {string} e.g. "Valinath Chowk → P P Savani Gate" or "P P Savani Gate → Valinath Chowk"
 */
export const getRouteSummary = (direction, stops = []) => {
  if (!Array.isArray(stops) || stops.length === 0) return 'Route not assigned';
  const canonical = [...stops].sort((a, b) => {
    const orderA = a?.order ?? a?.stopOrder ?? 0;
    const orderB = b?.order ?? b?.stopOrder ?? 0;
    return orderA - orderB;
  });
  const first = getStopName(canonical[0]) || 'Origin';
  const last = getStopName(canonical[canonical.length - 1]) || 'Destination';
  return normalizeDirection(direction) === 'RETURN' ? `${last} → ${first}` : `${first} → ${last}`;
};

/**
 * Returns direction-aware route start and end stops.
 *
 * @param {Array} stops
 * @param {string} direction
 * @returns {{ origin: Object|null, destination: Object|null }}
 */
export const getRouteTerminals = (stops = [], direction = 'OUTBOUND') => {
  const traversalStops = getDirectionAwareStops(stops, direction);
  if (!traversalStops.length) return { origin: null, destination: null };
  const origin = traversalStops[0]?.stop || traversalStops[0];
  const destination = traversalStops[traversalStops.length - 1]?.stop || traversalStops[traversalStops.length - 1];
  return { origin, destination };
};

/**
 * Calculates student pickup stop status along direction-aware ordered stops traversal.
 * Handles OUTBOUND & RETURN seamlessly without confusing current bus stop with pickup stop.
 *
 * @param {Object} params
 * @param {Array} params.orderedStops - Direction-aware route stops traversal
 * @param {string|number|null} params.preferredStopId - Student's pickup stop ID
 * @param {string|number|null} params.currentStopId - Current bus stop ID from telemetry
 * @param {boolean} [params.isCompleted=false] - Whether trip has ended
 * @param {boolean} [params.isActive=false] - Whether trip is actively running
 * @returns {Object} { pickupIndex, currentIndex, status, badgeText, message, stopsAway }
 */
export const getStudentPickupStatus = ({
  orderedStops = [],
  preferredStopId = null,
  currentStopId = null,
  isCompleted = false,
  isActive = false,
}) => {
  if (!preferredStopId || !Array.isArray(orderedStops) || orderedStops.length === 0) {
    return {
      pickupIndex: -1,
      currentIndex: -1,
      status: 'UNKNOWN',
      badgeText: 'Not Assigned',
      message: 'No pickup stop specified',
      stopsAway: null,
    };
  }

  const normPrefId = String(preferredStopId);
  const pickupIndex = orderedStops.findIndex((s) => {
    const sid = s?.stop?._id ?? s?.stop?.id ?? s?._id ?? s?.id;
    return sid && String(sid) === normPrefId;
  });

  if (pickupIndex === -1) {
    return {
      pickupIndex: -1,
      currentIndex: -1,
      status: 'UNKNOWN',
      badgeText: 'Off Route',
      message: 'Pickup stop not found on this route',
      stopsAway: null,
    };
  }

  const normCurrId = currentStopId ? String(currentStopId) : null;
  const currentIndex = normCurrId
    ? orderedStops.findIndex((s) => {
        const sid = s?.stop?._id ?? s?.stop?.id ?? s?._id ?? s?.id;
        return sid && String(sid) === normCurrId;
      })
    : -1;

  if (isCompleted) {
    return {
      pickupIndex,
      currentIndex,
      status: 'COMPLETED',
      badgeText: 'Completed',
      message: "Today's trip completed",
      stopsAway: 0,
    };
  }

  if (!isActive) {
    return {
      pickupIndex,
      currentIndex,
      status: 'UPCOMING',
      badgeText: 'Scheduled',
      message: 'Scheduled service — Waiting for departure',
      stopsAway: pickupIndex,
    };
  }

  // Active trip
  if (currentIndex < 0) {
    return {
      pickupIndex,
      currentIndex,
      status: 'EN_ROUTE',
      badgeText: 'Live / En Route',
      message: 'Bus is en route on its scheduled journey',
      stopsAway: pickupIndex,
    };
  }

  if (currentIndex === pickupIndex) {
    return {
      pickupIndex,
      currentIndex,
      status: 'ARRIVED',
      badgeText: 'Arrived at Your Stop',
      message: 'Bus has arrived at your pickup stop!',
      stopsAway: 0,
    };
  }

  if (currentIndex < pickupIndex) {
    const diff = pickupIndex - currentIndex;
    if (diff === 1) {
      return {
        pickupIndex,
        currentIndex,
        status: 'APPROACHING',
        badgeText: 'Approaching Your Stop',
        message: 'Bus is approaching! Next stop is your pickup stop.',
        stopsAway: 1,
      };
    }
    return {
      pickupIndex,
      currentIndex,
      status: 'EN_ROUTE',
      badgeText: `${diff} Stops Away`,
      message: `Bus is ${diff} stops away from your pickup stop`,
      stopsAway: diff,
    };
  }

  // currentIndex > pickupIndex
  return {
    pickupIndex,
    currentIndex,
    status: 'PASSED',
    badgeText: 'Departed Your Stop',
    message: 'Bus has already departed from your pickup stop',
    stopsAway: 0,
  };
};

// ─── GEOGRAPHIC MATH & PERPENDICULAR DIRECTIONAL OFFSET HELPERS ──────────────

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Calculates distance in meters between two lat/lng coordinates using Haversine formula.
 */
export const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Calculates forward bearing (0-360 degrees) from coordinate A to coordinate B.
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/**
 * Offsets a polyline perpendicular to the road travel direction on a 2-way road.
 * Uses local segment normal vectors and miter join smoothing at vertices to prevent spikes at turns.
 *
 * @param {Array<[number, number]>} coordinates - Array of [lat, lng] points in Leaflet format
 * @param {number} [offsetMeters=3.5] - Lateral distance in meters from road centerline (e.g. 3.5m per lane)
 * @param {'right'|'left'} [side='right'] - Which side of travel direction to offset
 * @returns {Array<[number, number]>} Offset [lat, lng] coordinates
 */
export const offsetPolyline = (coordinates = [], offsetMeters = 3.5, side = 'right') => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return coordinates || [];
  if (!offsetMeters || offsetMeters === 0) return coordinates;

  // In our coordinate system where left normal is (-uy, ux),
  // 'right' is -normal and 'left' is +normal.
  const sign = side === 'left' ? 1 : -1;
  const d = offsetMeters * sign;

  // 1. Calculate segment vectors and normal vectors
  const segments = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const lat1 = Number(p1[0]);
    const lng1 = Number(p1[1]);
    const lat2 = Number(p2[0]);
    const lng2 = Number(p2[1]);

    const midLat = (lat1 + lat2) / 2;
    const dy = (lat2 - lat1) * 111320;
    const dx = (lng2 - lng1) * 111320 * Math.cos(toRad(midLat));
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.0001) {
      // Degenerate duplicate point
      segments.push(null);
    } else {
      const ux = dx / len;
      const uy = dy / len;
      // Left normal: (-uy, ux)
      const nx = -uy;
      const ny = ux;
      segments.push({ ux, uy, nx, ny, len, lat1, lng1, lat2, lng2 });
    }
  }

  // 2. Vertex offset calculation with miter join smoothing
  const result = [];
  for (let i = 0; i < coordinates.length; i++) {
    const origPoint = coordinates[i];
    const lat = Number(origPoint[0]);
    const lng = Number(origPoint[1]);
    const cosLat = Math.cos(toRad(lat));

    let shiftX = 0;
    let shiftY = 0;

    if (i === 0) {
      // First point: use first valid segment
      const seg = segments.find((s) => s !== null);
      if (seg) {
        shiftX = d * seg.nx;
        shiftY = d * seg.ny;
      }
    } else if (i === coordinates.length - 1) {
      // Last point: use last valid segment
      let seg = null;
      for (let j = segments.length - 1; j >= 0; j--) {
        if (segments[j] !== null) {
          seg = segments[j];
          break;
        }
      }
      if (seg) {
        shiftX = d * seg.nx;
        shiftY = d * seg.ny;
      }
    } else {
      // Interior point: miter join of prevSeg and nextSeg
      let prevSeg = null;
      for (let j = i - 1; j >= 0; j--) {
        if (segments[j] !== null) {
          prevSeg = segments[j];
          break;
        }
      }
      let nextSeg = null;
      for (let j = i; j < segments.length; j++) {
        if (segments[j] !== null) {
          nextSeg = segments[j];
          break;
        }
      }

      if (prevSeg && nextSeg) {
        const avgNx = (prevSeg.nx + nextSeg.nx) / 2;
        const avgNy = (prevSeg.ny + nextSeg.ny) / 2;
        const avgLen = Math.sqrt(avgNx * avgNx + avgNy * avgNy);

        if (avgLen < 0.05) {
          // Nearly 180° hairpin turn: fallback to prevSeg normal
          shiftX = d * prevSeg.nx;
          shiftY = d * prevSeg.ny;
        } else {
          const miterNx = avgNx / avgLen;
          const miterNy = avgNy / avgLen;
          // Miter factor: 1 / cos(theta/2) = 1 / avgLen, clamp to 2.0 to prevent corner spikes
          const miterFactor = Math.min(1 / avgLen, 2.0);
          shiftX = d * miterFactor * miterNx;
          shiftY = d * miterFactor * miterNy;
        }
      } else if (prevSeg) {
        shiftX = d * prevSeg.nx;
        shiftY = d * prevSeg.ny;
      } else if (nextSeg) {
        shiftX = d * nextSeg.nx;
        shiftY = d * nextSeg.ny;
      }
    }

    const offsetLat = lat + shiftY / 111320;
    const offsetLng = lng + shiftX / (111320 * (cosLat || 1));
    result.push([offsetLat, offsetLng]);
  }

  return result;
};

/**
 * Offsets a route polyline for the given trip direction.
 * In a two-way road network, OUTBOUND and RETURN travel on opposite lanes.
 * When geometry is traversed in the travel direction, shifting to the right travel lane
 * places OUTBOUND on one side and RETURN on the opposite side of the centerline.
 *
 * @param {Array<[number, number]>} geometry - Ordered route coordinates [lat, lng]
 * @param {string} [direction='OUTBOUND'] - 'OUTBOUND' or 'RETURN'
 * @param {number} [offsetMeters=3.5] - Lane offset distance in meters
 * @returns {Array<[number, number]>}
 */
export const offsetPolylineForDirection = (geometry = [], direction = 'OUTBOUND', offsetMeters = 3.5) => {
  if (!Array.isArray(geometry) || geometry.length < 2) return geometry || [];
  return offsetPolyline(geometry, offsetMeters, 'right');
};

/**
 * Helper to get direction-aware route geometry.
 * If geometry is in canonical forward order and direction is RETURN,
 * it handles traversal reversal and lane offset.
 *
 * @param {Array<[number, number]>} geometry - Route coordinates [lat, lng]
 * @param {string} [direction='OUTBOUND'] - 'OUTBOUND' or 'RETURN'
 * @param {Object} [options={}] - { offsetMeters: 3.5, alreadyReversed: boolean }
 * @returns {Array<[number, number]>}
 */
export const getDirectionalRouteGeometry = (geometry = [], direction = 'OUTBOUND', options = {}) => {
  if (!Array.isArray(geometry) || geometry.length < 2) return geometry || [];
  const { offsetMeters = 3.5, alreadyReversed = false } = options;
  const normDirection = normalizeDirection(direction);

  let directedCoords = geometry;
  if (normDirection === 'RETURN' && !alreadyReversed) {
    directedCoords = [...geometry].reverse();
  }

  return offsetPolylineForDirection(directedCoords, normDirection, offsetMeters);
};

/**
 * Generates directional indicator arrows along a route polyline.
 * Computes positions [lat, lng] and segment forward bearings (0-360) at regular distance intervals.
 *
 * @param {Array<[number, number]>} coordinates - Polyline [lat, lng] points
 * @param {Object} [options={}] - { intervalMeters: 200, maxArrows: 20 }
 * @returns {Array<{ lat: number, lng: number, bearing: number, distanceMeters: number }>}
 */
export const getRouteDirectionArrows = (coordinates = [], options = {}) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return [];

  const { intervalMeters = 200, maxArrows = 20 } = options;

  const segments = [];
  let totalDistance = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const dist = haversineDistanceMeters(p1[0], p1[1], p2[0], p2[1]);
    const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
    segments.push({
      p1,
      p2,
      dist,
      bearing,
      startDist: totalDistance,
      endDist: totalDistance + dist,
    });
    totalDistance += dist;
  }

  if (totalDistance < 20) return [];

  const effectiveInterval = Math.max(intervalMeters, totalDistance / maxArrows);
  const arrows = [];

  let targetDist = effectiveInterval / 2;
  while (targetDist < totalDistance && arrows.length < maxArrows) {
    const seg = segments.find((s) => targetDist >= s.startDist && targetDist <= s.endDist);
    if (seg && seg.dist > 0) {
      const segProgress = (targetDist - seg.startDist) / seg.dist;
      const lat = seg.p1[0] + (seg.p2[0] - seg.p1[0]) * segProgress;
      const lng = seg.p1[1] + (seg.p2[1] - seg.p1[1]) * segProgress;
      arrows.push({
        lat,
        lng,
        bearing: Math.round(seg.bearing),
        distanceMeters: Math.round(targetDist),
      });
    }
    targetDist += effectiveInterval;
  }

  return arrows;
};
