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
  const [joinInputs, setJoinInputs] = useState({});
  const [gameControls, setGameControls] = useState({});
  const [hostActive, setHostActive] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);

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
      withCredentials: true,
      auth: { token },
      reconnection: true,
    });
    socketRef.current = socket;

    const init = () => {
      console.log("🛡 Admin socket connected");
      setSocketConnected(true);
      socket.emit("admin:getUsers");
    };

    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", init);
    socket.on("reconnect", init);
    socket.on("disconnect", handleDisconnect);

    socket.on("users:list", setUsers);

    socket.on("user:status", ({ userId, online }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, online } : u))
      );
    });

    const handleEvent = (event) => {
      setEvents((prev) => [event, ...prev]);

      setGames((prev) =>
        prev.map((g) =>
          g.gameId === event.gameId
            ? {
                ...g,
                ...(event.newPot ? { pot: event.newPot } : {}),
                ...(event.status ? { status: event.status } : {}),
                ...(event.enemies
                  ? { enemiesConfigured: true, numEnemies: event.enemies }
                  : {}),
                ...(event.playerId
                  ? { players: [...new Set([...(g.players || []), event.playerId])] }
                  : {}),
              }
            : g
        )
      );

      // Automatically mark host as active if game is started by admin
      if (event.type === "GAME_STARTED") {
        setHostActive((prev) => ({ ...prev, [event.gameId]: true }));
      }
    };

    socket.on("activity:event", handleEvent);
    socket.on("game:event", handleEvent);

    return () => {
      socket.off("connect", init);
      socket.off("reconnect", init);
      socket.off("disconnect", handleDisconnect);
      socket.off("users:list", setUsers);
      socket.off("user:status");
      socket.off("activity:event", handleEvent);
      socket.off("game:event", handleEvent);
      socket.disconnect();
    };
  }, []);

  /* =========================================================
     FRONTEND HOST: CREATE LOCAL GAME
  ========================================================= */
  const createLocalGame = () => {
    const gameId = crypto.randomUUID();

    setGames((prev) => [
      {
        gameId,
        userId: "admin",
        pot: 0,
        status: "waiting",
        enemiesConfigured: false,
        numEnemies: 0,
        players: [],
      },
      ...prev,
    ]);

    setHostActive((prev) => ({ ...prev, [gameId]: true }));
  };

  /* =========================================================
     ADMIN SETUP + START GAME (SOCKET ONLY)
  ========================================================= */
  const setupAndStartGame = (gameId) => {
    if (!hostActive[gameId]) return alert("Host inactive, cannot start");

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

  /* =========================================================
     FORCE JOIN PLAYER
  ========================================================= */
  const forceJoinPlayer = (gameId) => {
    if (!hostActive[gameId]) return alert("Host inactive, cannot join player");

    const playerId = joinInputs[gameId];
    if (!playerId) return alert("Enter Player ID");

    socketRef.current.emit("admin:forceJoin", { gameId, playerId });

    setJoinInputs((prev) => ({ ...prev, [gameId]: "" }));
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <>
      {/* CONNECTION STATUS */}
      <div className="mb-3 text-sm font-semibold">
        Socket Status:{" "}
        <span className={socketConnected ? "text-green-600" : "text-red-600"}>
          {socketConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* USERS + ACTIVITY */}
      <section className="flex gap-4">
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

        <div className="bg-white p-4 shadow rounded w-2/3 h-[500px] overflow-y-auto">
          <h2 className="font-semibold mb-2">🔥 Live Activity</h2>
          {events.map((event, i) => (
            <div
              key={i}
              className="text-sm border p-2 mb-2 rounded bg-gray-50"
            >
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

        <button
          onClick={createLocalGame}
          className="bg-blue-600 text-white px-3 py-2 text-sm rounded mb-3"
        >
          ➕ Create Game
        </button>

        <div className="max-h-[400px] overflow-y-auto">
          {games.map((game) => {
            const hostEnabled = hostActive[game.gameId] && game.status === "waiting";
            return (
              <div
                key={game.gameId}
                className="p-3 mb-3 bg-gray-50 rounded border"
              >
                <div className="font-semibold">Game {game.gameId.slice(0, 6)}</div>
                <div className="text-sm text-gray-500">Host: {game.userId}</div>
                <div className="text-yellow-600 text-sm">Pot: {game.pot}</div>
                <div className="text-xs mt-1">
                  Players: {game.players?.join(", ") || "None"}
                </div>

                {/* JOIN PLAYER */}
                {game.status === "waiting" && (
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
                      disabled={!hostEnabled}
                    />
                    <button
                      onClick={() => forceJoinPlayer(game.gameId)}
                      className="bg-purple-600 text-white px-2 py-1 text-xs rounded"
                      disabled={!hostEnabled}
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
                      disabled={!hostEnabled}
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
                      disabled={!hostEnabled}
                    />
                    <button
                      onClick={() => setupAndStartGame(game.gameId)}
                      className="bg-green-600 text-white px-3 py-1 text-xs rounded"
                      disabled={!hostEnabled}
                    >
                      🎮 Setup & Start Game
                    </button>
                  </div>
                )}

                {/* ENEMIES DEPLOYED INFO */}
                {game.enemiesConfigured && (
                  <div className="text-sm text-red-600 mt-2">
                    ⚔️ Enemies deployed: {game.numEnemies}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
