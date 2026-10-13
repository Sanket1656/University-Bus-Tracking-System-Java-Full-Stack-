/**
 * TrackingMap — Road-Following Navigation Map
 *
 * Renders:
 *  1. Leaflet map (OpenStreetMap tiles)
 *  2. OSRM Road-following route geometry (with straight-line fallback on error)
 *  3. Stop markers for every route stop (with student's preferred stop highlighted)
 *  4. Independent Bus marker(s) (supports single bus or multiple buses simultaneously)
 *  5. Real-time routing status badge (loading, road route distance/duration, or fallback warning)
 *
 * Architecture Notes:
 *  - ROUTE CALCULATION is triggered ONLY when stop coordinates change (stops -> OSRM -> road geometry).
 *  - LIVE BUS TRACKING updates only moving bus markers and NEVER triggers route recalculation.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Crosshair,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { getRoadRoute } from '../../../services/routingService';
import trackingApi from '../../../api/trackingApi';
import BusSimulator from './BusSimulator';
import {
  createLiveBusIcon,
  normalStopIcon,
  myStopIcon,
  startStopIcon,
  endStopIcon,
  createDirectionArrowIcon,
} from './mapMarkers';
import {
  normalizeDirection,
  offsetPolylineForDirection,
  getRouteDirectionArrows,
} from '../../../utils/routeDirection';

// ─── Fix Leaflet's default icon broken by bundlers ────────────────────────────
import markerIconUrl       from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl     from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl:     markerShadowUrl,
});

// ─── Initial Viewport Controller ─────────────────────────────────────────────
/**
 * ViewportController manages the initial focus of the map once on load:
 * Priority: Live Bus -> Student Preferred Stop -> First Route Stop -> Default Center
 * Initial Zoom: 16
 *
 * Rules:
 *  - Runs ONLY ONCE initially (does not constantly re-center or fit bounds on live bus/route updates)
 *  - Listens for user interactions (drag, zoom, pan) and respects them completely (no fighting the user)
 *  - Exposes the Leaflet map instance to parent for explicit user actions (e.g. "View Full Route")
 */
