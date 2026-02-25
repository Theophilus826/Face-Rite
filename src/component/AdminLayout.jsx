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
    const socket = io("https://swordgame-5.onrender.com/admin", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🛡 Admin socket connected");
      socket.emit("admin:getUsers");
      socket.emit("admin:getGames"); // fetch existing games
    });

    // ====== Users ======
    socket.on("users:list", setUsers);
    socket.on("user:status", ({ userId, online }) =>
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, online } : u))
      )
    );

    // ====== Game events ======
    socket.on("game:created", (game) => {
      setEvents((prev) => [{ ...game, type: "GAME_CREATED" }, ...prev]);
      setGames((prev) => [game, ...prev]);
    });

    socket.on("game:enemiesConfigured", ({ gameId, enemies }) => {
      setEvents((prev) => [
        { type: "ADMIN_CONFIG_ENEMIES", gameId, numEnemies: enemies.length, timestamp: Date.now() },
        ...prev,
      ]);
      setGames((prev) =>
        prev.map((g) => (g.gameId === gameId ? { ...g, enemies } : g))
      );
    });

    socket.on("game:started", ({ gameId }) => {
      setEvents((prev) => [
        { type: "GAME_STARTED", gameId, timestamp: Date.now() },
        ...prev,
      ]);
      setGames((prev) =>
        prev.map((g) => (g.gameId === gameId ? { ...g, status: "started" } : g))
      );
    });

    socket.on("game:finished", ({ gameId, winnerId, creditedCoins }) => {
      setEvents((prev) => [
        { type: "GAME_RESULT", gameId, winnerId, creditedCoins, timestamp: Date.now() },
        ...prev,
      ]);
      setGames((prev) =>
        prev.map((g) =>
          g.gameId === gameId ? { ...g, status: "finished", winnerId } : g
        )
      );
    });

    socket.on("game:potUpdated", ({ gameId, newPot }) => {
      setEvents((prev) => [
        { type: "ADMIN_ADD_POT", gameId, newPot, timestamp: Date.now() },
        ...prev,
      ]);
      setGames((prev) =>
        prev.map((g) => (g.gameId === gameId ? { ...g, pot: newPot } : g))
      );
    });

    return () => {
      socket.off("users:list");
      socket.off("user:status");
      socket.off("game:created");
      socket.off("game:enemiesConfigured");
      socket.off("game:started");
      socket.off("game:finished");
      socket.off("game:potUpdated");
      socket.disconnect();
    };
  }, []);

  /* =========================================================
     EVENT RENDERING
  ========================================================= */
  function renderEvent(event) {
    switch (event.type) {
      case "GAME_CREATED":
        return `🎮 Game created by ${event.userId} (pot: ${event.pot})`;
      case "ADMIN_CONFIG_ENEMIES":
        return `👾 Enemies configured (${event.numEnemies})`;
      case "GAME_STARTED":
        return `🚀 Game ${event.gameId} started`;
      case "PLAYER_ATTACK":
        return `⚔️ Enemy hit for ${event.damage} (HP: ${event.remainingHealth})`;
      case "ADMIN_ADD_POT":
        return `💰 Pot updated → ${event.newPot}`;
      case "GAME_RESULT":
        return `🏆 Winner: ${event.winnerId} (+${event.creditedCoins})`;
      default:
        return `⚡ ${event.type}`;
    }
  }

  /* =========================================================
     UI
  ========================================================= */
  return (
    <>
      {/* ================= USERS + ACTIVITY ================= */}
      <section className="flex gap-4">
        {/* USERS PANEL */}
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h1 className="text-xl font-bold mb-3">Welcome Admin</h1>
          <h2 className="text-lg font-semibold mb-2">Users</h2>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${user.online ? "bg-green-500" : "bg-purple-500"}`} />
                  <span className="text-gray-800">{user.name}</span>
                </div>
                <span className="text-sm text-gray-500">{user.online ? "Online" : "Offline"}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ACTIVITY FEED */}
        <div className="bg-white p-4 shadow rounded w-2/3 h-[500px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">🔥 Live Activity Monitor</h2>
          {events.length === 0 && <p className="text-gray-500">Waiting for activity...</p>}
          {events.map((event, idx) => (
            <div key={idx} className="p-2 mb-2 bg-gray-50 border rounded">
              <p className="text-sm">{renderEvent(event)}</p>
              <span className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= GAME CONTROLLER ================= */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <h2 className="text-lg font-semibold mb-3">🎮 Live Game Controller</h2>
        {games.length === 0 && <p className="text-gray-500">No active games</p>}
        {games.map((game) => (
          <div key={game.gameId} className="flex justify-between items-center p-2 mb-2 bg-gray-50 rounded">
            <div>
              <div className="text-sm font-semibold">Game {game.gameId.slice(0, 6)}</div>
              <div className="text-xs text-gray-500">Player: {game.userId}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-yellow-600 text-sm">Pot: {game.pot}</div>
              <div
                className={`text-xs px-2 py-1 rounded ${
                  game.status === "waiting"
                    ? "bg-yellow-100 text-yellow-700"
                    : game.status === "started"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {game.status}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ================= SIDEBAR ================= */}
      <section>
        <div className="flex min-h-screen bg-gray-100 mt-4">
          <aside className="w-64 bg-white shadow-lg p-4">
            <h1 className="text-xl font-bold mb-6 text-center">🛡 Admin Panel</h1>
            <nav className="space-y-2">
              <NavLink to="/admin/monitor" className={linkClass}>🎮 Live Monitor</NavLink>
              <NavLink to="/admin/credit-coins" className={linkClass}>💰 Credit/Debit Coins</NavLink>
              <NavLink to="/admin/host-game" className={linkClass}>🎲 Host 1v1 Game</NavLink>
              <NavLink to="/admin/transactions" className={linkClass}>📜 Transaction History</NavLink>
            </nav>
            <button onClick={() => dispatch(logout())} className="mt-10 w-full bg-red-500 text-white py-2 rounded">Logout</button>
          </aside>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </section>
    </>
  );
}