const LIVE_THRESHOLD_SECONDS = 15;
const STALE_THRESHOLD_SECONDS = 60;

export const getLocationStatus = (updatedAt, now = Date.now()) => {
  if (!updatedAt) {
    return { status: 'offline', label: 'Offline' };
  }

  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return { status: 'offline', label: 'Offline' };
  }

  const ageSeconds = Math.max(0, (now - timestamp) / 1000);

  if (ageSeconds < LIVE_THRESHOLD_SECONDS) {
    return { status: 'live', label: 'Live' };
  }

  if (ageSeconds <= STALE_THRESHOLD_SECONDS) {
    return { status: 'stale', label: 'Stale' };
  }

  return { status: 'offline', label: 'Offline' };
};

export const getLocationAgeLabel = (updatedAt, now = Date.now()) => {
  if (!updatedAt) return 'No update';

  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) return 'No update';

  const ageSeconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (ageSeconds < 2) return 'just now';
  return `${ageSeconds} sec ago`;
};

export { LIVE_THRESHOLD_SECONDS, STALE_THRESHOLD_SECONDS };
