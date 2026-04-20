const rawApiUrl = import.meta.env.VITE_API_URL || "https://eaxmbook-1.onrender.com";
export const VITE_API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;
export const API_BASE_URL = `${VITE_API_URL}/api`;

