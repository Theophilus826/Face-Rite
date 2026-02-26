import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as BABYLON from "@babylonjs/core";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

import { buyItem } from "../features/coins/CoinSlice.js";
import { hostGame, addToPot } from "../features/gameSlice/gameSlice";
import gameScene from "../scenes/gameScene.js";

export default function HostGame() {
  const dispatch = useDispatch();

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const socketRef = useRef(null);

  const user = useSelector((state) => state.auth.user);
  const coins = useSelector((state) => state.coins.balance);

  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [gameStarted, setGameStarted] = useState(false);
  const [game, setGame] = useState(null);

  /* =========================================================
     CREATE GAME (NOW WAITS FOR ADMIN)
  ========================================================= */
  const handlePlaySolo = async () => {
    if (!user?._id) return toast.error("User session error");
    if (amount <= 0) return toast.error("Invalid amount");
    if (coins < amount) return toast.error("Not enough coins");

    try {
      setLoading(true);

      await dispatch(buyItem({ itemName: "Play Game", cost: amount }));

      const action = await dispatch(
        hostGame({ hostId: user._id, amount })
      );

      const newGame = action.payload;

      setGame(newGame);

      toast.info("⌛ Waiting for admin to start the battle...");
    } catch (err) {
      console.error("🔥 ERROR:", err);
      toast.error(err?.message || "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SOCKET LISTENER (ADMIN STARTS GAME)
  ========================================================= */
useEffect(() => {
  if (!game) return;

  const token = localStorage.getItem("token");

  const socket = io("https://swordgame-5.onrender.com", {
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    console.log("🎮 Player socket connected:", socket.id);
    socket.emit("joinRoom", game.id);
  });

  socket.on("connect_error", (err) => console.error("🚨 Socket connect error:", err.message));
  socket.on("disconnect", (reason) => console.warn("⚠️ Socket disconnected:", reason));

  // ✅ Unified game:event listener
  socket.on("game:event", (data) => {
    if (data.gameId !== game.id) return;

    switch (data.type) {
      case "ADMIN_CONFIG_ENEMIES":
        toast.info("⚔️ Enemies deployed!");
        break;

      case "GAME_STARTED":
        toast.success("🚀 Battle started!");
        setGameStarted(true);
        break;

      case "ADMIN_ADD_POT":
        toast.info(`Pot increased: +${data.amount}`);
        setGame((prev) => ({ ...prev, pot: data.newPot }));
        break;

      case "GAME_RESULT":
        setGameStarted(false);
        setGame((prev) => ({ ...prev, winnerId: data.winnerId }));
        if (data.winnerId === user._id) {
          toast.success(`🎉 You won ${data.creditedCoins} coins!`);
        }
        break;

      case "PLAYER_ATTACK":
        // Optional: update enemy health UI or log attacks
        console.log("Player attacked enemy:", data);
        break;

      default:
        console.log("Unhandled game:event:", data);
    }
  });

  return () => {
    socket.removeAllListeners();
    socket.disconnect();
    socketRef.current = null;
  };
}, [game?.id, user?._id]);

  /* =========================================================
     ADD TO POT (Still Works)
  ========================================================= */
  const handleAddToPot = async (amountToAdd) => {
    if (!game) return toast.error("No active game");

    try {
      const res = await fetch("/api/game/add-to-pot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, amount: amountToAdd }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Added ${amountToAdd} coins to pot`);
      setGame((prev) => ({ ...prev, pot: data.pot }));

      dispatch(addToPot({ gameId: game.id, amount: amountToAdd }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* =========================================================
     LOAD BABYLON SCENE (ONLY AFTER START)
  ========================================================= */
  useEffect(() => {
    if (!gameStarted || !canvasRef.current || !game || !user) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    engineRef.current = engine;

    const startScene = async () => {
      try {
        const scene = await gameScene(
          BABYLON,
          engine,
          null,
          (p) => setProgress(p),
          dispatch,
          game,
          user
        );

        sceneRef.current = scene;

        engine.runRenderLoop(() => {
          if (scene && !scene.isDisposed) scene.render();
        });

        scene.onDisposeObservable.add(() => {
          if (scene.lastWinnerId === user._id && scene.lastWinAmount > 0) {
            toast.success(`🎉 Coins credited: +${scene.lastWinAmount}`);
          }
        });
      } catch (err) {
        console.error("🔥 Scene Crash:", err);
      }
    };

    startScene();

    const resizeHandler = () => engine.resize();
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      sceneRef.current?.dispose();
      engineRef.current?.dispose();
    };
  }, [gameStarted, game, user, dispatch]);

  /* =========================================================
     WAITING SCREEN
  ========================================================= */
  if (game && !gameStarted) {
    return (
      <div className="h-screen flex flex-col justify-center items-center text-white">
        <div className="animate-pulse text-xl mb-4">
          ⌛ Preparing battlefield...
        </div>

        <div className="text-gray-400">
          Waiting for admin to deploy enemies
        </div>

        <div className="mt-6 text-yellow-400">
          Current Pot: {game.pot} coins
        </div>
      </div>
    );
  }

  /* =========================================================
     GAME VIEW
  ========================================================= */
  if (gameStarted) {
    return (
      <>
        <canvas
          ref={canvasRef}
          style={{ width: "100vw", height: "100vh", display: "block" }}
        />

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            className="px-4 py-2 bg-yellow-600 rounded"
            onClick={() => handleAddToPot(10)}
          >
            +10 Pot
          </button>

          <button
            className="px-4 py-2 bg-yellow-600 rounded"
            onClick={() => handleAddToPot(50)}
          >
            +50 Pot
          </button>
        </div>
      </>
    );
  }

  /* =========================================================
     HOST UI
  ========================================================= */
  return (
    <div className="max-w-xl mx-auto text-white mt-10">
      <h2 className="text-2xl mb-4">Solo Game</h2>

      <div className="flex items-center gap-4">
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(+e.target.value)}
          className="text-black px-3 py-2 rounded w-32"
        />

        <button
          onClick={handlePlaySolo}
          disabled={loading}
          className="px-4 py-2 bg-green-600 rounded"
        >
          {loading ? "Creating..." : "Play 🎮"}
        </button>
      </div>
    </div>
  );
}
