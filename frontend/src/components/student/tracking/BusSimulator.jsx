/**
 * BusSimulator.jsx
 *
 * Frontend-only demo bus movement simulator along OSRM road geometry.
 *
 * Capabilities:
 *  - Follows detailed OSRM road geometry point-by-point
 *  - Interpolates smoothly between consecutive coordinates using requestAnimationFrame
 *  - Accurately converts speed (km/h) to real-world velocity (m/s)
 *  - Calculates dynamic bus heading (bearing 0-360°) matching road curves
 *  - Stops at the final route coordinate and reports route progress
 *  - Supports Start, Pause, Reset, and Speed changes
 *  - Clean lifecycle management (no memory leaks, cancels animation on unmount)
 */

import { useEffect, useRef } from 'react';

// ─── Geo Math Helpers ─────────────────────────────────────────────────────────

/**
 * Calculates distance in meters between two lat/lng points using the Haversine formula
 */
const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's mean radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates forward azimuth / initial bearing (in degrees 0-360) from point A to point B
 */
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
};

const findNearestRoutePosition = (routeGeometry, initialPosition) => {
  if (!initialPosition || routeGeometry.length < 2) return null;

  const targetLat = Number(initialPosition.latitude);
  const targetLng = Number(initialPosition.longitude);
  if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) return null;

  const longitudeScale = Math.cos((targetLat * Math.PI) / 180);
  let nearest = null;

  routeGeometry.slice(0, -1).forEach((pointA, index) => {
    const pointB = routeGeometry[index + 1];
    const ax = pointA[1] * longitudeScale;
    const ay = pointA[0];
    const bx = pointB[1] * longitudeScale;
    const by = pointB[0];
    const targetX = targetLng * longitudeScale;
    const targetY = targetLat;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const progress = lengthSquared === 0
      ? 0
      : Math.min(1, Math.max(0, ((targetX - ax) * dx + (targetY - ay) * dy) / lengthSquared));
    const projectedX = ax + dx * progress;
    const projectedY = ay + dy * progress;
    const distanceSquared = (targetX - projectedX) ** 2 + (targetY - projectedY) ** 2;

    if (!nearest || distanceSquared < nearest.distanceSquared) {
      nearest = {
        index,
        traveledMeters: haversineDistanceMeters(pointA[0], pointA[1], pointB[0], pointB[1]) * progress,
        distanceSquared,
      };
    }
  });

  return nearest;
};

const getRouteDistances = (routeGeometry) => {
  const segmentDistances = [];
  const cumulativeDistances = [0];

  for (let index = 0; index < routeGeometry.length - 1; index += 1) {
    const [lat1, lng1] = routeGeometry[index];
    const [lat2, lng2] = routeGeometry[index + 1];
    const distance = haversineDistanceMeters(lat1, lng1, lat2, lng2);
    segmentDistances.push(distance);
    cumulativeDistances.push(cumulativeDistances[index] + distance);
  }

  return { segmentDistances, cumulativeDistances };
};

const findRouteDistanceForPosition = (routeGeometry, position, routeDistances) => {
  const nearest = findNearestRoutePosition(routeGeometry, position);
  if (!nearest) return 0;

  return routeDistances.cumulativeDistances[nearest.index] + nearest.traveledMeters;
};

// ─── Simulator Component ──────────────────────────────────────────────────────

