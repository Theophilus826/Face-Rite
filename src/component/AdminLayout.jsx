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
    `block px-4 py-2 rounded ${isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"}`;

  /* =======================
     SOCKET INITIALIZATION
  ======================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("https://swordgame-5.onrender.com/admin", {
      path: "/socket.io",
      withCredentials: true,
      auth: { token },
      reconnection: true,
    });

    socketRef.current = socket;

    const init = () => {
      console.log("🛡 Admin connected");
      socket.emit("admin:getUsers");
      socket.emit("admin:getGames");
    };

    socket.on("connect", init);
    socket.on("reconnect", init);

    /* =======================
       USER EVENTS
    ======================= */
    socket.on("users:list", setUsers);
    socket.on("user:status", ({ userId, online }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, online } : u))
      );
    });

    /* =======================
       GAME EVENTS (LIVE STREAM)
       Only receive game:event and activity:event
    ======================= */
    const handleGameEvent = (event) => {
      setEvents((prev) => [event, ...prev]);

      setGames((prev) => {
        let existingGame = prev.find((g) => g.gameId === event.gameId);

        // If this is a new game, add it
        if (!existingGame) {
          const newGame = {
            gameId: event.gameId,
            hostId: event.hostId || null,
            status: event.status || "waiting",
            pot: event.pot || 0,
            numEnemies: event.numEnemies || 0,
            players: event.players || [],
            enemiesConfigured: event.enemiesConfigured || false,
          };
          return [newGame, ...prev];
        }

        // Update existing game based on event type
        return prev.map((g) => {
          if (g.gameId !== event.gameId) return g;

          switch (event.type) {
            case "PLAYER_JOINED":
              return { ...g, players: [...new Set([...(g.players || []), event.userId])] };
            case "PLAYER_DISCONNECTED":
              return { ...g, players: (g.players || []).filter((id) => id !== event.userId) };
            case "ENEMIES_CONFIGURED":
              return { ...g, enemiesConfigured: true, numEnemies: event.enemies };
            case "ADMIN_ADD_POT":
              return { ...g, pot: event.newPot };
            case "GAME_STARTED":
              return { ...g, status: "started", pot: event.pot, numEnemies: event.enemies };
            case "GAME_RESULT":
              return { ...g, status: "finished" };
            default:
              return g;
          }
        });
      });
    };

    socket.on("activity:event", handleGameEvent);
    socket.on("game:event", handleGameEvent);

    return () => socket.disconnect();
  }, []);

  /* =======================
     UI
  ======================= */
  return (
    <>
      {/* USERS + LIVE EVENTS */}
      <section className="flex gap-4">
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h1 className="text-xl font-bold mb-3">Welcome Admin</h1>
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u._id} className="flex justify-between p-2 bg-gray-50 rounded">
                <span>{u.name}</span>
                <span className={`text-sm ${u.online ? "text-green-600" : "text-gray-400"}`}>
                  {u.online ? "Online" : "Offline"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 shadow rounded w-2/3 h-[500px] overflow-y-auto">
          <h2 className="font-semibold mb-2">🔥 Live Activity</h2>
          {events.map((event, i) => (
            <div key={i} className="text-sm border p-2 mb-2 rounded bg-gray-50">
              {event.type}
              {event.enemies && ` - Enemies: ${event.enemies}`}
              {event.newPot && ` - Pot: ${event.newPot}`}
            </div>
          ))}
        </div>
      </section>

      {/* LIVE GAME CONTROLLER */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-3">🎮 Live Game Controller</h2>
        <div className="max-h-[400px] overflow-y-auto">
          {games.map((game) => (
            <div key={game.gameId} className="p-3 mb-3 bg-gray-50 rounded border">
              <div className="font-semibold">Game {game.gameId?.slice(0, 6)}</div>
              <div className="text-sm text-gray-500">Host: {game.hostId || "N/A"}</div>
              <div className="text-yellow-600 text-sm">Pot: {game.pot}</div>
              <div className="text-xs mt-1">
                Players: {game.players?.join(", ") || "None"}
              </div>

              {game.enemiesConfigured && (
                <div className="text-sm text-red-600 mt-2">⚔️ Enemies deployed: {game.numEnemies}</div>
              )}

              {game.status === "started" && (
                <div className="text-sm text-green-600 mt-2">🟢 Game started</div>
              )}

              {game.status === "finished" && (
                <div className="text-sm text-gray-600 mt-2">🏁 Game finished</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SIDEBAR */}
      <section>
        <div className="flex min-h-screen bg-gray-100 mt-4">
          <aside className="w-64 bg-white shadow-lg p-4">
            <h1 className="text-xl font-bold text-center mb-6">🛡 Admin Panel</h1>
            <nav className="space-y-2">
              <NavLink to="/admin/monitor" className={linkClass}>🎮 Live Monitor</NavLink>
              <NavLink to="/admin/credit-coins" className={linkClass}>💰 Credit/Debit Coins</NavLink>
              <NavLink to="/admin/host-game" className={linkClass}>🎲 Host 1v1 Game</NavLink>
              <NavLink to="/admin/transactions" className={linkClass}>📜 Transactions</NavLink>
            </nav>
            <button
              onClick={() => dispatch(logout())}
              className="mt-10 w-full bg-red-500 text-white py-2 rounded"
            >
              Logout
            </button>
          </aside>
          <main className="flex-1 p-6"><Outlet /></main>
        </div>
      </section>
    </>
  );
}
