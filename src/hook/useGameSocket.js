import { useEffect } from "react";
import { getSocket } from "../component/socket";

export function useGameSocket(handlers = {}) {
  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    /* ================= CONNECTION ================= */

    if (handlers.onConnect) {
      socket.on("connect", handlers.onConnect);
    }

    if (handlers.onDisconnect) {
      socket.on("disconnect", handlers.onDisconnect);
    }

    /* ================= CUSTOM EVENTS ================= */

    Object.entries(handlers).forEach(([event, handler]) => {
      if (event.startsWith("on") && event !== "onConnect" && event !== "onDisconnect") {
        const socketEvent = event.replace("on", "");
        socket.on(socketEvent, handler);
      }
    });

    return () => {
      if (handlers.onConnect) socket.off("connect", handlers.onConnect);
      if (handlers.onDisconnect) socket.off("disconnect", handlers.onDisconnect);

      Object.entries(handlers).forEach(([event, handler]) => {
        if (event.startsWith("on") && event !== "onConnect" && event !== "onDisconnect") {
          const socketEvent = event.replace("on", "");
          socket.off(socketEvent, handler);
        }
      });
    };
  }, []);
}