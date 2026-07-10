import Echo from "laravel-echo";
import Pusher from "pusher-js";
import api from "./api";

window.Pusher = Pusher;

// Tentukan konfigurasi secara dinamis berdasarkan URL backend dari Axios api client
const apiBaseURL = api.defaults.baseURL || "http://localhost:8000/api";
let wsHost = "localhost";
let wsPort = 8080;
let wssPort = 8080;
let forceTLS = false;
let scheme = "http";

try {
  const url = new URL(apiBaseURL);
  wsHost = url.hostname;
  
  // Di produksi (HTTPS), Reverb di-proxy oleh Nginx/Caddy ke port standar 443 wss.
  // Di lokal (HTTP), Reverb berjalan langsung di port 8080.
  if (url.protocol === "https:") {
    scheme = "https";
    forceTLS = true;
    wsPort = 443;
    wssPort = 443;
  } else {
    scheme = "http";
    forceTLS = false;
    wsPort = 8080;
    wssPort = 8080;
  }
} catch (e) {
  console.error("Gagal melakukan parsing API Base URL di Echo setup:", e);
}

// Gunakan VITE env variables jika didefinisikan, jika tidak fallback ke hasil deteksi dinamis di atas
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || "6yqsri0hpr2puh8zvvcr";
const reverbHost = import.meta.env.VITE_REVERB_HOST || wsHost;
const reverbPort = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT, 10) : wsPort;
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || scheme;

const echo = new Echo({
  broadcaster: "reverb",
  key: reverbKey,
  wsHost: reverbHost,
  wsPort: reverbPort,
  wssPort: reverbPort,
  forceTLS: reverbScheme === "https" || forceTLS,
  enabledTransports: ["ws", "wss"],
  
  // Arahkan endpoint otorisasi channel private ke backend Laravel
  authEndpoint: `${apiBaseURL}/broadcasting/auth`,
  auth: {
    headers: {
      // Selalu sertakan token akses terbaru dari localStorage untuk otentikasi Sanctum
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      Accept: "application/json",
    },
  },
});

export default echo;
