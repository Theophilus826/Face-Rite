import { useEffect, useState } from "react";
import io from "socket.io-client";

export default function AdminLiveMonitor() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = io("https://swordgame-5.onrender.com/admin", {
      withCredentials: true,
    });

    socket.on("activity:event", (event) => {
      setEvents((prev) => [event, ...prev]);
    });

    socket.on("connect", () => {
      console.log("✅ Admin socket connected");
    });

    socket.on("disconnect", () => {
      console.log("❌ Admin socket disconnected");
    });

    return () => {
      socket.disconnect(); // ✅ VERY important cleanup
    };
  }, []);

  const renderEvent = (event) => {
    switch (event.type) {
      case "USER_ONLINE":
        return `🟢 ${event.username} came online`;

      case "USER_OFFLINE":
        return `🟣 ${event.username} went offline`;

      case "BET_PLACED":
        return `🎯 ${event.username} placed ${event.amount} coins`;

      case "GAME_CREATED":
        return `🎮 ${event.username} created a game`;

      case "GAME_RESULT":
        return `🏆 ${event.username} ${event.result}`;

      case "COINS_CREDITED":
        return `💰 ${event.username} credited ${event.amount}`;

      default:
        return `⚡ Unknown activity`;
    }
  };

  return (
    <div className="bg-white p-4 shadow rounded">
      <h2 className="text-xl font-bold mb-4">
        🔥 Live Activity Monitor
      </h2>

      <div className="h-[500px] overflow-y-auto space-y-2">
        {events.length === 0 && (
          <p className="text-gray-500">Waiting for activity...</p>
        )}

        {events.map((event, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 rounded border"
          >
            <p className="text-sm">{renderEvent(event)}</p>

            <span className="text-xs text-gray-400">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}