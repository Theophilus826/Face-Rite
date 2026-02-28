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
  const [gameControls, setGameControls] = useState({});

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
    }`;

  /* =========================================================
     SOCKET INITIALIZATION
  ========================================================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("https://swordgame-5.onrender.com/admin", {
      path: "/socket.io",
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = socket;

    const init = () => {
      console.log("🛡 Admin socket connected");
      socket.emit("admin:getUsers");
    };

    socket.on("connect", init);
    socket.on("reconnect", init);

    socket.on("users:list", setUsers);

    // Listen to all activity/game events
    const handleEvent = (event) => {
      setEvents((prev) => [event, ...prev]);

      // Update users if USER_ONLINE / USER_OFFLINE
      if (event.type === "USER_ONLINE" || event.type === "USER_OFFLINE") {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === event.userId
              ? { ...u, online: event.type === "USER_ONLINE" }
              : u
          )
        );
      }

      // Update games
      if (event.gameId) {
        setGames((prev) => {
          let exists = prev.find((g) => g.gameId === event.gameId);
          if (!exists) {
            prev = [
              {
                gameId: event.gameId,
                status: "waiting",
                pot: 0,
                numEnemies: 0,
                enemiesConfigured: false,
                players: [],
              },
              ...prev,
            ];
          }

          return prev.map((g) => {
            if (g.gameId !== event.gameId) return g;

            switch (event.type) {
              case "PLAYER_JOINED":
                return {
                  ...g,
                  players: [...new Set([...(g.players || []), event.userId])],
                };
              case "PLAYER_DISCONNECTED":
                return {
                  ...g,
                  players: (g.players || []).filter((id) => id !== event.userId),
                };
              case "ENEMIES_CONFIGURED":
                return {
                  ...g,
                  enemiesConfigured: true,
                  numEnemies: event.enemies ?? g.numEnemies,
                };
              case "GAME_STARTED":
                return {
                  ...g,
                  status: "started",
                  pot: event.pot ?? g.pot,
                  numEnemies: event.enemies ?? g.numEnemies,
                };
              case "ADMIN_ADD_POT":
                return { ...g, pot: event.newPot ?? g.pot };
              case "GAME_RESULT":
                return { ...g, status: "finished" };
              default:
                return g;
            }
          });
        });
      }
    };

    socket.on("activity:event", handleEvent);
    socket.on("game:event", handleEvent);

    return () => socket.disconnect();
  }, []);

  /* =========================================================
     ADMIN GAME CONTROLS
  ========================================================= */
  const setupAndStartGame = (gameId) => {
    const controls = gameControls[gameId];
    if (!controls) return alert("Enter enemies & pot");

    const numEnemies = Number(controls.enemies);
    const potAmount = Number(controls.pot);

    if (!numEnemies || numEnemies <= 0) return alert("Invalid enemies number");
    if (!potAmount || potAmount <= 0) return alert("Invalid pot amount");

    const socket = socketRef.current;
    socket.emit("host:configureEnemies", { gameId, numEnemies });
    socket.emit("host:addToPot", { gameId, amount: potAmount });
    socket.emit("host:startGame", { gameId, pot: potAmount });

    setGameControls((prev) => ({
      ...prev,
      [gameId]: { enemies: "", pot: "" },
    }));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        {/* USERS + ACTIVITY */}
        <section className="flex gap-4 mb-6">
          <div className="bg-white p-4 shadow rounded w-1/3">
            <h2 className="text-xl font-bold mb-3">Users</h2>
            <ul className="space-y-2">
              {users.map(u => (
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
                {event.type} {event.enemies && `- Enemies: ${event.enemies}`} {event.newPot && `- Pot: ${event.newPot}`}
              </div>
            ))}
          </div>
        </section>

        {/* LIVE GAME CONTROLLER */}
        <section className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-3">🎮 Live Game Controller</h2>
          {games.map(game => (
            <div key={game.gameId} className="p-3 mb-3 bg-gray-50 rounded border">
              <div className="font-semibold">Game {game.gameId.slice(0,6)}</div>
              <div className="text-sm text-gray-500">Status: {game.status}</div>
              <div className="text-yellow-600 text-sm">Pot: {game.pot}</div>
              <div className="text-xs mt-1">Players: {game.players?.join(", ") || "None"}</div>
              {game.status === "waiting" && (
                <div className="flex flex-col gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Number of Enemies"
                    value={gameControls[game.gameId]?.enemies || ""}
                    onChange={e => setGameControls(prev => ({
                      ...prev,
                      [game.gameId]: { ...prev[game.gameId], enemies: e.target.value }
                    }))}
                    className="border px-2 py-1 text-xs rounded"
                  />
                  <input
                    type="number"
                    placeholder="Pot Amount"
                    value={gameControls[game.gameId]?.pot || ""}
                    onChange={e => setGameControls(prev => ({
                      ...prev,
                      [game.gameId]: { ...prev[game.gameId], pot: e.target.value }
                    }))}
                    className="border px-2 py-1 text-xs rounded"
                  />
                  <button
                    onClick={() => setupAndStartGame(game.gameId)}
                    className="bg-green-600 text-white px-3 py-1 text-xs rounded"
                  >
                    🎮 Setup & Start Game
                  </button>
                </div>
              )}
              {game.enemiesConfigured && (
                <div className="text-sm text-red-600 mt-2">⚔️ Enemies deployed: {game.numEnemies}</div>
              )}
            </div>
          ))}
        </section>

        <Outlet />
      </main>
    </div>
  );
}
