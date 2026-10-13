/**
 * Admin — Live Bus Tracking Page
 *
 * Operational Monitoring Screen:
 * Polls GET /api/tracking/active-locations every LOCATION_REFRESH_INTERVAL ms.
 * Renders all reported bus positions on a Leaflet map with a side fleet list.
 * Admin is READ-ONLY — never calls POST /update-location.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  Bus,
  RefreshCw,
  AlertCircle,
  Radio,
  Navigation,
  Activity,
  Gauge,
  Clock,
  X,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import StatusBadge from '../../components/ui/StatusBadge';
import trackingApi from '../../api/trackingApi';
import routeApi from '../../api/routeApi';
import { getRoadRoute } from '../../services/routingService';
import {
  normalizeDirection,
  getDirectionAwareStops,
  offsetPolylineForDirection,
  getRouteDirectionArrows,
} from '../../utils/routeDirection';
import {
  createLiveBusIcon,
  normalStopIcon,
  startStopIcon,
  endStopIcon,
  createDirectionArrowIcon,
} from '../../components/student/tracking/mapMarkers';
import { getLocationAgeLabel, getLocationStatus } from '../../utils/locationStatus';

/* ─── Configuration ──────────────────────────────────────────────────────── */
const LOCATION_REFRESH_INTERVAL = 5000; // 5 seconds polling

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const fmtSpeed = (speed) => {
  if (speed == null) return null;
  return `${Math.round(speed)} km/h`;
};

const getBusIdStr = (b) => {
  if (!b) return '';
  return String(b.busId ?? b.bus?.id ?? b.bus?._id ?? b.id ?? b._id ?? '');
};

/* ─── FitBounds helper (fires ONCE after initial data load) ─────────────── */
const FitBoundsOnce = ({ buses, hasFit }) => {
  const map = useMap();

  useEffect(() => {
    if (hasFit.current) return;
    if (!buses || buses.length === 0) return;

    const points = buses
      .filter((b) => b.latitude != null && b.longitude != null && !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude)))
      .map((b) => [Number(b.latitude), Number(b.longitude)]);

    if (points.length === 0) return;

    try {
      if (points.length === 1) {
        map.setView(points[0], 15, { animate: false });
      } else {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: false });
        }
      }
    } catch {
      /* ignore leaflet edge-case errors */
    }

    hasFit.current = true;
  }, [buses, hasFit, map]);

  return null;
};

