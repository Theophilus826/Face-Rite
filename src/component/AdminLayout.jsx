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
  const [joinInputs, setJoinInputs] = useState({});
  const [gameControls, setGameControls] = useState({}); // 🔥 NEW

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

  if (!event.gameId) return;

  setGames((prev) => {
    let updated = [...prev];
    let gameIndex = updated.findIndex(
      (g) => g.gameId === event.gameId
    );

    // 🔥 AUTO-CREATE GAME IF NOT EXIST
    if (gameIndex === -1) {
      updated.unshift({
        gameId: event.gameId,
        userId: event.userId || "Unknown",
        pot: event.pot || 0,
        status: event.status || "waiting",
        players: [],
        numEnemies: 0,
        winnerId: null,
      });

      gameIndex = 0;
    }

    const game = updated[gameIndex];

    switch (event.type) {
      case "GAME_CREATED":
        updated[gameIndex] = {
          ...game,
          userId: event.userId,
          players: [event.userId],
          status: "waiting",
        };
        break;

      case "ADMIN_CONFIG_ENEMIES":
        updated[gameIndex] = {
          ...game,
          numEnemies: event.numEnemies,
        };
        break;

      case "ADMIN_ADD_POT":
        updated[gameIndex] = {
          ...game,
          pot: event.newPot,
        };
        break;

      case "PLAYER_JOINED":
        updated[gameIndex] = {
          ...game,
          players: [...new Set([...game.players, event.playerId])],
        };
        break;

      case "GAME_STARTED":
        updated[gameIndex] = {
          ...game,
          status: "started",
        };
        break;

      case "GAME_RESULT":
        updated[gameIndex] = {
          ...game,
          status: "finished",
          winnerId: event.winnerId,
        };
        break;

      default:
        break;
    }

    return updated;
  });
};

  socket.on("activity:event", handleEvent);
 socket.on("game:event", (e) => {
  console.log("ADMIN game:event received:", e);
  handleEvent(e);
});
  return () => socket.disconnect();
}, []);
  /* =========================================================
     ADMIN SETUP + START GAME
  ========================================================= */
  const setupAndStartGame = async (gameId) => {
    const controls = gameControls[gameId];

    if (!controls)
      return alert("Enter enemies & pot");

    const numEnemies = Number(controls.enemies);
    const potAmount = Number(controls.pot);

    if (!numEnemies || numEnemies <= 0)
      return alert("Invalid enemies number");

    if (!potAmount || potAmount <= 0)
      return alert("Invalid pot amount");

    try {
      // 1️⃣ Configure enemies
      await fetch(`${API_URL}/api/admin/configure-enemies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, numEnemies }),
      });

      // 2️⃣ Add pot
      await fetch(`${API_URL}/api/admin/add-pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, amount: potAmount }),
      });

      // 3️⃣ Start game
      await fetch(`${API_URL}/api/admin/start-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      // Clear inputs
      setGameControls((prev) => ({
        ...prev,
        [gameId]: { enemies: "", pot: "" },
      }));

    } catch (err) {
      alert("Failed to setup game");
    }
  };

  /* =========================================================
     FORCE JOIN PLAYER
  ========================================================= */
  const forceJoinPlayer = (gameId) => {
    const playerId = joinInputs[gameId];
    if (!playerId) return alert("Enter Player ID");

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
            </div>
          ))}
        </div>
      </section>

      {/* LIVE GAME CONTROLLER */}
      <section className="mt-4 bg-white p-4 shadow rounded">
  <h2 className="font-semibold mb-3">
    🎮 Live Game Controller
  </h2>

  <div
    ref={gamesContainerRef}
    className="max-h-[400px] overflow-y-auto"
  >
    {games.length === 0 && (
      <div className="text-gray-400 text-sm text-center py-10">
        No active games yet
      </div>
    )}

    {games.map((game) => (
      <div
        key={game.gameId}
        className="p-4 mb-3 bg-gray-50 rounded border"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="font-semibold">
            Game {game.gameId.slice(0, 6)}
          </div>

          <span
            className={`text-xs px-2 py-1 rounded font-semibold ${
              game.status === "waiting"
                ? "bg-gray-200 text-gray-700"
                : game.status === "started"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {game.status?.toUpperCase()}
          </span>
        </div>

        {/* GAME INFO */}
        <div className="text-sm text-gray-500 mt-1">
          Host: {game.userId}
        </div>

        <div className="text-yellow-600 text-sm">
          Pot: {game.pot}
        </div>

        <div className="text-sm text-gray-600">
          Enemies: {game.numEnemies || 0}
        </div>

        <div className="text-xs mt-1">
          Players: {game.players?.join(", ") || "None"}
        </div>

        {/* WINNER */}
        {game.status === "finished" && (
          <div className="text-green-600 text-sm mt-2 font-semibold">
            🏆 Winner: {game.winnerId || "Unknown"}
          </div>
        )}

        {/* JOIN PLAYER */}
        {game.status === "waiting" && (
          <div className="flex gap-2 mt-3">
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
              className="border px-2 py-1 text-xs rounded flex-1"
            />

            <button
              onClick={() => forceJoinPlayer(game.gameId)}
              className="bg-purple-600 text-white px-3 py-1 text-xs rounded"
            >
              ➕ Join
            </button>
          </div>
        )}

        {/* ADMIN SETUP PANEL */}
        {game.status === "waiting" && (
          <div className="flex flex-col gap-2 mt-3">
            <input
              type="number"
              placeholder="Number of Enemies"
              value={gameControls[game.gameId]?.enemies || ""}
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
              className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 transition"
            >
              🎮 Setup & Start Game
            </button>
          </div>
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

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </section>
    </>
  );
}
