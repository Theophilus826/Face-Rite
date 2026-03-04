import { useEffect, useState, useRef, useCallback } from "react";
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
  const [playerBets, setPlayerBets] = useState({});
  const [gameEnemies, setGameEnemies] = useState({});

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
    }`;

  /* ==========================
     HANDLE GAME EVENTS
  ========================== */
  const handleGameEvent = useCallback((event) => {
    if (!event?.gameId) return;

    setEvents(prev => [event, ...prev].slice(0, 200));

    // Player bets
    if (event.type === "PLAYER_BET") {
      setPlayerBets(prev => ({
        ...prev,
        [event.gameId]: {
          ...(prev[event.gameId] || {}),
          [event.userId]: event.betAmount,
        },
      }));
    }

    // Enemies configured
    if (event.type === "ENEMIES_CONFIGURED" && Array.isArray(event.enemies)) {
      setGameEnemies(prev => ({
        ...prev,
        [event.gameId]: event.enemies.map(e => ({
          ...e,
          position: e.position || { x: 0, y: 0, z: 0 },
        })),
      }));
    }

    // Enemy position / health updates
    if ((event.type === "ENEMY_POSITION_UPDATE" || event.type === "ENEMY_HEALTH_UPDATE") && gameEnemies[event.gameId]) {
      setGameEnemies(prev => {
        const updated = (prev[event.gameId] || []).map(enemy =>
          enemy.id === event.enemyId
            ? {
                ...enemy,
                position: event.position ?? enemy.position,
                health: event.health ?? enemy.health,
              }
            : enemy
        );
        return { ...prev, [event.gameId]: updated };
      });
    }

    // Update games state
    setGames(prev => {
      const exists = prev.find(g => g.gameId === event.gameId);
      if (!exists) {
        // New game from event
        return [
          {
            gameId: event.gameId,
            hostId: event.hostId ?? null,
            status: event.status ?? "waiting",
            pot: event.pot ?? 0,
            players: event.players ?? [],
            enemiesConfigured: event.enemies ? true : false,
            numEnemies: event.enemies?.length ?? 0,
          },
          ...prev,
        ];
      }

      // Update existing game
      return prev.map(game => {
        if (game.gameId !== event.gameId) return game;

        switch (event.type) {
          case "PLAYER_JOINED":
            return { ...game, players: [...new Set([...(game.players || []), event.userId])] };
          case "PLAYER_DISCONNECTED":
            return { ...game, players: (game.players || []).filter(id => id !== event.userId) };
          case "ADMIN_ADD_POT":
            return { ...game, pot: event.newPot ?? game.pot };
          case "GAME_STARTED":
            return { ...game, status: "started", pot: event.pot ?? game.pot };
          case "GAME_RESULT":
            return { ...game, status: "finished" };
          case "ENEMIES_CONFIGURED":
            return { ...game, enemiesConfigured: true, numEnemies: event.enemies?.length ?? 0 };
          default:
            return game;
        }
      });
    });
  }, [gameEnemies]);

  /* ==========================
     SOCKET INIT
  ========================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("https://swordgame-5.onrender.com/admin", {
      path: "/socket.io",
      auth: { token },
      withCredentials: true,
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

    socket.on("users:list", setUsers);

    socket.on("games:list", serverGames => {
      if (!Array.isArray(serverGames)) return;

      const enemiesMap = {};
      const betsMap = {};
      serverGames.forEach(game => {
        if (Array.isArray(game.enemies)) enemiesMap[game.gameId] = game.enemies;
        if (game.playerBets) betsMap[game.gameId] = game.playerBets;
      });

      setGameEnemies(enemiesMap);
      setPlayerBets(betsMap);

      setGames(serverGames.map(game => ({
        gameId: game.gameId,
        hostId: game.hostId ?? null,
        status: game.status ?? "waiting",
        pot: game.pot ?? 0,
        players: game.players ?? [],
        enemiesConfigured: game.enemies?.length > 0 ?? false,
        numEnemies: game.enemies?.length ?? 0,
      })));
    });

    socket.on("user:status", ({ userId, online }) => {
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, online } : u));
    });

    socket.on("activity:event", handleGameEvent);
    socket.on("game:event", handleGameEvent);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [handleGameEvent]);

  /* ==========================
     ADMIN ACTION
  ========================== */
  const setupAndStartGame = (gameId) => {
    const controls = gameControls[gameId];
    if (!controls) return alert("Enter enemies & pot");

    const numEnemies = Number(controls.enemies);
    const potAmount = Number(controls.pot);

    if (!numEnemies || numEnemies <= 0) return alert("Invalid enemies number");
    if (!potAmount || potAmount <= 0) return alert("Invalid pot amount");

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("host:configureEnemies", { gameId, numEnemies });
    socket.emit("host:addToPot", { gameId, amount: potAmount });
    socket.emit("host:startGame", { gameId });

    setGameControls(prev => ({ ...prev, [gameId]: { enemies: "", pot: "" } }));
  };

  /* ==========================
     UI
  ========================== */
  return (
    <>
      <section className="flex gap-4">
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h1 className="text-xl font-bold mb-3">Welcome Admin</h1>
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
          {events.map((e, i) => (
            <div key={i} className="text-sm border p-2 mb-2 rounded bg-gray-50">
              <div>{e.type}</div>
              {e.pot && <div>Pot: {e.pot}</div>}
              {e.newPot && <div>Pot: {e.newPot}</div>}
              {e.betAmount && <div>Bet: {e.betAmount}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-3">🎮 Live Game Controller</h2>
        {games.map(game => (
          <div key={game.gameId} className="p-3 mb-3 bg-gray-50 rounded border">
            <div className="font-semibold">Game {game.gameId?.slice(0, 6)}</div>
            <div className="text-yellow-600 text-sm">Pot: {game.pot}</div>

            {/* Player Bets */}
            <div className="text-xs mt-1">
              Players Bets:
              {playerBets[game.gameId]
                ? Object.entries(playerBets[game.gameId]).map(([uid, bet]) => (
                    <div key={uid}>{uid}: {bet} coins</div>
                  ))
                : " None"}
            </div>

            {/* Enemy positions */}
            {gameEnemies[game.gameId]?.length > 0 && (
              <div className="mt-3 text-xs bg-red-50 p-2 rounded border">
                <div className="font-semibold text-red-700 mb-1">⚔️ Enemy Positions</div>
                {gameEnemies[game.gameId].map(enemy => (
                  <div key={enemy.id} className="mb-2">
                    <div>ID: {enemy.id}</div>
                    <div>
                      X: {Number(enemy.position?.x ?? 0).toFixed(2)} |{" "}
                      Y: {Number(enemy.position?.y ?? 0).toFixed(2)} |{" "}
                      Z: {Number(enemy.position?.z ?? 0).toFixed(2)}
                    </div>
                    <div>HP: {enemy.health ?? 0}</div>
                    <hr className="my-1" />
                  </div>
                ))}
              </div>
            )}

            {game.status === "started" && <div className="text-green-600 text-sm mt-2">🟢 Game started</div>}
            {game.status === "finished" && <div className="text-gray-600 text-sm mt-2">🏁 Game finished</div>}
          </div>
        ))}
      </section>
    </>
  );
}
