import { io } from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "https://swordgame-5.onrender.com";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      withCredentials: true,

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,

      transports: ["websocket", "polling"], // ✅ Render-safe
    });
  }

  return socket;
}