const ViewportController = ({
  onMapReady,
  activeBuses = [],
  preferredStop = null,
  validStops = [],
  firstStop = null,
}) => {
  const map = useMap();
  const hasUserInteractedRef = useRef(false);
  const hasCenteredOnBusRef = useRef(false);
  const hasInitialCenteredRef = useRef(false);

  // Expose map instance to parent for explicit controls
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Track if user manually moves, drags, or zooms the map
  useEffect(() => {
    if (!map) return;
    const handleUserInteraction = () => {
      hasUserInteractedRef.current = true;
    };

    map.on('movestart', handleUserInteraction);
    return () => {
      map.off('movestart', handleUserInteraction);
    };
  }, [map]);

  // Controlled initial view
  useEffect(() => {
    if (!map || hasUserInteractedRef.current) return;

    // 1. Priority 1: Current live bus location
    if (activeBuses.length > 0 && !hasCenteredOnBusRef.current) {
      const bus = activeBuses[0];
      if (bus?.latitude != null && bus?.longitude != null) {
        map.setView([bus.latitude, bus.longitude], 16, { animate: false });
        hasCenteredOnBusRef.current = true;
        hasInitialCenteredRef.current = true;
        return;
      }
    }

    // 2. If no bus yet, set initial center on preferred stop or first route stop
    if (!hasInitialCenteredRef.current) {
      if (preferredStop?.latitude != null && preferredStop?.longitude != null) {
        map.setView([preferredStop.latitude, preferredStop.longitude], 16, { animate: false });
        hasInitialCenteredRef.current = true;
      } else if (firstStop?.latitude != null && firstStop?.longitude != null) {
        map.setView([firstStop.latitude, firstStop.longitude], 16, { animate: false });
        hasInitialCenteredRef.current = true;
      } else if (validStops.length > 0 && validStops[0]?.latitude != null && validStops[0]?.longitude != null) {
        map.setView([validStops[0].latitude, validStops[0].longitude], 16, { animate: false });
        hasInitialCenteredRef.current = true;
      }
    }
  }, [map, activeBuses, preferredStop, validStops, firstStop]);

  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * @param {object}   busLocation      - Single bus: { latitude, longitude, label, speed, heading, updatedAt }
 * @param {Array}    buses            - Multi-bus array: [{ id, latitude, longitude, label, speed, heading, updatedAt }]
 * @param {Array}    stops            - Array of { _id, stopName, latitude, longtitude, order }
 * @param {string}   preferredStopId  - _id of the student's preferred stop
 * @param {function} onRouteCalculated - Optional callback ({ distance, duration, isFallback, error })
 */
const TrackingMap = ({
  busLocation,
  buses = [],
  stops = [],
  preferredStopId,
  onRouteCalculated,
  enableSimulation = true,
  busId = null,
  busLabel = 'BUS 101',
  initialPosition = null,
  autoStartSimulation = false,
  simulationResetSignal = 0,
  onSimulationProgress,
  direction = null,
}) => {
  const simulationDirection = direction ? normalizeDirection(direction) : null;
  const hasValidSimulationDirection = !enableSimulation || Boolean(simulationDirection);
  // ── Demo Simulator States (Frontend Movement Simulation) ───────────────────
  const [simulatedBus, setSimulatedBus] = useState(null);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(30);
  const [simResetSignal, setSimResetSignal] = useState(0);
  const [syncStatus, setSyncStatus] = useState('Paused');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const latestPositionRef = useRef(null);

  const handleStartSimulation = useCallback(() => {
    setIsSimRunning(true);
  }, []);

  const handlePauseSimulation = useCallback(() => {
    setIsSimRunning(false);
  }, []);

  const handleRestartSimulation = useCallback(() => {
    setIsSimRunning(false);
    setSimResetSignal((prev) => prev + 1);
  }, []);

  const handleBusPositionChange = useCallback((positionData) => {
    latestPositionRef.current = positionData;
    setSimulatedBus(positionData);

    if (positionData.routeCompleted && busId) {
      trackingApi.updateLocation({
        busId,
        latitude: Number(positionData.latitude),
        longitude: Number(positionData.longitude),
        speed: 0,
        heading: Number(positionData.heading ?? 0),
        isMoving: false,
        currentStopIndex: Number(positionData.currentStopIndex ?? 0),
        currentStopId: positionData.currentStopId || null,
        nextStopId: null,
        routeProgress: 100,
        routeCompleted: true,
      }).catch((error) => {
        console.error('[TrackingMap] Failed to sync final bus location:', error);
      });
      setIsSimRunning(false);
    }
  }, [busId]);

  const handleSimulationProgress = useCallback((progressData) => {
    onSimulationProgress?.(progressData);
  }, [onSimulationProgress]);

  useEffect(() => {
    if (enableSimulation && hasValidSimulationDirection && autoStartSimulation) {
      setIsSimRunning(true);
    }
  }, [autoStartSimulation, enableSimulation, hasValidSimulationDirection]);

  useEffect(() => {
    if (!enableSimulation && isSimRunning) {
      setIsSimRunning(false);
      setSyncStatus('Paused');
    }
  }, [enableSimulation, isSimRunning]);

  // Update lastSyncTime display every second
  useEffect(() => {
    if (!lastSyncTime || syncStatus !== 'Synced') return;
    
    const intervalId = setInterval(() => {
      setLastSyncTime((prev) => (prev ? new Date(prev) : null));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [lastSyncTime, syncStatus]);

  // 2. Routing States (MOVED BEFORE useEffect TO FIX TEMPORAL DEAD ZONE)
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routingError, setRoutingError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [routeStats, setRouteStats] = useState(null);

  useEffect(() => {
    if (!isSimRunning || !enableSimulation || !busId || !routeGeometry.length) {
      setSyncStatus(isSimRunning ? 'Syncing' : 'Paused');
      return undefined;
    }

    let cancelled = false;

    const syncBusLocation = async () => {
      const position = latestPositionRef.current || simulatedBus;
      if (!position || !busId) return;

      // Set syncing status BEFORE making request
      if (!cancelled) {
        setSyncStatus('Syncing');
      }

      try {
        const response = await trackingApi.updateLocation({
          busId,
          latitude: Number(position.latitude),
          longitude: Number(position.longitude),
          speed: Number(position.speed ?? 0),
          heading: Number(position.heading ?? 0),
          isMoving: position.isMoving ?? Boolean(position.speed > 0 && isSimRunning),
          currentStopIndex: Number(position.currentStopIndex ?? 0),
          currentStopId: position.currentStopId || null,
          nextStopId: position.nextStopId || null,
          routeProgress: Number(position.routeProgress ?? 0),
          routeCompleted: Boolean(position.routeCompleted),
        });

        if (!cancelled) {
          // Successfully received 2xx response
          setSyncStatus('Synced');
          setLastSyncTime(new Date());
        }
      } catch (error) {
        const status = error?.response?.status;
        const message = error?.response?.data?.message || 'Backend unavailable';

        console.error('[TrackingMap] Failed to sync bus location:', error);

        if (!cancelled) {
          // Different status codes → different messages
          if (status === 401) {
            setSyncStatus('Authentication expired');
          } else if (status === 403) {
            setSyncStatus('Not authorized for this bus');
          } else if (status >= 400 && status < 500) {
            setSyncStatus(`Client error: ${message}`);
          } else if (status >= 500) {
            setSyncStatus('Server error');
          } else {
            setSyncStatus('Backend unavailable');
          }
        }
      }
    };

    syncBusLocation();
    const intervalId = setInterval(syncBusLocation, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [busId, enableSimulation, isSimRunning, routeGeometry.length]);

  // 1. Sanitize and sort stops by order
  const validStops = useMemo(() => {
    return (stops || [])
      .map((s, idx) => {
        const lat = Number(s?.latitude);
        const lng = Number(s?.longtitude ?? s?.longitude);
        const order = Number(s?.order ?? idx + 1);
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
        return {
          _id: s?._id || idx,
          stopName: s?.stopName || s?.name || `Stop ${order}`,
          latitude: lat,
          longitude: lng,
          order,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
  }, [stops]);

  useEffect(() => {
    if (enableSimulation && (!hasValidSimulationDirection || validStops.length < 2) && isSimRunning) {
      setIsSimRunning(false);
      setSyncStatus('Paused');
    }
  }, [enableSimulation, hasValidSimulationDirection, isSimRunning, validStops.length]);

  // One direction-aware movement route stops array prepared before simulation
  const movementStops = useMemo(
    () => (simulationDirection === 'RETURN' ? [...validStops].reverse() : validStops),
    [simulationDirection, validStops],
  );

  // Stable route fingerprint including direction and stop coordinates
  const routeFingerprint = useMemo(() => {
    const stopsStr = movementStops
      .map((s) => `${s._id}:${s.latitude.toFixed(6)},${s.longitude.toFixed(6)}`)
      .join(';');
    return `${simulationDirection || 'OUTBOUND'}:${stopsStr}`;
  }, [movementStops, simulationDirection]);

  // 3. Multi-bus normalization: prioritize simulated bus in demo mode, otherwise use live buses / busLocation
  const activeBuses = useMemo(() => {
    if (enableSimulation && simulatedBus) {
      return [simulatedBus];
    }

    const list = [];
    if (Array.isArray(buses) && buses.length > 0) {
      buses.forEach((b, i) => {
        const lat = Number(b?.latitude);
        const lng = Number(b?.longitude ?? b?.longtitude);
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          list.push({
            id: b.id || b._id || b.busId || `bus-${i}`,
            latitude: lat,
            longitude: lng,
            label: b.label || b.busNumber || `Bus ${i + 1}`,
            speed: b.speed ?? null,
            heading: b.heading ?? null,
            updatedAt: b.updatedAt ?? null,
            isCompleted: Boolean(b.isCompleted || b.routeCompleted),
          });
        }
      });
    } else if (busLocation?.latitude != null && busLocation?.longitude != null) {
      const lat = Number(busLocation.latitude);
      const lng = Number(busLocation.longitude ?? busLocation.longtitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        list.push({
          id: busLocation.id || 'primary-bus',
          latitude: lat,
          longitude: lng,
          label: busLocation.label || 'BUS',
          speed: busLocation.speed ?? null,
          heading: busLocation.heading ?? null,
          updatedAt: busLocation.updatedAt ?? null,
          isCompleted: Boolean(busLocation.isCompleted || busLocation.routeCompleted),
        });
      }
    }

    return list;
  }, [enableSimulation, simulatedBus, buses, busLocation]);

  // 4. Fetch road-following route from OSRM whenever stop coordinates or direction changes
  useEffect(() => {
    let isSubscribed = true;

    if (movementStops.length < 2) {
      return () => {
        isSubscribed = false;
      };
    }

    queueMicrotask(() => {
      if (isSubscribed) {
        setIsLoadingRoute(true);
        setRoutingError(null);
      }
    });

    getRoadRoute(movementStops, {
      direction: simulationDirection || 'OUTBOUND',
      preserveOrder: true,
    })
      .then((res) => {
        if (!isSubscribed) return;

        if (res.success && Array.isArray(res.coordinates) && res.coordinates.length > 0) {
          // Road-following geometry successfully received in travel direction
          setRouteGeometry(res.coordinates);
          setIsFallback(false);
          setRoutingError(null);
          setRouteStats({
            distance: res.distance,
            duration: res.duration,
          });
          onRouteCalculated?.({
            distance: res.distance,
            duration: res.duration,
            isFallback: false,
          });
        } else {
          // OSRM failed or returned NoRoute: fall back to straight line
          console.warn('[TrackingMap] OSRM routing failed. Using straight-line fallback.', res.error);
          const straightLine = movementStops.map((s) => [s.latitude, s.longitude]);
          setRouteGeometry(straightLine);
          setIsFallback(true);
          setRoutingError(res.error || 'Failed to calculate road route.');
          setRouteStats(null);
          onRouteCalculated?.({
            isFallback: true,
            error: res.error,
          });
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.error('[TrackingMap] Unexpected error requesting road route:', err);
        const straightLine = movementStops.map((s) => [s.latitude, s.longitude]);
        setRouteGeometry(straightLine);
        setIsFallback(true);
        setRoutingError(err.message || 'Routing service error.');
        setRouteStats(null);
        onRouteCalculated?.({
          isFallback: true,
          error: err.message,
        });
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoadingRoute(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [routeFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps

  // Directional visual polyline with road lane offset (visual separation on 2-way road)
  const directionalDisplayRoute = useMemo(() => {
    if (!routeGeometry || routeGeometry.length < 2) return [];
    return offsetPolylineForDirection(routeGeometry, simulationDirection || 'OUTBOUND', 3.5);
  }, [routeGeometry, simulationDirection]);

  // Subtle directional flow arrows along the polyline
  const directionalArrows = useMemo(() => {
    if (!directionalDisplayRoute || directionalDisplayRoute.length < 2) return [];
    return getRouteDirectionArrows(directionalDisplayRoute, {
      intervalMeters: 200,
      maxArrows: 20,
    });
  }, [directionalDisplayRoute]);

  // Movement geometry for the simulator uses real road centerline coordinates in travel direction
  const movementGeometry = routeGeometry;

  const isReturn = simulationDirection === 'RETURN';
  const routeTheme = useMemo(() => (
    isReturn
      ? {
          casingColor: '#5b21b6',
          casingWeight: 7,
          casingOpacity: 0.25,
          mainColor: '#7c3aed',
          mainWeight: 4.5,
          mainOpacity: 0.95,
          arrowColor: '#7c3aed',
          badgeText: 'text-purple-700',
          label: 'Return Lane (←)',
        }
      : {
          casingColor: '#1e3a8a',
          casingWeight: 7,
          casingOpacity: 0.25,
          mainColor: '#2563eb',
          mainWeight: 4.5,
          mainOpacity: 0.95,
          arrowColor: '#2563eb',
          badgeText: 'text-blue-700',
          label: 'Outbound Lane (→)',
        }
  ), [isReturn]);

  const simulationError = enableSimulation && !hasValidSimulationDirection
    ? 'An active trip direction is required before movement can start.'
    : enableSimulation && validStops.length < 2
      ? 'At least two route stops are required before movement can start.'
      : null;

  // Preferred student stop lookup
  const preferredStop = useMemo(() => {
    if (!preferredStopId) return null;
    return (
      validStops.find(
        (s) => s._id?.toString() === preferredStopId?.toString()
      ) || null
    );
  }, [validStops, preferredStopId]);

  // Fallback initial map center (e.g. Surat, Gujarat)
  const defaultCenter = useMemo(() => [21.1702, 72.8311], []);

  // Initial map center priority:
  // 1. Current Bus -> 2. Student Preferred Stop -> 3. First Route Stop -> 4. Default Surat
  const initialCenter = useMemo(() => {
    if (activeBuses.length > 0 && activeBuses[0]?.latitude != null && activeBuses[0]?.longitude != null) {
      return [activeBuses[0].latitude, activeBuses[0].longitude];
    }
    if (preferredStop?.latitude != null && preferredStop?.longitude != null) {
      return [preferredStop.latitude, preferredStop.longitude];
    }
    if (movementStops.length > 0 && movementStops[0]?.latitude != null && movementStops[0]?.longitude != null) {
      return [movementStops[0].latitude, movementStops[0].longitude];
    }
    return defaultCenter;
  }, [activeBuses, preferredStop, movementStops, defaultCenter]);

  // Leaflet map instance ref for explicit user actions
  const [mapInstance, setMapInstance] = useState(null);

  // ── Explicit Viewport Controls (User-Triggered Only) ────────────────────────
  const handleViewFullRoute = useCallback(() => {
    if (!mapInstance) return;
    const points = routeGeometry.length > 1
      ? routeGeometry
      : validStops.map((s) => [s.latitude, s.longitude]);

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, {
            padding: [48, 48],
            maxZoom: 16,
          });
        }
      } catch (err) {
        console.warn('[TrackingMap] Failed to fit bounds to full route:', err);
      }
    }
  }, [mapInstance, routeGeometry, validStops]);

  const handleFocusBus = useCallback(() => {
    if (!mapInstance) return;
    if (activeBuses.length > 0 && activeBuses[0]?.latitude != null) {
      mapInstance.setView([activeBuses[0].latitude, activeBuses[0].longitude], 16, { animate: true });
    } else if (preferredStop?.latitude != null) {
      mapInstance.setView([preferredStop.latitude, preferredStop.longitude], 16, { animate: true });
    } else if (movementStops.length > 0 && movementStops[0]?.latitude != null) {
      mapInstance.setView([movementStops[0].latitude, movementStops[0].longitude], 16, { animate: true });
    }
  }, [mapInstance, activeBuses, preferredStop, movementStops]);

  // Formatting helpers for route stats badge
  const formattedDistance = routeStats?.distance
    ? `${(routeStats.distance / 1000).toFixed(1)} km`
    : null;
  const formattedDuration = routeStats?.duration
    ? `${Math.ceil(routeStats.duration / 60)} min`
    : null;

  return (
    <div className="relative w-full h-full">
      {/* ─── Route Status & Info Overlay Badge ────────────────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-none flex flex-col gap-1.5 max-w-[85%] sm:max-w-md">
        {isLoadingRoute && (
          <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-xs font-semibold text-gray-700">
            <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>Calculating road route via OSRM...</span>
          </div>
        )}

        {!isLoadingRoute && isFallback && (
          <div className="inline-flex items-start gap-2 bg-amber-50/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-amber-300 text-xs text-amber-800 pointer-events-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Straight-Line Route Preview</p>
              <p className="text-[11px] text-amber-700 leading-tight">
                {routingError || 'OSRM road route currently unavailable; displaying direct connections.'}
              </p>
            </div>
          </div>
        )}

        {!isLoadingRoute && !isFallback && routeStats && (
          <div className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-medium text-gray-800">
            <div className={`flex items-center gap-1.5 font-bold ${routeTheme.badgeText}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isReturn ? 'RETURN Lane (←)' : 'OUTBOUND Lane (→)'}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span>{formattedDistance}</span>
            <span className="text-gray-300">•</span>
            <span>~{formattedDuration}</span>
          </div>
        )}

        {simulationError && (
          <div className="inline-flex items-center gap-2 bg-red-50/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-red-200 text-xs font-semibold text-red-700">
            {simulationError}
          </div>
        )}
      </div>

      {/* ─── Map Viewport Quick Actions (Top Right) ────────────────────────── */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          type="button"
          onClick={handleViewFullRoute}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-indigo-600 font-semibold text-xs rounded-xl shadow-md border border-gray-200 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="Zoom out to see the entire route"
        >
          <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">View Full Route</span>
          <span className="sm:hidden">Full Route</span>
        </button>

        <button
          type="button"
          onClick={handleFocusBus}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-indigo-600 font-semibold text-xs rounded-xl shadow-md border border-gray-200 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title={activeBuses.length > 0 ? "Focus on live bus" : "Focus on stop"}
        >
          <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">{activeBuses.length > 0 ? "Focus Bus" : "Focus Stop"}</span>
          <span className="sm:hidden">{activeBuses.length > 0 ? "Bus" : "Stop"}</span>
        </button>
      </div>

      {/* ─── Leaflet Map ──────────────────────────────────────────────────── */}
      <MapContainer
        center={initialCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Viewport manager: sets initial zoom to 16 once, never overrides user navigation */}
        <ViewportController
          onMapReady={setMapInstance}
          activeBuses={activeBuses}
          preferredStop={preferredStop}
          validStops={validStops}
          firstStop={movementStops[0]}
        />

        {/* ─── Road-Following Route Polyline with Two-Way Lane Offset ────── */}
        {directionalDisplayRoute.length > 1 && (
          <>
            {isFallback ? (
              /* Fallback preview: straight dashed line */
              <Polyline
                positions={directionalDisplayRoute}
                pathOptions={{
                  color: isReturn ? '#7c3aed' : '#d97706',
                  weight: 3.5,
                  opacity: 0.85,
                  dashArray: '8 6',
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            ) : (
              /* Professional Navigation Route Line with Two-Way Lane Offset */
              <>
                {/* Outer casing / soft shadow */}
                <Polyline
                  positions={directionalDisplayRoute}
                  pathOptions={{
                    color: routeTheme.casingColor,
                    weight: routeTheme.casingWeight,
                    opacity: routeTheme.casingOpacity,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }}
                />
                {/* Main vibrant navigation road polyline */}
                <Polyline
                  positions={directionalDisplayRoute}
                  pathOptions={{
                    color: routeTheme.mainColor,
                    weight: routeTheme.mainWeight,
                    opacity: routeTheme.mainOpacity,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }}
                />
              </>
            )}

            {/* Directional Flow Arrows Along Lane */}
            {directionalArrows.map((arrow, idx) => (
              <Marker
                key={`dir-arrow-${idx}-${arrow.distanceMeters}`}
                position={[arrow.lat, arrow.lng]}
                icon={createDirectionArrowIcon(arrow.bearing, routeTheme.arrowColor)}
                interactive={false}
                zIndexOffset={500}
              />
            ))}
          </>
        )}

        {/* ─── Route Stop Markers ─────────────────────────────────────────── */}
        {movementStops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === movementStops.length - 1 && movementStops.length > 1;
          const isMyStop =
            preferredStopId &&
            stop._id?.toString() === preferredStopId?.toString();

          let icon = normalStopIcon;
          let zIndexOffset = 400;

          if (isMyStop) {
            icon = myStopIcon;
            zIndexOffset = 800;
          } else if (isFirst) {
            icon = startStopIcon;
            zIndexOffset = 600;
          } else if (isLast) {
            icon = endStopIcon;
            zIndexOffset = 600;
          }

          return (
            <Marker
              key={stop._id}
              position={[stop.latitude, stop.longitude]}
              icon={icon}
              zIndexOffset={zIndexOffset}
            >
              <Popup>
                <div style={{ minWidth: 140, fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2px 0' }}>
                  {isMyStop ? (
                    <>
                      <div style={{
                        color: '#4338ca',
                        fontWeight: 800,
                        fontSize: 11,
                        marginBottom: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <span>★</span>
                        <span>YOUR STOP</span>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: 13, color: '#111827', margin: 0 }}>
                        {stop.stopName}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0 0' }}>
                        Boarding Stop • #{stop.order}
                      </p>
                    </>
                  ) : isFirst ? (
                    <>
                      <div style={{
                        color: '#047857',
                        fontWeight: 800,
                        fontSize: 11,
                        marginBottom: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <span>🟢</span>
                        <span>START STOP</span>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: 13, color: '#111827', margin: 0 }}>
                        {stop.stopName}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0 0' }}>
                        Route Origin • #{stop.order}
                      </p>
                    </>
                  ) : isLast ? (
                    <>
                      <div style={{
                        color: '#b91c1c',
                        fontWeight: 800,
                        fontSize: 11,
                        marginBottom: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <span>🔴</span>
                        <span>END STOP</span>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: 13, color: '#111827', margin: 0 }}>
                        {stop.stopName}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0 0' }}>
                        Route Destination • #{stop.order}
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: 12 }}>📍</span>
                        <p style={{ fontWeight: 800, fontSize: 13, color: '#111827', margin: 0 }}>
                          {stop.stopName}
                        </p>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0 0' }}>
                        Bus Stop • #{stop.order}
                      </p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ─── Independent Bus Marker(s) ─────────────────────────────────── */}
        {activeBuses.map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.latitude, bus.longitude]}
            icon={createLiveBusIcon(bus.label, bus.heading)}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ minWidth: 160, fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 16 }}>🚌</span>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                      {bus.label || 'Bus'}
                    </p>
                    {bus.route && (
                      <p style={{ color: '#6b7280', fontSize: 10, margin: '1px 0 0' }}>
                        Route: {bus.route}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 6, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: bus.isCompleted ? '#2563eb' : '#10b981', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: bus.isCompleted ? '#1d4ed8' : '#047857' }}>
                      {bus.isCompleted ? 'Trip Completed (Last Position)' : (bus.speed && bus.speed > 0 ? 'Moving' : 'Live')}
                    </span>
                    {bus.speed != null && !bus.isCompleted && (
                      <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 'auto', fontWeight: 600 }}>
                        Speed: {bus.speed} km/h
                      </span>
                    )}
                  </div>
                  {bus.nextStop && !bus.isCompleted && (
                    <p style={{ fontSize: 11, color: '#374151', margin: 0 }}>
                      Next Stop: <strong>{bus.nextStop}</strong>
                    </p>
                  )}
                  {bus.isCompleted && (
                    <p style={{ fontSize: 11, color: '#1e40af', margin: 0, fontWeight: 600 }}>
                      Final Location Preserved
                    </p>
                  )}
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>
                    Pos: {bus.latitude.toFixed(5)}, {bus.longitude.toFixed(5)}
                  </p>
                  {bus.updatedAt && (
                    <p style={{ color: '#9ca3af', fontSize: 10, margin: '2px 0 0' }}>
                      {bus.isCompleted ? 'Completed:' : 'Updated:'} {new Date(bus.updatedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ─── Frontend Demo Bus Movement Simulator ────────────────────────── */}
      {enableSimulation && hasValidSimulationDirection && validStops.length >= 2 && movementGeometry.length > 1 && (
        <BusSimulator
          routeGeometry={movementGeometry}
          isRunning={isSimRunning}
          speed={simSpeed}
          onPositionChange={handleBusPositionChange}
          busId={busId || 'demo-bus-1'}
          busLabel={busLabel}
          stops={movementStops}
          onProgressChange={handleSimulationProgress}
          initialPosition={initialPosition}
          resetSignal={simResetSignal + simulationResetSignal}
        />
      )}

      {/* ─── Demo Simulation Floating Control Bar (Bottom Center) ─────────── */}
      {enableSimulation && hasValidSimulationDirection && validStops.length >= 2 && movementGeometry.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] sm:w-auto max-w-xl pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-indigo-100 flex flex-wrap items-center justify-between sm:justify-center gap-2 sm:gap-3.5">
            {/* Status & Demo Label */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                Demo Simulation
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isSimRunning ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700">Running</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-700">Paused</span>
                  </>
                )}
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-extrabold text-gray-800">
                {busLabel}
              </span>
              {syncStatus && (
                <>
                  <span className="text-gray-300">|</span>
                  <div className="flex flex-col items-start gap-0">
                    <span className="text-[10px] font-semibold text-gray-600">{syncStatus}</span>
                    {lastSyncTime && syncStatus === 'Synced' && (
                      <span className="text-[9px] text-gray-400">
                        Last: {Math.round((Date.now() - lastSyncTime) / 1000)}s ago
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Playback Controls & Speed */}
            <div className="flex items-center gap-1.5">
              {isSimRunning ? (
                <button
                  type="button"
                  onClick={handlePauseSimulation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Pause simulation"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSimulation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Start simulation"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Trip</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRestartSimulation}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Reset to first stop"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset to First Stop</span>
              </button>

              {/* Speed Selector (20 / 30 / 40 km/h) */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs font-semibold text-gray-600 ml-1">
                {[20, 30, 40,50,100].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSimSpeed(s)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      simSpeed === s
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'hover:text-gray-900 text-gray-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <span className="px-1.5 text-[10px] text-gray-400 font-medium">km/h</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
