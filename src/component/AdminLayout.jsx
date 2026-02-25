import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/AuthSlice";
import { io } from "socket.io-client";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const gamesContainerRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);

  const API_URL = "https://swordgame-5.onrender.com";

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive
        ? "bg-black text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  /* =========================================================
     SOCKET INITIALIZATION
  ========================================================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${API_URL}/admin`, {
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🛡 Admin socket connected");
      socket.emit("admin:getUsers");
    });

    socket.on("connect_error", (err) =>
      console.error(err.message)
    );

    socket.on("users:list", setUsers);

    socket.on("user:status", ({ userId, online }) =>
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, online } : u
        )
      )
    );

    const handleEvent = (event) => {
      setEvents((prev) => [event, ...prev]);

      switch (event.type) {
        case "GAME_CREATED":
          setGames((prev) => {
            if (prev.some((g) => g.gameId === event.gameId))
              return prev;

            return [
              {
                gameId: event.gameId,
                userId: event.userId,
                pot: event.pot,
                status: event.status,
                enemiesConfigured: false,
              },
              ...prev,
            ];
          });
          break;

        case "ADMIN_CONFIG_ENEMIES":
          setGames((prev) =>
            prev.map((g) =>
              g.gameId === event.gameId
                ? {
                    ...g,
                    enemiesConfigured: true,
                    status: "waiting",
                  }
                : g
            )
          );
          break;

        case "GAME_STARTED":
          setGames((prev) =>
            prev.map((g) =>
              g.gameId === event.gameId
                ? { ...g, status: "started" }
                : g
            )
          );
          break;

        case "GAME_RESULT":
          setGames((prev) =>
            prev.map((g) =>
              g.gameId === event.gameId
                ? { ...g, status: "finished" }
                : g
            )
          );
          break;

        case "ADMIN_ADD_POT":
          setGames((prev) =>
            prev.map((g) =>
              g.gameId === event.gameId
                ? { ...g, pot: event.newPot }
                : g
            )
          );
          break;

        default:
          break;
      }
    };

    socket.on("activity:event", handleEvent);
    socket.on("game:event", handleEvent);

    return () => {
      socket.off("activity:event", handleEvent);
      socket.off("game:event", handleEvent);
      socket.disconnect();
    };
  }, []);

  /* =========================================================
     FETCH / RELOAD GAMES
  ========================================================= */
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/games`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch games");
      }

      const data = await res.json();

      const updatedGames = data.games.map((g) => ({
        ...g,
        enemiesConfigured: g.enemies?.length > 0,
      }));

      setGames(updatedGames);

      if (gamesContainerRef.current) {
        gamesContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error("Error fetching games:", err.message);
      alert(err.message);
    }
  };

  /* =========================================================
     START GAME
  ========================================================= */
  const startGame = async (gameId) => {
    try {
      const res = await fetch("/api/admin/start-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to start game");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  /* =========================================================
     CONFIGURE ENEMIES
  ========================================================= */
  const configureEnemies = async (
    gameId,
    numEnemies = 3
  ) => {
    try {
      const res = await fetch(
        "/api/admin/configure-enemies",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, numEnemies }),
        }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(
          data.message || "Failed to configure enemies"
        );
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  function renderEvent(event) {
    switch (event.type) {
      case "GAME_CREATED":
        return `🎮 Game created by ${event.userId} (pot: ${event.pot})`;
      case "ADMIN_CONFIG_ENEMIES":
        return `👾 Enemies configured (${event.numEnemies})`;
      case "GAME_STARTED":
        return `🚀 Game ${event.gameId} started`;
      case "PLAYER_ATTACK":
        return `⚔️ Enemy hit for ${event.damage}`;
      case "ADMIN_ADD_POT":
        return `💰 Pot increased → ${event.newPot}`;
      case "GAME_RESULT":
        return `🏆 Winner: ${event.winnerId}`;
      default:
        return `⚡ ${event.type}`;
    }
  }

  return (
    <>
      <section className="flex gap-4">
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h1 className="text-xl font-bold mb-3">
            Welcome Admin
          </h1>

          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u._id}
                className="flex justify-between p-2 bg-gray-50 rounded"
              >
                <span>{u.name}</span>
                <span>{u.online ? "Online" : "Offline"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 shadow rounded w-2/3 h-[500px] overflow-y-auto">
          {events.map((event, idx) => (
            <div key={idx}>{renderEvent(event)}</div>
          ))}
        </div>
      </section>
    </>
  );
}