/* ─── FocusBus helper (fires when selectedBusId changes) ────────────────── */
const FocusSelected = ({ bus }) => {
  const map = useMap();

  useEffect(() => {
    if (!bus || bus.latitude == null || bus.longitude == null) return;
    const lat = Number(bus.latitude);
    const lng = Number(bus.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    map.setView([lat, lng], 16, { animate: true });
  }, [bus, map]);

  return null;
};

/* ─── Bus card in the sidebar list ──────────────────────────────────────── */
const BusCard = ({ bus, isSelected, onClick }) => {
  const moving = bus.isMoving === true;
  const speed = fmtSpeed(bus.speed);
  const updated = fmtTime(bus.updatedAt);
  const locationStatus = getLocationStatus(bus.updatedAt);
  const label = bus.busNumber || bus.bus?.busNumber || `Bus ${bus.busId || bus.id}`;
  const name = bus.busName || bus.bus?.busName;
  const driverName = bus.driver?.name || null;
  const routeName = bus.route?.routeName || null;
  const tripDirection = bus.trip?.direction || null;
  const tripStatus = bus.trip?.status || (bus.trip ? 'Active' : null);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 ${
        isSelected
          ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-600/30 shadow-xs'
          : 'bg-white border-gray-200/80 hover:border-purple-200 hover:bg-gray-50/60 shadow-2xs'
      }`}
    >
      {/* Top Header: Bus label & Freshness badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              locationStatus.status === 'live'
                ? 'bg-emerald-500 animate-pulse'
                : locationStatus.status === 'stale'
                ? 'bg-amber-400'
                : 'bg-gray-400'
            }`}
          />
          <span className="text-sm font-bold text-gray-900 truncate font-mono">{label}</span>
        </div>
        <StatusBadge status={locationStatus.label} size="xs" />
      </div>

      {/* Bus name / route */}
      <div className="flex items-center justify-between gap-1 text-xs text-gray-500 mb-1.5 truncate">
        {name && name !== label && <span className="truncate font-medium">{name}</span>}
        {routeName && (
          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded truncate ml-auto">
            {routeName}
          </span>
        )}
      </div>

      {/* Driver name & direction */}
      {(driverName || tripDirection) && (
        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
          {driverName && <span className="truncate">Driver: <strong className="text-gray-700 font-medium">{driverName}</strong></span>}
          {tripDirection && (
            <span className="font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] ml-auto">
              {tripDirection}
            </span>
          )}
        </div>
      )}

      {/* Trip & motion status */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-2 pt-1 border-t border-gray-100">
        <span>
          Trip:{' '}
          <strong
            className={tripStatus === 'Active' || tripStatus === 'ACTIVE' ? 'text-emerald-700' : 'text-gray-500 font-medium'}
          >
            {tripStatus || 'No active trip'}
          </strong>
        </span>
        <span
          className={`font-semibold ${
            moving ? 'text-emerald-700' : 'text-gray-500'
          }`}
        >
          {moving ? 'Moving' : 'Stationary'}
        </span>
      </div>

      {/* Speed & last telemetry */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
        <span className="font-semibold text-gray-700 font-mono">
          {speed ? `Speed: ${speed}` : '0 km/h'}
        </span>
        <span className="truncate">
          {updated} ({getLocationAgeLabel(bus.updatedAt)})
        </span>
      </div>
    </button>
  );
};

/* ─── Empty state for map ────────────────────────────────────────────────── */
const EmptyMapOverlay = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/85 z-[999] pointer-events-none p-6 text-center">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6 flex flex-col items-center gap-3 max-w-sm pointer-events-auto">
      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
        <Bus className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">No active telemetry received</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Vehicles will appear here as soon as a driver starts an active trip or shares GPS location updates.
        </p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════════════════ */
const TrackingPage = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [selectedBusId, setSelectedBusId] = useState(null);

  const isMountedRef = useRef(true);
  const pollRef = useRef(null);
  const hasFitRef = useRef(false);

  /* ── Fetch all active bus locations ──────────────────────────────────── */
  const fetchLocations = useCallback(async (isInitial = false) => {
    try {
      const { data } = await trackingApi.getActiveLocations();
      if (!isMountedRef.current) return;

      const rawList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setBuses(rawList);
      setSyncError(null);
      setLastSyncTime(new Date());
    } catch (err) {
      if (!isMountedRef.current) return;
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setSyncError('Not authorized');
      } else {
        setSyncError('Sync failed — retrying…');
      }
    } finally {
      if (isMountedRef.current && isInitial) {
        setLoading(false);
      }
    }
  }, []);

  /* ── Mount / unmount lifecycle ──────────────────────────────────────── */
  useEffect(() => {
    isMountedRef.current = true;
    fetchLocations(true);

    pollRef.current = setInterval(() => {
      if (isMountedRef.current) fetchLocations(false);
    }, LOCATION_REFRESH_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchLocations]);

  /* ── Derived stats ──────────────────────────────────────────────────── */
  const liveCount = useMemo(
    () => buses.filter((bus) => getLocationStatus(bus.updatedAt).status === 'live').length,
    [buses]
  );
  const staleCount = useMemo(
    () => buses.filter((bus) => getLocationStatus(bus.updatedAt).status === 'stale').length,
    [buses]
  );
  const offlineCount = useMemo(
    () => buses.filter((bus) => getLocationStatus(bus.updatedAt).status === 'offline').length,
    [buses]
  );

  /* ── Routes mapping for direction-aware visualization ─────────────── */
  const [routesMap, setRoutesMap] = useState({});

  useEffect(() => {
    let active = true;
    routeApi.getAll()
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const map = {};
        list.forEach((r) => {
          if (r.id != null) map[String(r.id)] = r;
          if (r._id != null) map[String(r._id)] = r;
        });
        setRoutesMap(map);
      })
      .catch((err) => {
        console.warn('Could not load routes for operational tracking map', err);
      });
    return () => {
      active = false;
    };
  }, []);

  /* ── Selected bus object & directional route ───────────────────────── */
  const selectedBus = useMemo(
    () => buses.find((b) => getBusIdStr(b) === selectedBusId) ?? null,
    [buses, selectedBusId]
  );

  const selectedBusRouteId = selectedBus?.route?.id || selectedBus?.route?._id;
  const selectedRoute = selectedBusRouteId ? routesMap[String(selectedBusRouteId)] : null;
  const selectedDirection = normalizeDirection(selectedBus?.trip?.direction || 'OUTBOUND');

  const selectedDirectionStops = useMemo(() => {
    if (!selectedRoute?.stops || selectedRoute.stops.length === 0) return [];
    return getDirectionAwareStops(selectedRoute.stops, selectedDirection);
  }, [selectedRoute, selectedDirection]);

  const [selectedRouteGeometry, setSelectedRouteGeometry] = useState([]);

  useEffect(() => {
    if (!selectedDirectionStops || selectedDirectionStops.length < 2) {
      setSelectedRouteGeometry([]);
      return;
    }
    let active = true;
    getRoadRoute(selectedDirectionStops, { direction: selectedDirection, preserveOrder: true })
      .then((res) => {
        if (!active) return;
        const coords = res?.coordinates || (Array.isArray(res) ? res : []);
        setSelectedRouteGeometry(coords);
      })
      .catch(() => {
        if (active) setSelectedRouteGeometry([]);
      });
    return () => {
      active = false;
    };
  }, [selectedDirectionStops, selectedDirection]);

  const offsetSelectedRoute = useMemo(() => {
    if (!selectedRouteGeometry || selectedRouteGeometry.length < 2) return [];
    return offsetPolylineForDirection(selectedRouteGeometry, selectedDirection, 3.5);
  }, [selectedRouteGeometry, selectedDirection]);

  const selectedArrows = useMemo(() => {
    if (!offsetSelectedRoute || offsetSelectedRoute.length < 2) return [];
    return getRouteDirectionArrows(offsetSelectedRoute, { intervalMeters: 200, maxArrows: 20 });
  }, [offsetSelectedRoute]);

  const selectedRouteTheme = useMemo(() => {
    if (selectedDirection === 'RETURN') {
      return {
        polylineColor: '#7c3aed', // Purple-600
        glowColor: '#c4b5fd',     // Purple-300
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        label: 'RETURN Lane (←)'
      };
    }
    return {
      polylineColor: '#2563eb', // Blue-600
      glowColor: '#93c5fd',     // Blue-300
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'OUTBOUND Lane (→)'
    };
  }, [selectedDirection]);

  /* ── Manual refresh ─────────────────────────────────────────────────── */
  const handleManualRefresh = useCallback(() => {
    hasFitRef.current = false;
    fetchLocations(false);
  }, [fetchLocations]);

  const handleSelectBus = useCallback((busId) => {
    setSelectedBusId((prev) => (prev === busId ? null : busId));
  }, []);

  const syncLabel = syncError
    ? syncError
    : lastSyncTime
    ? `Synced ${fmtTime(lastSyncTime.toISOString())}`
    : 'Connecting…';

  const defaultCenter = [21.1702, 72.8311]; // Surat, Gujarat campus defaults

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Live Bus Tracking"
        description="Monitor current bus locations, telemetry freshness, speed and operational status"
        breadcrumb="Admin"
        action={
          <div className="flex items-center gap-3">
            {/* Sync status pill */}
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ${
                syncError
                  ? 'text-rose-700 bg-rose-50 ring-rose-200/80'
                  : lastSyncTime
                  ? 'text-emerald-700 bg-emerald-50 ring-emerald-200/80'
                  : 'text-amber-700 bg-amber-50 ring-amber-200/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncError
                    ? 'bg-rose-500'
                    : lastSyncTime
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{syncLabel}</span>
            </span>

            {/* Manual refresh button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Buses Reporting"
          value={loading ? <SkeletonStatValue /> : buses.length}
          icon={Bus}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Transmitting coordinates"
        />
        <StatCard
          title="Live Signal"
          value={loading ? <SkeletonStatValue /> : liveCount}
          icon={Radio}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Updated within 15 seconds"
        />
        <StatCard
          title="Stale Signal"
          value={loading ? <SkeletonStatValue /> : staleCount}
          icon={Navigation}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sub="Updated 15–60 seconds ago"
        />
        <StatCard
          title="Offline"
          value={loading ? <SkeletonStatValue /> : offlineCount}
          icon={Clock}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          sub="No signal for 60s+"
        />
      </div>

      {/* Non-blocking sync error notice */}
      {syncError && !loading && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{syncError} — Displaying last known positions on map.</span>
        </div>
      )}

      {/* ── Main Monitoring Panel: Map (Left) + Bus List (Right) ── */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Panel header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200/80 bg-gray-50/70 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-900">Live Operations Fleet Map</h3>
            {!loading && (
              <span className="text-xs text-gray-500 font-medium">
                ({buses.length} active location{buses.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-1 rounded-lg">
            Polling interval: {LOCATION_REFRESH_INTERVAL / 1000}s
          </span>
        </div>

        {/* Selected Bus Banner */}
        {selectedBus && (
          <div className="px-5 py-2.5 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
                {selectedBus.busNumber || selectedBus.bus?.busNumber || 'Selected Bus'}
              </span>
              {selectedRoute && (
                <span className="font-semibold text-gray-800">{selectedRoute.routeName}</span>
              )}
              <span className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${selectedRouteTheme.badgeBg}`}>
                {selectedRouteTheme.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBusId(null)}
              className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 bg-white rounded-lg border border-indigo-200 text-[11px] shadow-2xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show All Fleet</span>
            </button>
          </div>
        )}

        {/* Map + List Split */}
        <div className="flex flex-col lg:flex-row">
          {/* Map canvas */}
          <div className="relative flex-1 h-[450px] lg:h-[550px]">
            {loading ? (
              <div className="absolute inset-0 bg-slate-100 p-6 animate-pulse" aria-label="Loading map">
                <div className="h-full rounded-xl border border-slate-200 bg-slate-200/50" />
              </div>
            ) : (
              <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBoundsOnce buses={buses} hasFit={hasFitRef} />

                {selectedBus && <FocusSelected bus={selectedBus} />}

                {/* Direction-Aware Road Route for Selected Bus */}
                {selectedBus && offsetSelectedRoute.length > 1 && (
                  <>
                    {/* Outer Glow */}
                    <Polyline
                      positions={offsetSelectedRoute}
                      pathOptions={{
                        color: selectedRouteTheme.glowColor,
                        weight: 8,
                        opacity: 0.45,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />
                    {/* Core Directional Road Line (Offset 3.5m) */}
                    <Polyline
                      positions={offsetSelectedRoute}
                      pathOptions={{
                        color: selectedRouteTheme.polylineColor,
                        weight: 4.5,
                        opacity: 0.9,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />

                    {/* Directional Chevron Arrows along the polyline */}
                    {selectedArrows.map((arrow, idx) => (
                      <Marker
                        key={`admin-arrow-${idx}-${arrow.bearing}`}
                        position={arrow.position}
                        icon={createDirectionArrowIcon(arrow.bearing, selectedRouteTheme.polylineColor)}
                        interactive={false}
                        zIndexOffset={600}
                      />
                    ))}

                    {/* Direction-Aware Stops for Selected Bus */}
                    {selectedDirectionStops.map((stop, sIdx) => {
                      const lat = Number(stop.latitude);
                      const lng = Number(stop.longtitude ?? stop.longitude);
                      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
                      const isStart = sIdx === 0;
                      const isEnd = sIdx === selectedDirectionStops.length - 1;
                      const icon = isStart ? startStopIcon : isEnd ? endStopIcon : normalStopIcon;
                      const stopName = stop.stopName || stop.name || `Stop ${sIdx + 1}`;

                      return (
                        <Marker
                          key={`admin-stop-${stop.id || stop._id || sIdx}`}
                          position={[lat, lng]}
                          icon={icon}
                          zIndexOffset={800}
                        >
                          <Popup>
                            <div className="text-xs font-sans min-w-[140px] py-0.5">
                              <p className="font-bold text-gray-900">{stopName}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {isStart ? 'Starting Departure Stop' : isEnd ? 'Final Destination Stop' : `Stop #${sIdx + 1}`}
                              </p>
                              <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${selectedRouteTheme.badgeBg}`}>
                                {selectedRouteTheme.label}
                              </span>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </>
                )}

                {buses.map((bus, idx) => {
                  const lat = Number(bus.latitude);
                  const lng = Number(bus.longitude);
                  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
                  const busIdStr = getBusIdStr(bus) || `bus-${idx}`;
                  const label = bus.busNumber || bus.bus?.busNumber || 'Bus';
                  return (
                    <Marker
                      key={busIdStr}
                      position={[lat, lng]}
                      icon={createLiveBusIcon(label, bus.heading)}
                      zIndexOffset={selectedBusId === busIdStr ? 2000 : 1000}
                      eventHandlers={{
                        click: () => handleSelectBus(busIdStr),
                      }}
                    >
                      <Popup>
                        <div
                          style={{
                            minWidth: 180,
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            padding: '2px 0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 18 }}>🚌</span>
                            <div>
                              <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: 0 }}>
                                {bus.busNumber || bus.bus?.busNumber || 'Bus'}
                              </p>
                              {(bus.busName || bus.bus?.busName) && (bus.busName || bus.bus?.busName) !== (bus.busNumber || bus.bus?.busNumber) && (
                                <p style={{ color: '#6b7280', fontSize: 11, margin: '1px 0 0' }}>
                                  {bus.busName || bus.bus?.busName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              borderTop: '1px solid #f3f4f6',
                              paddingTop: 6,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3,
                            }}
                          >
                            {bus.route?.routeName && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#6b7280' }}>Route</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#4338ca', textAlign: 'right' }}>
                                  {bus.route.routeName}
                                </span>
                              </div>
                            )}
                            {bus.driver?.name && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#6b7280' }}>Driver</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>
                                  {bus.driver.name}
                                </span>
                              </div>
                            )}
                            {bus.trip?.direction && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#6b7280' }}>Direction</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5' }}>
                                  {bus.trip.direction}
                                </span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>Status</span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: bus.isMoving ? '#059669' : '#6b7280',
                                }}
                              >
                                {bus.isMoving ? 'Moving' : 'Stopped'}
                              </span>
                            </div>
                            {bus.speed != null && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, color: '#6b7280' }}>Speed</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>
                                  {fmtSpeed(bus.speed)}
                                </span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>Updated</span>
                              <span style={{ fontSize: 11, color: '#374151' }}>
                                {fmtTime(bus.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {buses.length === 0 && <EmptyMapOverlay />}
              </MapContainer>
            )}
          </div>

          {/* Right Fleet List */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200/80 flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Reporting Buses
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {buses.length} online
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[300px] lg:max-h-none">
              {loading ? (
                <AdminSkeleton variant="list" count={3} />
              ) : buses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Bus className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-600">No active vehicles</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Start driver trips or simulator to monitor positions.
                  </p>
                </div>
              ) : (
                buses.map((bus, idx) => {
                  const busIdStr = getBusIdStr(bus) || `bus-${idx}`;
                  return (
                    <BusCard
                      key={busIdStr}
                      bus={bus}
                      isSelected={selectedBusId === busIdStr}
                      onClick={() => handleSelectBus(busIdStr)}
                    />
                  );
                })
              )}
            </div>

            {buses.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 text-[11px] text-gray-500 text-center font-medium">
                Click any bus card to focus on map
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
