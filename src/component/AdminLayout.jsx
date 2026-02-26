import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/AuthSlice";
import { io } from "socket.io-client";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const gamesContainerRef = useRef(null); // ← ref for scrolling

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"}`;

  /* =========================================================
     SOCKET INITIALIZATION
  ========================================================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("https://swordgame-5.onrender.com/admin", {
      withCredentials: true,
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🛡 Admin socket connected");
      socket.emit("admin:getUsers");
    });

    socket.on("connect_error", (err) => console.error(err.message));
    socket.on("users:list", setUsers);
    socket.on("user:status", ({ userId, online }) =>
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, online } : u))
    );

    const handleEvent = (event) => {
      setEvents(prev => [event, ...prev]);
      switch (event.type) {
        case "GAME_CREATED":
          setGames(prev => {
            if (prev.some(g => g.gameId === event.gameId)) return prev;
            return [{ gameId: event.gameId, userId: event.userId, pot: event.pot, status: event.status, enemiesConfigured: false }, ...prev];
          });
          break;
        case "ADMIN_CONFIG_ENEMIES":
          setGames(prev =>
            prev.map(g => g.gameId === event.gameId ? { ...g, enemiesConfigured: true, status: "waiting" } : g)
          );
          break;
        case "GAME_STARTED":
          setGames(prev =>
            prev.map(g => g.gameId === event.gameId ? { ...g, status: "started" } : g)
          );
          break;
        case "GAME_RESULT":
          setGames(prev =>
            prev.map(g => g.gameId === event.gameId ? { ...g, status: "finished" } : g)
          );
          break;
        case "ADMIN_ADD_POT":
          setGames(prev =>
            prev.map(g => g.gameId === event.gameId ? { ...g, pot: event.newPot } : g)
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

    // ✅ Handle non-JSON errors (404 / proxy / server crash)
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch games");
    }

    const data = await res.json();  // ✅ Now safe

    const updatedGames = data.games.map(g => ({
      ...g,
      enemiesConfigured: g.enemies?.length > 0,
    }));

    setGames(updatedGames);

    // Auto-scroll to top when new games are loaded
    if (gamesContainerRef.current) {
      gamesContainerRef.current.scrollTop = 0;
    }

  } catch (err) {
    console.error("Error fetching games:", err.message);
    alert(err.message);
  }
};

  /* =========================================================
     START GAME FUNCTION
  ========================================================= */
  const startGame = async (gameId) => {
  try {
    const res = await fetch(`${API_URL}/api/admin/start-game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to start game");

  } catch (err) {
    console.error("Error starting game:", err.message);
    alert(err.message);
  }
};

  /* =========================================================
     CONFIGURE ENEMIES FUNCTION
  ========================================================= */
  const configureEnemies = async (gameId, numEnemies = 3) => {
  try {
    const res = await fetch(`${API_URL}/api/admin/configure-enemies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, numEnemies }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to configure enemies");

  } catch (err) {
    console.error("Error configuring enemies:", err.message);
    alert(err.message);
  }
};

  /* =========================================================
     EVENT RENDERING
  ========================================================= */
  function renderEvent(event) {
    switch (event.type) {
      case "GAME_CREATED": return `🎮 Game created by ${event.userId} (pot: ${event.pot})`;
      case "ADMIN_CONFIG_ENEMIES": return `👾 Enemies configured (${event.numEnemies})`;
      case "GAME_STARTED": return `🚀 Game ${event.gameId} started`;
      case "PLAYER_ATTACK": return `⚔️ Enemy hit for ${event.damage} (HP: ${event.remainingHealth})`;
      case "ADMIN_ADD_POT": return `💰 Pot increased (+${event.amount}) → ${event.newPot}`;
      case "GAME_RESULT": return `🏆 Winner: ${event.winnerId} (+${event.creditedCoins})`;
      default: return `⚡ ${event.type}`;
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
          <h1 className="text-xl font-bold mb-3">Welcome Admin</h1>
          <h2 className="text-lg font-semibold mb-2">Users</h2>
          <ul className="space-y-2">
            {users.map(u => (
              <li key={u._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${u.online ? "bg-green-500" : "bg-purple-500"}`}/>
                  <span className="text-gray-800">{u.name}</span>
                </div>
                <span className="text-sm text-gray-500">{u.online ? "Online" : "Offline"}</span>
              </li>
            ))}
          </ul>
        </div>

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

      {/* LIVE GAME CONTROLLER */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">🎮 Live Game Controller</h2>
          <button
            onClick={fetchGames}
            className="px-3 py-1 text-white bg-indigo-600 rounded text-sm"
          >
            🔄 Reload Games
          </button>
        </div>

        <div ref={gamesContainerRef} className="max-h-[400px] overflow-y-auto">
          {games.length === 0 && <p className="text-gray-500">No active games</p>}

          {games.map(game => (
            <div key={game.gameId} className="flex justify-between items-center p-2 mb-2 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-semibold">Game {game.gameId.slice(0, 6)}</div>
                <div className="text-xs text-gray-500">Player: {game.userId}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-yellow-600 text-sm">Pot: {game.pot}</div>
                <div className="flex gap-2">
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      game.status === "waiting"
                        ? game.enemiesConfigured
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                        : game.status === "started"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {game.status === "waiting"
                      ? game.enemiesConfigured
                        ? "Ready to start"
                        : "Waiting for enemies"
                      : game.status === "started"
                      ? "Started"
                      : "Finished"}
                  </div>

                  {game.status === "waiting" && !game.enemiesConfigured && (
                    <button
                      onClick={() => configureEnemies(game.gameId)}
                      className="px-3 py-1 text-white bg-blue-600 rounded text-xs"
                    >
                      Configure Enemies
                    </button>
                  )}

                  {game.status === "waiting" && game.enemiesConfigured && (
                    <button
                      onClick={() => startGame(game.gameId)}
                      className="px-3 py-1 text-white bg-green-600 rounded text-xs"
                    >
                      Start Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SIDEBAR */}
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
          <main className="flex-1 p-6"><Outlet /></main>
        </div>
      </section>
    </>
  );
}