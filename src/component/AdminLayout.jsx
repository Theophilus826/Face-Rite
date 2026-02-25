import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/AuthSlice";
import { io } from "socket.io-client";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
    }`;

  /* =========================================================
     SOCKET INITIALIZATION
  ========================================================= */
  useEffect(() => {
    const socket = io("http://localhost:5000/admin", {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🛡 Admin socket connected");
      socket.emit("admin:getUsers");
    });

    socket.on("users:list", setUsers);

    socket.on("user:status", ({ userId, online }) => {
      setUsers(prev =>
        prev.map(u => (u._id === userId ? { ...u, online } : u))
      );
    });

    socket.on("activity:event", handleEvent);
    socket.on("game:event", handleEvent);

    return () => socket.disconnect();
  }, []);

  /* =========================================================
     HANDLE EVENTS
  ========================================================= */
  const handleEvent = (event) => {
    setEvents(prev => [event, ...prev]);

    switch (event.type) {
      case "GAME_CREATED":
        setGames(prev => {
          if (prev.some(g => g.gameId === event.gameId)) return prev;

          return [
            {
              gameId: event.gameId,
              userId: event.userId,
              pot: event.pot,
              status: "waiting",
              enemiesConfigured: false,
            },
            ...prev,
          ];
        });
        break;

      case "ADMIN_CONFIG_ENEMIES":
        setGames(prev =>
          prev.map(g =>
            g.gameId === event.gameId
              ? { ...g, enemiesConfigured: true }
              : g
          )
        );
        break;

      case "GAME_STARTED":
        setGames(prev =>
          prev.map(g =>
            g.gameId === event.gameId
              ? { ...g, status: "started" }
              : g
          )
        );
        break;

      case "GAME_RESULT":
        setGames(prev =>
          prev.map(g =>
            g.gameId === event.gameId
              ? { ...g, status: "finished" }
              : g
          )
        );
        break;

      case "ADMIN_ADD_POT":
        setGames(prev =>
          prev.map(g =>
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

  /* =========================================================
     FETCH GAMES (IMPORTANT)
  ========================================================= */
  const fetchGames = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/games");

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch games");
      }

      const data = await res.json();

      const updatedGames = data.games.map(g => ({
        ...g,
        enemiesConfigured: g.enemies?.length > 0,
      }));

      setGames(updatedGames);

    } catch (err) {
      console.error("Error fetching games:", err.message);
      alert(err.message);
    }
  };

  /* =========================================================
     CONFIGURE ENEMIES
  ========================================================= */
  const configureEnemies = async (gameId) => {
    try {
      const res = await fetch("http://localhost:5000/api/game/configure-enemies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  /* =========================================================
     START GAME
  ========================================================= */
  const startGame = async (gameId) => {
    try {
      const res = await fetch("http://localhost:5000/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  /* =========================================================
     EVENT RENDERING
  ========================================================= */
  function renderEvent(event) {
    switch (event.type) {
      case "GAME_CREATED":
        return `🎮 Game created by ${event.userId}`;

      case "ADMIN_CONFIG_ENEMIES":
        return `👾 Enemies configured`;

      case "GAME_STARTED":
        return `🚀 Game started`;

      case "PLAYER_ATTACK":
        return `⚔️ Enemy hit (${event.damage})`;

      case "GAME_RESULT":
        return `🏆 Winner: ${event.winnerId}`;

      default:
        return `⚡ ${event.type}`;
    }
  }

  /* =========================================================
     UI
  ========================================================= */
  return (
    <>
      {/* USERS + ACTIVITY */}
      <section className="flex gap-4">
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h2 className="text-lg font-semibold mb-2">Users</h2>

          {users.map(user => (
            <div key={user._id} className="flex justify-between p-2 bg-gray-50 rounded mb-2">
              <span>{user.name}</span>
              <span>{user.online ? "🟢" : "🟣"}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 shadow rounded w-2/3 h-[500px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">🔥 Activity</h2>

          {events.map((event, idx) => (
            <div key={idx} className="p-2 mb-2 bg-gray-50 border rounded">
              {renderEvent(event)}
            </div>
          ))}
        </div>
      </section>

      {/* GAME CONTROLLER */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-semibold">🎮 Games</h2>

          <button
            onClick={fetchGames}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
          >
            🔄 Reload Games
          </button>
        </div>

        {games.map(game => (
          <div key={game.gameId} className="flex justify-between p-2 bg-gray-50 rounded mb-2">

            <div>
              Game {game.gameId.slice(0, 6)}
              <div className="text-xs text-gray-500">
                Player: {game.userId}
              </div>
            </div>

            <div className="flex items-center gap-2">

              <span className="text-yellow-600">
                Pot: {game.pot}
              </span>

              {game.status === "waiting" && !game.enemiesConfigured && (
                <button
                  onClick={() => configureEnemies(game.gameId)}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                >
                  Configure Enemies
                </button>
              )}

              {game.status === "waiting" && game.enemiesConfigured && (
                <button
                  onClick={() => startGame(game.gameId)}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                >
                  Start Game
                </button>
              )}

              <span className="text-xs">{game.status}</span>
            </div>
          </div>
        ))}
      </section>

      {/* SIDEBAR */}
      <section>
        <div className="flex min-h-screen bg-gray-100 mt-4">
          <aside className="w-64 bg-white shadow-lg p-4">
            <nav className="space-y-2">
              <NavLink to="/admin/monitor" className={linkClass}>Monitor</NavLink>
            </nav>

            <button
              onClick={() => dispatch(logout())}
              className="mt-10 w-full bg-red-500 text-white py-2 rounded"
            >
              Logout
            </button>
          </aside>

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </section>
    </>
  );
}
