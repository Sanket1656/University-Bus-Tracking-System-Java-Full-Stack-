/**
 * Resolves uploaded media URLs consistently across development and production environments.
 * - Handles null/empty paths gracefully
 * - Strips legacy hardcoded `localhost:5000` or `127.0.0.1:5000` from database records so images work on deployed domains
 * - Supports relative paths (e.g. `/uploads/bus/image.png`) by prepending the backend server origin
 * - Avoids double-prepending the base URL
 * - Preserves external absolute URLs (e.g. `https://s3.amazonaws.com/...`, `https://cdn...`)
 * - Preserves base64/data URLs (e.g. `data:image/...` from FileReader previews)
 *
 * @param {string|null|undefined} path - The media path or URL from the API or database
 * @returns {string|null} - The fully resolved URL, or null if input was empty
 */
export const resolveMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  // Preserve data URLs and blob URLs (e.g. client previews)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Determine backend server origin from VITE_API_BASE_URL / VITE_API_URL or production/dev fallback
  const rawApiUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
  	? 'https://32-236-20-138.nip.io/api'
  	: 'http://localhost:5000/api');
  // Remove trailing /api or /api/ to get backend root server URL
  const serverOrigin = rawApiUrl.trim().replace(/\/api\/?$/, '');

  // Detect and strip legacy hardcoded localhost/127.0.0.1 ports (e.g., http://localhost:5000/uploads/...)
  // This provides safe backwards compatibility for database records saved before this migration
  let cleanPath = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000\/?/i, '/');

  // If already prefixed with the current serverOrigin, return it without double-prepending
  if (serverOrigin && cleanPath.startsWith(serverOrigin)) {
    return cleanPath;
  }

  // If it's an external absolute URL (not pointing to legacy localhost), return as-is
  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath;
  }

  // Normalize relative path: ensure single leading slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  // If serverOrigin is empty (e.g. when VITE_API_URL is relative proxy like '/api'), return relative path
  if (!serverOrigin) {
    return cleanPath;
  }

  return `${serverOrigin.replace(/\/+$/, '')}${cleanPath}`;
};

export default resolveMediaUrl;
