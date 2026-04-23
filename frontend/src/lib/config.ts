// Auto-detect environment: local development vs production
// Use window.location at runtime to detect properly
const getIsLocalhost = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

const isLocalhost = getIsLocalhost();

// Priority: 1. Env variable, 2. Auto-detect local, 3. Default live URL
const rawApiUrl = import.meta.env.VITE_API_URL || 
  (isLocalhost ? "http://localhost:5000" : "https://eaxmbook-1.onrender.com");

export const VITE_API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;
export const API_BASE_URL = `${VITE_API_URL}/api`;

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📍 Hostname:', window.location?.hostname);
console.log('🏠 Is Localhost:', isLocalhost);

