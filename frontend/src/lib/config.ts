// Auto-detect environment: local development vs production
// Use window.location at runtime to detect properly
const getIsLocalhost = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

console.log("window.location.hostname--------------", window.location.hostname)
const isLocalhost = getIsLocalhost();

console.log("isLocalhost--------------", isLocalhost)
// Priority: 1. Env variable, 2. Auto-detect local, 3. Default live URL
const rawApiUrl = isLocalhost ? "http://localhost:3001" : "https://eaxmbook-1.onrender.com"

export const VITE_API_URL = rawApiUrl;
export const API_BASE_URL = `${VITE_API_URL}/api`;

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📍 Hostname:', window.location?.hostname);
console.log('🏠 Is Localhost:', isLocalhost);