const BusSimulator = ({
  routeGeometry = [],
  isRunning = false,
  speed = 30, // km/h
  onPositionChange,
  busId = 'demo-bus-1',
  busLabel = 'BUS 101',
  resetSignal = 0,
  initialPosition = null,
  stops = [],
  onProgressChange,
}) => {
  const currentIndexRef = useRef(0);
  const currentTraveledMetersRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const speedRef = useRef(speed);
  const isRunningRef = useRef(isRunning);
  const routeCompletedRef = useRef(false);
  const onProgressChangeRef = useRef(onProgressChange);

  // Keep refs up-to-date to avoid unnecessary loop restarts
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const getProgressData = (index, traveledInSegment, routeCompleted = false) => {
    if (!routeGeometry || routeGeometry.length < 2) return null;

    const routeDistances = getRouteDistances(routeGeometry);
    const totalDistance = routeDistances.cumulativeDistances.at(-1) || 0;
    const currentDistance = routeCompleted
      ? totalDistance
      : routeDistances.cumulativeDistances[Math.min(index, routeGeometry.length - 2)] + traveledInSegment;
    const stopDistances = stops.map((stop, sIdx) => {
      if (sIdx === 0) return 0;
      if (sIdx === stops.length - 1) return totalDistance;
      return findRouteDistanceForPosition(routeGeometry, stop, routeDistances);
    });
    let currentStopIndex = 0;
    stopDistances.forEach((stopDistance, stopIndex) => {
      if (currentDistance + 2 >= stopDistance) currentStopIndex = stopIndex;
    });

    return {
      currentStopIndex,
      currentStop: stops[currentStopIndex] || null,
      nextStop: stops[currentStopIndex + 1] || null,
      progress: routeCompleted || totalDistance <= 0
        ? (routeCompleted ? 100 : 0)
        : Math.round((currentDistance / totalDistance) * 100),
      routeCompleted,
    };
  };

  const publishProgress = (index, traveledInSegment, routeCompleted = false) => {
    const progressData = getProgressData(index, traveledInSegment, routeCompleted);
    if (progressData) onProgressChangeRef.current?.(progressData);
    return progressData;
  };

  // Helper to publish the current interpolated position
  const publishCurrentPosition = (index, traveledInSegment, currentSpeed, routeCompleted = false) => {
    if (!routeGeometry || routeGeometry.length < 2) return;

    if (routeCompleted) {
      const finalPoint = routeGeometry[routeGeometry.length - 1];
      const previousPoint = routeGeometry[routeGeometry.length - 2];
      const progressData = publishProgress(routeGeometry.length - 1, 0, true);
      onPositionChangeRef.current?.({
        id: busId,
        latitude: finalPoint[0],
        longitude: finalPoint[1],
        label: busLabel,
        speed: 0,
        heading: Math.round(calculateBearing(
          previousPoint[0], previousPoint[1], finalPoint[0], finalPoint[1],
        )),
        isMoving: false,
        currentStopIndex: progressData?.currentStopIndex ?? 0,
        currentStopId: progressData?.currentStop?._id ?? null,
        nextStopId: null,
        routeProgress: 100,
        routeCompleted: true,
        updatedAt: new Date(),
      });
      return;
    }

    const safeIndex = Math.min(index, routeGeometry.length - 2);
    const pA = routeGeometry[safeIndex];
    const pB = routeGeometry[safeIndex + 1];
    if (!pA || !pB) return;

    const segDist = haversineDistanceMeters(pA[0], pA[1], pB[0], pB[1]);
    const progress = segDist > 0 ? Math.min(1, Math.max(0, traveledInSegment / segDist)) : 0;

    const lat = pA[0] + (pB[0] - pA[0]) * progress;
    const lng = pA[1] + (pB[1] - pA[1]) * progress;
    const heading = Math.round(calculateBearing(pA[0], pA[1], pB[0], pB[1]));

    const progressData = publishProgress(index, traveledInSegment);
    onPositionChangeRef.current?.({
      id: busId,
      latitude: lat,
      longitude: lng,
      label: busLabel,
      speed: currentSpeed,
      heading,
      isMoving: currentSpeed > 0,
      currentStopIndex: progressData?.currentStopIndex ?? 0,
      currentStopId: progressData?.currentStop?._id ?? null,
      nextStopId: progressData?.nextStop?._id ?? null,
      routeProgress: progressData?.progress ?? 0,
      routeCompleted: false,
      updatedAt: new Date(),
    });
  };

  // Handle Reset / Route Geometry Changes
  useEffect(() => {
    const nearestPosition = resetSignal > 0
      ? null
      : findNearestRoutePosition(routeGeometry, initialPosition);
    currentIndexRef.current = nearestPosition?.index ?? 0;
    currentTraveledMetersRef.current = nearestPosition?.traveledMeters ?? 0;
    lastTimestampRef.current = null;
    routeCompletedRef.current = false;

    if (routeGeometry && routeGeometry.length >= 2) {
      publishCurrentPosition(
        currentIndexRef.current,
        currentTraveledMetersRef.current,
        0,
      );
    }
  }, [resetSignal, routeGeometry, initialPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  // Main requestAnimationFrame loop
  useEffect(() => {
    if (!isRunning || !routeGeometry || routeGeometry.length < 2) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      lastTimestampRef.current = null;
      // Preserve the terminal state when completion pauses the simulator.
      if (routeCompletedRef.current) {
        publishCurrentPosition(routeGeometry.length - 1, 0, 0, true);
      } else {
        publishCurrentPosition(
          currentIndexRef.current,
          currentTraveledMetersRef.current,
          0,
        );
      }
      return;
    }

    const step = (timestamp) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      // Delta time in seconds, capped at 0.1s to prevent teleportation on tab switch
      const deltaSec = Math.min(0.1, (timestamp - lastTimestampRef.current) / 1000);
      lastTimestampRef.current = timestamp;

      // Speed in meters per second
      const speedMps = (speedRef.current * 1000) / 3600;
      let distanceToMove = speedMps * deltaSec;

      let idx = currentIndexRef.current;
      let distInSeg = currentTraveledMetersRef.current;

      while (distanceToMove > 0 && routeGeometry.length >= 2) {
        // Stop at the final route coordinate; never wrap to the first stop.
        if (idx >= routeGeometry.length - 1) {
          routeCompletedRef.current = true;
          currentIndexRef.current = routeGeometry.length - 1;
          currentTraveledMetersRef.current = 0;
          publishCurrentPosition(routeGeometry.length - 1, 0, 0, true);
          if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
          return;
        }

        const pA = routeGeometry[idx];
        const pB = routeGeometry[idx + 1];
        const segDist = haversineDistanceMeters(pA[0], pA[1], pB[0], pB[1]);

        if (segDist <= 0.001) {
          idx++;
          distInSeg = 0;
          continue;
        }

        const remainingInSeg = segDist - distInSeg;

        if (distanceToMove < remainingInSeg) {
          distInSeg += distanceToMove;
          distanceToMove = 0;
        } else {
          distanceToMove -= remainingInSeg;
          idx++;
          distInSeg = 0;
        }
      }

      currentIndexRef.current = idx;
      currentTraveledMetersRef.current = distInSeg;

      publishCurrentPosition(idx, distInSeg, speedRef.current);

      if (idx >= routeGeometry.length - 1) {
        routeCompletedRef.current = true;
        publishCurrentPosition(idx, distInSeg, 0, true);
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
        return;
      }

      animFrameIdRef.current = requestAnimationFrame(step);
    };

    animFrameIdRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isRunning, routeGeometry]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default BusSimulator;
