// export const backendUrl = "https://eaxmbook-1.onrender.com/api";
// export const base_url = "https://eaxmbook-1.onrender.com/api";


export const base_url = window.location.hostname === "localhost" ? "http://localhost:3001" : `${window.location.origin}/api/`;
