/**
 * DemoFleetSimulatorPage.jsx — DEMO ONLY
 *
 * Admin-only page that runs independent BusSimulator instances for every
 * Active Assignment in the system.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Bus,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Radio,
  Navigation,
  Info,
  Sparkles,
} from 'lucide-react';

import PageHeader from '../../components/ui/PageHeader';
import BusSimulator from '../../components/student/tracking/BusSimulator';
import assignmentApi from '../../api/assignmentApi';
import trackingApi from '../../api/trackingApi';
import { getRoadRoute } from '../../services/routingService';
import { normalizeDirection, getDirectionAwareStops } from '../../utils/routeDirection';

/* ─── Configuration ──────────────────────────────────────────────────────── */
const SIM_SYNC_INTERVAL = 3000;
const SPEED_OPTIONS = [20, 30, 40, 50];

const normalizeStops = (route) =>
  (route?.stops || [])
    .map((s) => ({
      _id: s.stop?._id,
      stopName: s.stop?.stopName || s.stop?.name,
      latitude: s.stop?.latitude,
      longtitude: s.stop?.longtitude ?? s.stop?.longitude,
      order: s.order,
    }))
    .filter((s) => s.latitude != null && s.longtitude != null);

/* ── SimBusCard ──────────────────────────────────────────────────────────── */
const SimBusCard = ({ assignment }) => {
  const bus = assignment.bus || {};
  const route = assignment.route || {};

  const busId = bus._id || bus.id;
  const busLabel = bus.busNumber || bus.busName || 'BUS';

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [resetSignal, setResetSignal] = useState(0);
  const [simDirection, setSimDirection] = useState('OUTBOUND');
  const [routeGeo, setRouteGeo] = useState([]);
  const [routeStatus, setRouteStatus] = useState('loading');
  const [syncStatus, setSyncStatus] = useState('Paused');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const latestPosRef = useRef(null);
  const isRunningRef = useRef(false);
  const isMountedRef = useRef(true);
  const syncTimerRef = useRef(null);

  const directionalStops = useMemo(() => {
    const rawStops = normalizeStops(route);
    return getDirectionAwareStops(rawStops, simDirection);
  }, [route, simDirection]);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    if (directionalStops.length < 2) {
      setRouteStatus('error');
      return;
    }

    setRouteStatus('loading');
    getRoadRoute(directionalStops, { direction: simDirection, preserveOrder: true }).then((res) => {
      if (cancelled) return;
      if (res.success && res.coordinates?.length >= 2) {
        setRouteGeo(res.coordinates);
        setRouteStatus('ready');
      } else {
        setRouteStatus('error');
      }
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [directionalStops, simDirection]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    if (!isRunning || !busId) {
      setSyncStatus('Paused');
      return;
    }

    const syncOnce = async () => {
      const pos = latestPosRef.current;
      if (!pos || !isMountedRef.current) return;

      try {
        await trackingApi.demoUpdateLocation({
          busId,
          latitude: Number(pos.latitude),
          longitude: Number(pos.longitude),
          speed: Number(pos.speed ?? 0),
          heading: Number(pos.heading ?? 0),
          isMoving: Boolean(pos.speed > 0),
        });
        if (isMountedRef.current) {
          setSyncStatus('Synced');
          setLastSyncTime(new Date());
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        const status = err?.response?.status;
        if (status === 401) setSyncStatus('Auth expired');
        else if (status === 403) setSyncStatus('Not authorized');
        else setSyncStatus('Sync failed');
      }
    };

    setSyncStatus('Syncing');
    syncOnce();
    syncTimerRef.current = setInterval(syncOnce, SIM_SYNC_INTERVAL);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [isRunning, busId]);

  const handlePositionChange = useCallback((pos) => {
    latestPosRef.current = pos;
  }, []);

  const handleStart = useCallback(() => setIsRunning(true), []);
  const handlePause = useCallback(() => setIsRunning(false), []);
  const handleRestart = useCallback(() => {
    setResetSignal((s) => s + 1);
    setIsRunning(true);
  }, []);

  const handleToggleDirection = useCallback((dir) => {
    if (dir === simDirection) return;
    setIsRunning(false);
    setSimDirection(dir);
    setResetSignal((s) => s + 1);
  }, [simDirection]);

  const syncColor = useMemo(() => {
    if (syncStatus === 'Synced') return 'text-emerald-700 bg-emerald-50';
    if (syncStatus === 'Paused') return 'text-gray-500 bg-gray-100';
    if (syncStatus === 'Syncing') return 'text-amber-700 bg-amber-50';
    return 'text-rose-700 bg-rose-50';
  }, [syncStatus]);

  const lastSyncLabel = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div
      className={`bg-white rounded-xl border shadow-xs overflow-hidden transition-all duration-200 flex flex-col justify-between ${
        isRunning ? 'border-purple-300 ring-2 ring-purple-600/20' : 'border-gray-200/80'
      }`}
    >
      <div>
        {/* Card Header */}
        <div
          className={`px-4 py-3.5 flex items-center justify-between border-b ${
            isRunning ? 'bg-purple-50/60 border-purple-100' : 'bg-gray-50/70 border-gray-100'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isRunning ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Bus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate font-mono">{busLabel}</p>
              {bus.busName && bus.busName !== bus.busNumber && (
                <p className="text-[11px] text-gray-400 truncate">{bus.busName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span
              className={`text-[11px] font-bold ${
                isRunning ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Route info */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Navigation className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            <span className="truncate font-semibold">{route?.routeName || 'Assigned Route'}</span>
            {routeStatus === 'loading' && (
              <span className="text-amber-600 ml-auto flex-shrink-0 text-[10px] font-medium">
                Fetching route…
              </span>
            )}
            {routeStatus === 'error' && (
              <span className="text-rose-600 ml-auto flex-shrink-0 text-[10px] font-medium">
                No road route
              </span>
            )}
            {routeStatus === 'ready' && (
              <span className="text-emerald-700 ml-auto flex-shrink-0 text-[11px] font-mono font-bold">
                {routeGeo.length} pts
              </span>
            )}
          </div>

          {/* Direction Selector */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
            <span className="text-gray-500 font-medium text-[11px]">Lane Direction:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleToggleDirection('OUTBOUND')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  simDirection === 'OUTBOUND'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                OUTBOUND (→)
              </button>
              <button
                type="button"
                onClick={() => handleToggleDirection('RETURN')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  simDirection === 'RETURN'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                RETURN (←)
              </button>
            </div>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <Gauge className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                    speed === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s} km/h
                </button>
              ))}
            </div>
          </div>

          {/* Sync status */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Radio className="w-3 h-3 text-gray-400" />
              <span>Backend Sync:</span>
            </span>
            <span className={`font-semibold px-2 py-0.5 rounded-full ${syncColor}`}>
              {syncStatus} {lastSyncLabel && syncStatus === 'Synced' ? `(${lastSyncLabel})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Card Controls Footer */}
      <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center gap-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={routeStatus !== 'ready'}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start Sim</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause Sim</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleRestart}
          disabled={routeStatus !== 'ready'}
          title="Restart from beginning of route"
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-40 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Headless simulator driving GPS updates */}
      {routeStatus === 'ready' && (
        <BusSimulator
          routeGeometry={routeGeo}
          isRunning={isRunning}
          speed={speed}
          onPositionChange={handlePositionChange}
          busId={busId}
          busLabel={busLabel}
          resetSignal={resetSignal}
          stops={directionalStops}
        />
      )}
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
const DemoFleetSimulatorPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await assignmentApi.getAll();
      const all = data?.data ?? [];
      const active = all.filter((a) => a.status === 'Active' && a.bus && a.route);
      setAssignments(active);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Fleet Simulation"
        description="Simulate multiple buses independently along road routes for demonstration and testing"
        breadcrumb="Admin"
        badge={
          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Demo Tool
          </span>
        }
        action={
          <button
            type="button"
            onClick={fetchAssignments}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Fleet</span>
          </button>
        }
      />

      {/* ── DEMO Warning Banner ── */}
      <div className="flex items-start gap-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900">
            DEMONSTRATION &amp; TESTING ENVIRONMENT
          </p>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            This module generates simulated telemetry using the administrator test endpoint (
            <code className="font-mono bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-900 font-semibold">
              POST /api/tracking/demo/update-location
            </code>
            ). Simulated locations will be broadcast across the <strong>Live Bus Tracking</strong> portal.
            Disable this simulator before deploying physical hardware GPS units.
          </p>
        </div>
      </div>

      {/* ── Operational Instructions ── */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-purple-600" />
          <span>Simulation Workflow</span>
        </h3>
        <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Each card represents one active bus assignment with real database vehicle &amp; route models.</li>
          <li>Click <strong>Start Sim</strong> on any vehicle to begin autonomous simulation along OSRM road coordinates.</li>
          <li>Adjust simulation speeds (20–50 km/h) independently per vehicle to model traffic conditions.</li>
          <li>Every {SIM_SYNC_INTERVAL / 1000}s each moving bus submits telemetry updates to the central tracking registry.</li>
          <li>Switch to the <strong>Live Tracking</strong> screen to watch real-time bus movements on the Leaflet map.</li>
        </ol>
      </div>

      {/* ── Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-56 bg-white rounded-xl border border-gray-200/80 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Bus className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">No active assignments to simulate</p>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed">
            Create at least one Active assignment with an assigned bus and route in the Fleet Assignments section before using the fleet simulator.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider px-1">
            Active Simulator Fleet ({assignments.length} vehicle{assignments.length !== 1 ? 's' : ''})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {assignments.map((assignment) => (
              <SimBusCard key={assignment._id} assignment={assignment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoFleetSimulatorPage;
