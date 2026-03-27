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
  const [gameEnemies, setGameEnemies] = useState({});

  const [userId, setUserId] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notifLoading, setNotifLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
    }`;

  /* =========================
     SOCKET INITIALIZATION
  ========================= */
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
      console.log("🛡 Admin connected");
      socket.emit("admin:getUsers");
      socket.emit("admin:getGames");
    };

    socket.on("connect", init);
    socket.on("reconnect", init);

    /* ================= USERS ================= */
    socket.on("users:list", setUsers);
    socket.on("user:status", ({ userId, online }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, online } : u))
      );
    });

    /* ================= GAME EVENTS ================= */
    const handleGameEvent = (event) => {
      if (!event?.gameId) return;

      setEvents((prev) => [event, ...prev].slice(0, 200));

      // Enemy configuration
      if (event.type === "ENEMIES_CONFIGURED" && Array.isArray(event.enemies)) {
        setGameEnemies((prev) => ({
          ...prev,
          [event.gameId]: event.enemies.map((e) => ({
            ...e,
            position: e.position || { x: 0, y: 0, z: 0 },
          })),
        }));
      }

      // Update games
      setGames((prev) => {
        let exists = prev.find((g) => g.gameId === event.gameId);
        if (!exists) {
          return [
            {
              gameId: event.gameId,
              hostId: event.hostId || null,
              status: event.status || "waiting",
              pot: event.pot || 0,
              players: event.players || [],
              numEnemies: event.enemies?.length || 0,
              enemiesConfigured: !!event.enemies,
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
              return { ...g, players: (g.players || []).filter((id) => id !== event.userId) };
            case "ENEMIES_CONFIGURED":
              return { ...g, enemiesConfigured: true, numEnemies: event.enemies?.length || 0 };
            case "ADMIN_ADD_POT":
              return { ...g, pot: event.newPot };
            case "GAME_STARTED":
              return { ...g, status: "started", pot: event.pot, numEnemies: event.enemies?.length || g.numEnemies };
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

        return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /* =========================
     ADMIN ACTIONS
  ========================= */
  const setupAndStartGame = (gameId) => {
    const controls = gameControls[gameId];
    if (!controls) return alert("Enter enemies & pot");

    const numEnemies = Number(controls.enemies);
    const potAmount = Number(controls.pot);

    if (!numEnemies || numEnemies <= 0) return alert("Invalid enemies number");
    if (!potAmount || potAmount <= 0) return alert("Invalid pot amount");

    socketRef.current.emit("host:configureEnemies", { gameId, numEnemies });
    socketRef.current.emit("host:addToPot", { gameId, amount: potAmount });
    socketRef.current.emit("host:startGame", { gameId });

    setGameControls((prev) => ({ ...prev, [gameId]: { enemies: "", pot: "" } }));
  };

  //  notification api
  const API_BASE = "https://swordgame-5.onrender.com";
  const sendNotification = async () => {
  if (!notificationMessage.trim()) return;
  setNotifLoading(true);

  try {
    const endpoint = userId
      ? "/api/notifications"
      : "/api/notifications/broadcast";

    const body = userId
      ? { userId, message: notificationMessage }
      : { message: notificationMessage };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed");

    // ✅ Show in admin activity log
    setEvents((prev) => [
      {
        type: "ADMIN_NOTIFICATION_SENT",
        message: notificationMessage,
        userId: userId || "ALL",
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    setNotificationCount((prev) => prev + 1);
    setNotificationMessage("");
    setUserId("");

  } catch (err) {
    console.error(err);
    alert("Notification failed");
  } finally {
    setNotifLoading(false);
  }
};

  /* =========================
     EVENT RENDERER
  ========================= */
  const renderEvent = (event) => {
    switch (event.type) {
      case "GAME_CREATED": return `🎮 Game created by ${event.userId}`;
      case "GAME_STARTED": return `🚀 Game started`;
      case "GAME_RESULT": return `🏆 Winner ${event.winnerId}`;
      case "REFERRAL_LINK_SHARED": return `🔗 ${event.username} shared referral link`;
      case "REFERRAL_SIGNUP": return `👥 ${event.username} referred a user`;
      case "REFERRAL_REWARD": return `🎁 ${event.username} earned ${event.coins} coins`;
      case "ADMIN_NOTIFICATION": return `📣 Notification received → ${event.message}`;
      case "ADMIN_NOTIFICATION_SENT": return `📤 Admin sent → ${event.message}`;
      default: return `⚡ ${event.type}`;
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <>
      {/* USERS + ACTIVITY */}
      <section className="flex gap-4">
        <div className="bg-white p-4 shadow rounded w-1/3">
          <h1 className="text-xl font-bold mb-3">Welcome Admin</h1>
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
              {renderEvent(event)}
              {event.enemies && ` - Enemies: ${event.enemies?.length || 0}`}
              {event.newPot && ` - Pot: ${event.newPot}`}
              <div className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GAME CONTROLLER */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <h2 className="font-semibold mb-3">🎮 Live Game Controller</h2>
        <div className="max-h-[400px] overflow-y-auto">
          {games.map((game) => (
            <div key={game.gameId} className="p-3 mb-3 bg-gray-50 rounded border">
              <div className="font-semibold">Game {game.gameId?.slice(0, 6)}</div>
              <div className="text-sm text-gray-500">Host: {game.hostId || game.userId || "N/A"}</div>
              <div className="text-yellow-600 text-sm">Pot: {game.pot}</div>
              <div className="text-xs mt-1">Players: {game.players?.join(", ") || "None"}</div>

              {gameEnemies[game.gameId]?.length > 0 && (
                <div className="mt-2 text-xs bg-red-50 p-2 rounded border">
                  <div className="font-semibold text-red-700 mb-1">⚔️ Enemy Positions</div>
                  {gameEnemies[game.gameId].map((enemy) => (
                    <div key={enemy.id} className="mb-1">
                      <div>ID: {enemy.id}</div>
                      <div>
                        X: {Number(enemy.position?.x ?? 0).toFixed(2)} | Y: {Number(enemy.position?.y ?? 0).toFixed(2)} | Z: {Number(enemy.position?.z ?? 0).toFixed(2)}
                      </div>
                      <div>HP: {enemy.health ?? 0}</div>
                      <hr className="my-1" />
                    </div>
                  ))}
                </div>
              )}

              {game.status === "waiting" && (
                <div className="flex flex-col gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Number of Enemies"
                    value={gameControls[game.gameId]?.enemies || ""}
                    onChange={(e) =>
                      setGameControls((prev) => ({
                        ...prev,
                        [game.gameId]: { ...prev[game.gameId], enemies: e.target.value },
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
                        [game.gameId]: { ...prev[game.gameId], pot: e.target.value },
                      }))
                    }
                    className="border px-2 py-1 text-xs rounded"
                  />
                  <button
                    onClick={() => setupAndStartGame(game.gameId)}
                    className="bg-green-600 text-white px-3 py-1 text-xs rounded"
                  >
                    🎮 Configure & Start
                  </button>
                </div>
              )}

              {game.enemiesConfigured && <div className="text-sm text-red-600 mt-2">⚔️ Enemies deployed: {game.numEnemies}</div>}
              {game.status === "started" && <div className="text-sm text-green-600 mt-2">🟢 Game started</div>}
              {game.status === "finished" && <div className="text-sm text-gray-600 mt-2">🏁 Game finished</div>}
            </div>
          ))}
        </div>
      </section>

      {/* SIDEBAR */}
      <section>
        <div className="flex min-h-screen bg-gray-100 mt-4">
          <aside className="w-64 bg-white shadow-lg p-4">
            <h1 className="text-xl font-bold text-center mb-6">🛡 Admin Panel</h1>
            <nav className="space-y-2">
              <NavLink to="/admin/monitor" className={linkClass}>🎮 Live Monitor</NavLink>
              <NavLink to="/admin/credit-coins" className={linkClass}>💰 Credit/Debit Coins</NavLink>
              <NavLink to="/admin/host-game" className={linkClass}>🎲 Host 1v1 Game</NavLink>
              <NavLink to="/admin/transactions" className={linkClass}>📜 Transactions</NavLink>
            </nav>
            <button onClick={() => dispatch(logout())} className="mt-10 w-full bg-red-500 text-white py-2 rounded">Logout</button>
          </aside>
          <main className="flex-1 p-6"><Outlet /></main>
        </div>
      </section>

      {/* SEND NOTIFICATION */}
      <section className="mt-4 bg-white p-4 shadow rounded">
        <h2 className="text-lg font-semibold mb-3">📣 Send Notification</h2>
        <div className="flex flex-col gap-3">
          <input
            placeholder="User ID (optional)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="p-2 border rounded bg-gray-100"
          />
          <input
            placeholder="Notification message"
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            className="p-2 border rounded bg-gray-100"
          />
          <button
            onClick={sendNotification}
            disabled={notifLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {notifLoading ? "Sending..." : "Send Notification"}
          </button>
          <p className="text-sm text-gray-500">Notifications sent: {notificationCount}</p>
        </div>
      </section>
    </>
  );
}