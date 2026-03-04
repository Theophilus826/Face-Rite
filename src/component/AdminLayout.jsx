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
  const [playerBets, setPlayerBets] = useState({});
  const [enemyPositions, setEnemyPositions] = useState({}); // 🔴 NEW

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive
        ? "bg-black text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

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
      setUsers(prev =>
        prev.map(u =>
          u._id === userId ? { ...u, online } : u
        )
      );
    });

    /* =======================
       GAME EVENTS
    ======================= */
    const handleGameEvent = (event) => {
      setEvents(prev => [event, ...prev]);

      // 🔵 PLAYER BET TRACKING
      if (event.type === "PLAYER_BET") {
        setPlayerBets(prev => ({
          ...prev,
          [event.gameId]: {
            ...(prev[event.gameId] || {}),
            [event.userId]: event.betAmount,
          },
        }));
      }

      // 🔴 ENEMY POSITION UPDATE
      if (event.type === "ENEMY_POSITION_UPDATE") {
        setEnemyPositions(prev => ({
          ...prev,
          [event.gameId]: event.enemies,
        }));
      }

      // 🔴 INITIAL ENEMY DEPLOY
      if (event.type === "ENEMIES_DEPLOYED") {
        setEnemyPositions(prev => ({
          ...prev,
          [event.gameId]: event.enemies,
        }));
      }

      setGames(prev => {
        const existingGame = prev.find(
          g => g.gameId === event.gameId
        );

        if (!existingGame) {
          const newGame = {
            gameId: event.gameId,
            hostId: event.hostId || null,
            status: event.status || "waiting",
            pot: event.pot || 0,
            numEnemies: event.numEnemies || 0,
            players: event.players || [],
            enemiesConfigured:
              event.enemiesConfigured || false,
          };
          return [newGame, ...prev];
        }

        return prev.map(g => {
          if (g.gameId !== event.gameId) return g;

          switch (event.type) {
            case "PLAYER_JOINED":
              return {
                ...g,
                players: [
                  ...new Set([
                    ...(g.players || []),
                    event.userId,
                  ]),
                ],
              };

            case "PLAYER_DISCONNECTED":
              return {
                ...g,
                players: (g.players || []).filter(
                  id => id !== event.userId
                ),
              };

            case "ENEMIES_CONFIGURED":
              return {
                ...g,
                enemiesConfigured: true,
                numEnemies: event.enemies,
              };

            case "ADMIN_ADD_POT":
              return { ...g, pot: event.newPot };

            case "GAME_STARTED":
              return {
                ...g,
                status: "started",
                pot: event.pot,
                numEnemies: event.enemies,
              };

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
     ADMIN ACTIONS
  ======================= */
  const setupAndStartGame = (gameId) => {
    const controls = gameControls[gameId];
    if (!controls) return alert("Enter enemies & pot");

    const numEnemies = Number(controls.enemies);
    const potAmount = Number(controls.pot);

    if (!numEnemies || numEnemies <= 0)
      return alert("Invalid enemies number");
    if (!potAmount || potAmount <= 0)
      return alert("Invalid pot amount");

    socketRef.current.emit("host:configureEnemies", {
      gameId,
      numEnemies,
    });

    socketRef.current.emit("host:addToPot", {
      gameId,
      amount: potAmount,
    });

    socketRef.current.emit("host:startGame", {
      gameId,
    });

    setGameControls(prev => ({
      ...prev,
      [gameId]: { enemies: "", pot: "" },
    }));
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <>
      {/* USERS + EVENTS */}
      <section className="flex gap-4">
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h1 className="text-xl font-bold mb-3">
            Welcome Admin
          </h1>
          <ul className="space-y-2">
            {users.map(u => (
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
                  {u.online ? "Online" : "Offline"}
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

        {games.map(game => (
          <div
            key={game.gameId}
            className="p-3 mb-3 bg-gray-50 rounded border"
          >
            <div className="font-semibold">
              Game {game.gameId?.slice(0, 6)}
            </div>

            <div className="text-yellow-600 text-sm">
              Pot: {game.pot}
            </div>

            {/* 🔴 ENEMY POSITIONS DISPLAY */}
            {enemyPositions[game.gameId] && (
              <div className="mt-2 text-xs text-red-600">
                <strong>Enemy Positions:</strong>
                {enemyPositions[game.gameId].map(
                  (enemy, idx) => (
                    <div key={idx}>
                      #{idx + 1} → X:
                      {enemy.position.x}, Y:
                      {enemy.position.y}
                    </div>
                  )
                )}
              </div>
            )}

            {game.status === "waiting" && (
              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Number of Enemies"
                  value={
                    gameControls[game.gameId]
                      ?.enemies || ""
                  }
                  onChange={e =>
                    setGameControls(prev => ({
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
                  value={
                    gameControls[game.gameId]?.pot ||
                    ""
                  }
                  onChange={e =>
                    setGameControls(prev => ({
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
                  🎮 Configure & Start
                </button>
              </div>
            )}

            {game.status === "started" && (
              <div className="text-sm text-green-600 mt-2">
                🟢 Game started
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
