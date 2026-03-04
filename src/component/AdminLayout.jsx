import { useEffect, useState, useRef, useCallback } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/AuthSlice";
import { io } from "socket.io-client";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  /* ================================
     STATE
  ================================= */
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [gameControls, setGameControls] = useState({});
  const [playerBets, setPlayerBets] = useState({});
  const [gameEnemies, setGameEnemies] = useState({}); // 🔥 NEW

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
    }`;

  /* ================================
     GAME EVENT HANDLER
  ================================= */
  const handleGameEvent = useCallback((event) => {
    if (!event?.gameId) return;

    setEvents(prev => [event, ...prev].slice(0, 200));

    /* ====================
       PLAYER BET TRACKING
    ==================== */
    if (event.type === "PLAYER_BET") {
      setPlayerBets(prev => ({
        ...prev,
        [event.gameId]: {
          ...(prev[event.gameId] || {}),
          [event.userId]: event.betAmount,
        },
      }));
    }

    /* ====================
       ENEMY CONFIGURED
    ==================== */
    if (event.type === "ENEMIES_CONFIGURED" && Array.isArray(event.enemies)) {
      setGameEnemies(prev => ({
        ...prev,
        [event.gameId]: event.enemies,
      }));
    }

    /* ====================
       LIVE POSITION UPDATE
    ==================== */
    if (event.type === "ENEMY_POSITION_UPDATE") {
      setGameEnemies(prev => {
        const existing = prev[event.gameId] || [];

        const updated = existing.map(enemy =>
          enemy.id === event.enemyId
            ? { ...enemy, position: event.position }
            : enemy
        );

        return {
          ...prev,
          [event.gameId]: updated,
        };
      });
    }

    /* ====================
       GAME STATE UPDATE
    ==================== */
    setGames(prevGames => {
      const existing = prevGames.find(g => g.gameId === event.gameId);

      if (!existing) {
        return [
          {
            gameId: event.gameId,
            hostId: event.hostId || null,
            status: event.status || "waiting",
            pot: event.pot || 0,
            numEnemies: event.numEnemies || 0,
            players: event.players || [],
            enemiesConfigured: false,
          },
          ...prevGames,
        ];
      }

      return prevGames.map(game => {
        if (game.gameId !== event.gameId) return game;

        switch (event.type) {
          case "PLAYER_JOINED":
            return {
              ...game,
              players: [...new Set([...(game.players || []), event.userId])],
            };

          case "PLAYER_DISCONNECTED":
            return {
              ...game,
              players: (game.players || []).filter(id => id !== event.userId),
            };

          case "ENEMIES_CONFIGURED":
            return {
              ...game,
              enemiesConfigured: true,
              numEnemies: event.enemies?.length || 0,
            };

          case "ADMIN_ADD_POT":
            return {
              ...game,
              pot: event.newPot ?? game.pot,
            };

          case "GAME_STARTED":
            return {
              ...game,
              status: "started",
              pot: event.pot ?? game.pot,
            };

          case "GAME_RESULT":
            return {
              ...game,
              status: "finished",
            };

          default:
            return game;
        }
      });
    });
  }, []);

  /* ================================
     SOCKET
  ================================= */
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

    const initialize = () => {
      socket.emit("admin:getUsers");
      socket.emit("admin:getGames");
    };

    socket.on("connect", initialize);
    socket.on("reconnect", initialize);

    socket.on("users:list", setUsers);
    socket.on("activity:event", handleGameEvent);
    socket.on("game:event", handleGameEvent);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [handleGameEvent]);

  /* ================================
     ADMIN START GAME
  ================================= */
  const setupAndStartGame = (gameId) => {
    const controls = gameControls[gameId];
    if (!controls) return;

    const numEnemies = Number(controls.enemies);
    const potAmount = Number(controls.pot);

    if (!numEnemies || numEnemies <= 0) return;
    if (!potAmount || potAmount <= 0) return;

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("host:configureEnemies", { gameId, numEnemies });
    socket.emit("host:addToPot", { gameId, amount: potAmount });
    socket.emit("host:startGame", { gameId });

    setGameControls(prev => ({
      ...prev,
      [gameId]: { enemies: "", pot: "" },
    }));
  };

  /* ================================
     UI
  ================================= */
  return (
    <>
      <section className="mt-4 bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-3">🎮 Live Game Controller</h2>

        <div className="max-h-[500px] overflow-y-auto">
          {games.map(game => (
            <div key={game.gameId} className="p-3 mb-3 bg-gray-50 rounded border">
              <div className="font-semibold">
                Game {game.gameId?.slice(0, 6)}
              </div>

              <div className="text-yellow-600 text-sm">
                Pot: {game.pot}
              </div>

              {/* 🔴 Enemy Positions */}
              {gameEnemies[game.gameId]?.length > 0 && (
                <div className="mt-3 text-xs bg-red-50 p-2 rounded border">
                  <div className="font-semibold text-red-700 mb-1">
                    ⚔️ Enemy Positions
                  </div>

                  {gameEnemies[game.gameId].map(enemy => (
                    <div key={enemy.id} className="mb-2">
                      <div>ID: {enemy.id}</div>
                      <div>
                        X: {enemy.position?.x?.toFixed(2)} | 
                        Y: {enemy.position?.y?.toFixed(2)} | 
                        Z: {enemy.position?.z?.toFixed(2)}
                      </div>
                      <div>HP: {enemy.health}</div>
                      <hr className="my-1" />
                    </div>
                  ))}
                </div>
              )}

              {game.status === "started" && (
                <div className="text-green-600 text-sm mt-2">
                  🟢 Game started
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sidebar */}
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
