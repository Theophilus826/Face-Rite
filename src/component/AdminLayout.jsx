import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/AuthSlice";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminLayout() {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const gamesContainerRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [joinInputs, setJoinInputs] = useState({}); // 🔥 per-game join input

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

    const socket = io("https://swordgame-5.onrender.com/admin", {
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🛡 Admin socket connected");
      socket.emit("admin:getUsers");
    });

    socket.on("connect_error", (err) =>
      console.error("Socket Error:", err.message)
    );

    socket.on("users:list", setUsers);

    socket.on("user:status", ({ userId, online }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, online } : u
        )
      );
    });

    const handleEvent = (event) => {
      setEvents((prev) => [event, ...prev]);

      setGames((prev) => {
        switch (event.type) {
          case "GAME_CREATED":
            if (prev.some((g) => g.gameId === event.gameId))
              return prev;

            return [
              {
                gameId: event.gameId,
                userId: event.userId,
                pot: event.pot || 0,
                status: "waiting",
                enemiesConfigured: false,
                players: [event.userId],
              },
              ...prev,
            ];

          case "ADMIN_CONFIG_ENEMIES":
            return prev.map((g) =>
              g.gameId === event.gameId
                ? { ...g, enemiesConfigured: true }
                : g
            );

          case "GAME_STARTED":
            return prev.map((g) =>
              g.gameId === event.gameId
                ? { ...g, status: "started" }
                : g
            );

          case "ADMIN_ADD_POT":
            return prev.map((g) =>
              g.gameId === event.gameId
                ? { ...g, pot: event.newPot }
                : g
            );

          case "GAME_RESULT":
            return prev.map((g) =>
              g.gameId === event.gameId
                ? {
                    ...g,
                    status: "finished",
                    winnerId: event.winnerId,
                    creditedCoins: event.creditedCoins,
                  }
                : g
            );

          case "PLAYER_JOINED":
            return prev.map((g) =>
              g.gameId === event.gameId
                ? {
                    ...g,
                    players: [
                      ...new Set([
                        ...(g.players || []),
                        event.playerId,
                      ]),
                    ],
                  }
                : g
            );

          default:
            return prev;
        }
      });
    };

    socket.on("activity:event", handleEvent);
    socket.on("game:event", handleEvent);

    return () => {
      socket.disconnect();
    };
  }, []);

  /* =========================================================
     FETCH GAMES
  ========================================================= */
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/games`);
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      const updated = data.games.map((g) => ({
        ...g,
        enemiesConfigured: g.enemies?.length > 0,
      }));

      setGames(updated);

      if (gamesContainerRef.current) {
        gamesContainerRef.current.scrollTop = 0;
      }
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
      const res = await fetch(
        `${API_URL}/api/admin/start-game`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
    } catch (err) {
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
        `${API_URL}/api/admin/configure-enemies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, numEnemies }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
    } catch (err) {
      alert(err.message);
    }
  };

  /* =========================================================
     FORCE JOIN PLAYER (SOCKET)
  ========================================================= */
  const forceJoinPlayer = (gameId) => {
    const playerId = joinInputs[gameId];

    if (!playerId)
      return alert("Enter Player ID");

    socketRef.current.emit("admin:forceJoin", {
      gameId,
      playerId,
    });

    setJoinInputs((prev) => ({
      ...prev,
      [gameId]: "",
    }));
  };

  /* =========================================================
     EVENT RENDER
  ========================================================= */
  const renderEvent = (event) => {
    switch (event.type) {
      case "GAME_CREATED":
        return `🎮 Game created by ${event.userId}`;
      case "GAME_STARTED":
        return `🚀 Game started`;
      case "PLAYER_JOINED":
        return `👤 Player ${event.playerId} joined`;
      case "GAME_RESULT":
        return `🏆 Winner: ${event.winnerId}`;
      default:
        return `⚡ ${event.type}`;
    }
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <>
      {/* USERS + ACTIVITY */}
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
                <span
                  className={`text-sm ${
                    u.online
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {u.online
                    ? "Online"
                    : "Offline"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 shadow rounded w-2/3 h-[500px] overflow-y-auto">
          <h2 className="font-semibold mb-2">
            🔥 Live Activity
          </h2>

          {events.map((event, i) => (
            <div
              key={i}
              className="text-sm border p-2 mb-2 rounded bg-gray-50"
            >
              {renderEvent(event)}
            </div>
          ))}
        </div>
      </section>

      {/* LIVE GAME CONTROLLER */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <div className="flex justify-between mb-3">
          <h2 className="font-semibold">
            🎮 Live Game Controller
          </h2>

          <button
            onClick={fetchGames}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
          >
            Reload
          </button>
        </div>

        <div
          ref={gamesContainerRef}
          className="max-h-[400px] overflow-y-auto"
        >
          {games.length === 0 && (
            <p>No active games</p>
          )}

          {games.map((game) => (
            <div
              key={game.gameId}
              className="p-3 mb-3 bg-gray-50 rounded border"
            >
              <div className="font-semibold">
                Game {game.gameId.slice(0, 6)}
              </div>

              <div className="text-sm text-gray-500">
                Host: {game.userId}
              </div>

              <div className="text-yellow-600 text-sm">
                Pot: {game.pot}
              </div>

              <div className="text-xs mt-1">
                Players:{" "}
                {game.players?.join(", ") ||
                  "None"}
              </div>

              {/* JOIN PLAYER */}
              {game.status === "waiting" && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Player ID"
                    value={
                      joinInputs[game.gameId] || ""
                    }
                    onChange={(e) =>
                      setJoinInputs((prev) => ({
                        ...prev,
                        [game.gameId]:
                          e.target.value,
                      }))
                    }
                    className="border px-2 py-1 text-xs rounded"
                  />

                  <button
                    onClick={() =>
                      forceJoinPlayer(
                        game.gameId
                      )
                    }
                    className="bg-purple-600 text-white px-2 py-1 text-xs rounded"
                  >
                    ➕ Join
                  </button>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {!game.enemiesConfigured && (
                  <button
                    onClick={() =>
                      configureEnemies(
                        game.gameId
                      )
                    }
                    className="bg-blue-600 text-white px-2 py-1 text-xs rounded"
                  >
                    Configure Enemies
                  </button>
                )}

                {game.enemiesConfigured &&
                  game.status ===
                    "waiting" && (
                    <button
                      onClick={() =>
                        startGame(
                          game.gameId
                        )
                      }
                      className="bg-green-600 text-white px-2 py-1 text-xs rounded"
                    >
                      Start Game
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SIDEBAR */}
      <section>
        <div className="flex min-h-screen bg-gray-100 mt-4">
          <aside className="w-64 bg-white shadow-lg p-4">
            <h1 className="text-xl font-bold text-center mb-6">
              🛡 Admin Panel
            </h1>

            <nav className="space-y-2">
              <NavLink
                to="/admin/monitor"
                className={linkClass}
              >
                🎮 Live Monitor
              </NavLink>
              <NavLink
                to="/admin/credit-coins"
                className={linkClass}
              >
                💰 Credit/Debit Coins
              </NavLink>
              <NavLink
                to="/admin/host-game"
                className={linkClass}
              >
                🎲 Host 1v1 Game
              </NavLink>
              <NavLink
                to="/admin/transactions"
                className={linkClass}
              >
                📜 Transactions
              </NavLink>
            </nav>

            <button
              onClick={() =>
                dispatch(logout())
              }
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
