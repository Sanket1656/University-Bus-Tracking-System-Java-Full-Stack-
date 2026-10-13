export const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  : '-';

export const formatTime = (value) => value
  ? new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  : '-';

export const formatDuration = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) return '-';
  const minutes = Math.max(0, Math.round((new Date(endedAt) - new Date(startedAt)) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
};
