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
  const eventsContainerRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [joinInputs, setJoinInputs] = useState({});
  const [gameControls, setGameControls] = useState({});
  const [eventFilter, setEventFilter] = useState("all"); // all | game | activity

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
    }`;

  /* =========================================================
     SOCKET INITIALIZATION (MAIN NAMESPACE "/")
  ========================================================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("https://swordgame-5.onrender.com", {
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🛡 Admin connected to /");
      socket.emit("admin:getUsers");
    });

    socket.on("users:list", setUsers);

    socket.on("user:status", ({ userId, online }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, online } : u))
      );
    });

    const handleEvent = (event, source) => {
      const enriched = { ...event, source };

      // Add to activity feed
      setEvents((prev) => [enriched, ...prev]);

      // Update games state
      setGames((prev) => {
        switch (event.type) {
          case "GAME_CREATED":
            if (prev.some((g) => g.gameId === event.gameId)) return prev;
            return [
              {
                gameId: event.gameId,
                userId: event.userId,
                pot: event.pot || 0,
                status: "waiting",
                players: [event.userId],
              },
              ...prev,
            ];

          case "ADMIN_ADD_POT":
            return prev.map((g) =>
              g.gameId === event.gameId ? { ...g, pot: event.newPot } : g
            );

          case "GAME_STARTED":
            return prev.map((g) =>
              g.gameId === event.gameId ? { ...g, status: "started" } : g
            );

          case "PLAYER_JOINED":
            return prev.map((g) =>
              g.gameId === event.gameId
                ? {
                    ...g,
                    players: [
                      ...new Set([...(g.players || []), event.playerId]),
                    ],
                  }
                : g
            );

          default:
            return prev;
        }
      });
    };

    // 🔥 IMPORTANT: game:event FIRST
    socket.on("game:event", (data) => handleEvent(data, "game"));
    socket.on("activity:event", (data) => handleEvent(data, "activity"));

    return () => socket.disconnect();
  }, []);

  /* =========================================================
     AUTO SCROLL
  ========================================================= */
  useEffect(() => {
    if (eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop = 0;
    }
  }, [events]);

  useEffect(() => {
    if (gamesContainerRef.current) {
      gamesContainerRef.current.scrollTop = 0;
    }
  }, [games]);

  /* =========================================================
     GAME SETUP
  ========================================================= */
  const setupAndStartGame = async (gameId) => {
    const controls = gameControls[gameId];
    if (!controls) return alert("Enter enemies & pot");

    const numEnemies = Number(controls.enemies);
    const potAmount = Number(controls.pot);

    if (!numEnemies || numEnemies <= 0)
      return alert("Invalid enemies number");
    if (!potAmount || potAmount <= 0)
      return alert("Invalid pot amount");

    try {
      await fetch(`${API_URL}/api/admin/configure-enemies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, numEnemies }),
      });

      await fetch(`${API_URL}/api/admin/add-pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, amount: potAmount }),
      });

      await fetch(`${API_URL}/api/admin/start-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      setGameControls((prev) => ({
        ...prev,
        [gameId]: { enemies: "", pot: "" },
      }));
    } catch {
      alert("Failed to setup game");
    }
  };

  const forceJoinPlayer = (gameId) => {
    const playerId = joinInputs[gameId];
    if (!playerId) return alert("Enter Player ID");

    socketRef.current.emit("admin:forceJoin", { gameId, playerId });

    setJoinInputs((prev) => ({ ...prev, [gameId]: "" }));
  };

  /* =========================================================
     EVENT COLORING
  ========================================================= */
  const getEventStyle = (event) => {
    if (event.source === "game") return "bg-yellow-100 border-yellow-300";
    if (event.type === "USER_ONLINE") return "bg-green-100 border-green-300";
    if (event.type === "USER_OFFLINE") return "bg-gray-200 border-gray-400";
    return "bg-blue-100 border-blue-300";
  };

  const filteredEvents =
    eventFilter === "all"
      ? events
      : events.filter((e) => e.source === eventFilter);

  /* =========================================================
     UI
  ========================================================= */
  return (
    <>
      {/* USERS + LIVE ACTIVITY */}
      <section className="flex gap-4">
        {/* USERS */}
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h1 className="text-xl font-bold mb-3">Welcome Admin</h1>

          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u._id}
                className="flex justify-between p-2 bg-gray-50 rounded"
              >
                <span>{u.name}</span>
                <span
                  className={`text-sm ${
                    u.online ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {u.online ? "Online" : "Offline"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* LIVE ACTIVITY */}
        <div className="bg-white p-4 shadow rounded w-2/3 h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">🔥 Live Activity</h2>

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="border text-xs px-2 py-1 rounded"
            >
              <option value="all">All</option>
              <option value="game">Game Events</option>
              <option value="activity">Activity Events</option>
            </select>
          </div>

          <div
            ref={eventsContainerRef}
            className="overflow-y-auto flex-1"
          >
            {filteredEvents.map((event, i) => (
              <div
                key={i}
                className={`text-sm border p-2 mb-2 rounded ${getEventStyle(
                  event
                )}`}
              >
                <div className="font-semibold">{event.type}</div>
                {event.gameId && (
                  <div className="text-xs">
                    Game: {event.gameId.slice(0, 6)}
                  </div>
                )}
                {event.username && (
                  <div className="text-xs">
                    User: {event.username}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE GAME CONTROLLER */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-3">🎮 Live Game Controller</h2>

        <div
          ref={gamesContainerRef}
          className="max-h-[400px] overflow-y-auto"
        >
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
                Players: {game.players?.join(", ") || "None"}
              </div>

              {game.status === "waiting" && (
                <>
                  {/* Force Join */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Player ID"
                      value={joinInputs[game.gameId] || ""}
                      onChange={(e) =>
                        setJoinInputs((prev) => ({
                          ...prev,
                          [game.gameId]: e.target.value,
                        }))
                      }
                      className="border px-2 py-1 text-xs rounded"
                    />
                    <button
                      onClick={() => forceJoinPlayer(game.gameId)}
                      className="bg-purple-600 text-white px-2 py-1 text-xs rounded"
                    >
                      ➕ Join
                    </button>
                  </div>

                  {/* Setup */}
                  <div className="flex flex-col gap-2 mt-3">
                    <input
                      type="number"
                      placeholder="Number of Enemies"
                      value={
                        gameControls[game.gameId]?.enemies || ""
                      }
                      onChange={(e) =>
                        setGameControls((prev) => ({
                          ...prev,
                          [game.gameId]: {
                            ...prev[game.gameId],
                            enemies: e.target.value,
                          },
                        }))
                      }
                      className="border px-2 py-1 text-xs rounded"
                    />

                    <input
                      type="number"
                      placeholder="Pot Amount"
                      value={gameControls[game.gameId]?.pot || ""}
                      onChange={(e) =>
                        setGameControls((prev) => ({
                          ...prev,
                          [game.gameId]: {
                            ...prev[game.gameId],
                            pot: e.target.value,
                          },
                        }))
                      }
                      className="border px-2 py-1 text-xs rounded"
                    />

                    <button
                      onClick={() =>
                        setupAndStartGame(game.gameId)
                      }
                      className="bg-green-600 text-white px-3 py-1 text-xs rounded"
                    >
                      🎮 Setup & Start Game
                    </button>
                  </div>
                </>
              )}
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
              <NavLink to="/admin/monitor" className={linkClass}>
                🎮 Live Monitor
              </NavLink>
              <NavLink to="/admin/credit-coins" className={linkClass}>
                💰 Credit/Debit Coins
              </NavLink>
              <NavLink to="/admin/host-game" className={linkClass}>
                🎲 Host 1v1 Game
              </NavLink>
              <NavLink to="/admin/transactions" className={linkClass}>
                📜 Transactions
              </NavLink>
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
