import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as BABYLON from "@babylonjs/core";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

import { buyItem } from "../features/coins/CoinSlice.js";
import { hostGame } from "../features/gameSlice/gameSlice";
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
  const [gameStarted, setGameStarted] = useState(false);
  const [game, setGame] = useState(null);

  /* =========================================================
     CREATE GAME
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

      setGame(action.payload);

      toast.info("⌛ Waiting for admin to start the battle...");
    } catch (err) {
      toast.error(err?.message || "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SOCKET LISTENER (NO WINNER LOGIC)
  ========================================================= */
  useEffect(() => {
    if (!game) return;

    const token = localStorage.getItem("token");

    const socket = io("https://swordgame-5.onrender.com", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinRoom", game.id, (ack) => {
        if (ack?.joined && ack.gameStatus === "started") {
          setGameStarted(true);
          setGame((prev) => ({
            ...prev,
            pot: ack.pot,
            numEnemies: ack.enemies,
          }));
        }
      });
    });

    socket.on("game:event", (data) => {
      if (!game || data.gameId !== game.id) return;

      switch (data.type) {
        case "ENEMIES_CONFIGURED":
          toast.info("⚔️ Enemies deployed!");
          setGame((prev) => ({
            ...prev,
            numEnemies: data.enemies,
          }));
          break;

        case "GAME_STARTED":
          toast.success("🚀 Battle started!");
          setGameStarted(true);
          setGame((prev) => ({
            ...prev,
            pot: data.pot,
            numEnemies: data.enemies,
          }));
          break;

        case "ADMIN_ADD_POT":
          setGame((prev) => ({
            ...prev,
            pot: data.newPot,
          }));
          break;

        default:
          break;
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [game?.id]);

  /* =========================================================
     ADD TO POT
  ========================================================= */
  const handleAddToPot = (amountToAdd) => {
    if (!game) return toast.error("No active game");
    if (!socketRef.current?.connected)
      return toast.error("Socket not connected");

    socketRef.current.emit("host:addToPot", {
      gameId: game.id,
      amount: amountToAdd,
    });
  };

  /* =========================================================
     LOAD BABYLON SCENE
     (Scene decides winner and credits coins)
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
          null,
          dispatch,
          game,
          user
        );

        sceneRef.current = scene;

        engine.runRenderLoop(() => {
          if (scene && !scene.isDisposed) scene.render();
        });

      } catch (err) {
        console.error("Scene crash:", err);
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
  }, [gameStarted, game, user]);

  /* =========================================================
     WAITING SCREEN
  ========================================================= */
  if (game && !gameStarted) {
    return (
      <div className="h-screen flex flex-col justify-center items-center text-white">
        <div className="animate-pulse text-xl mb-4">
          ⌛ Preparing battlefield...
        </div>

        <div className="mt-6 text-yellow-400">
          Current Pot: {game?.pot || 0} coins
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
   HOST UI (PROFESSIONAL + AI STYLE)
========================================================= */
return (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
    
    <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-6 text-white">
      
      {/* Header / Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-lg shadow-lg">
          AI
        </div>
        <div>
          <h2 className="text-xl font-semibold">Spirit Sword</h2>
          <p className="text-xs text-gray-400">AI Powered Game</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-5">
        <label className="block text-sm text-gray-400 mb-2">
          Enter Amount
        </label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(+e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handlePlaySolo}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-all font-medium shadow-md disabled:opacity-50"
      >
        {loading ? "Creating Game..." : "Play Game 🎮"}
      </button>

      {/* Footer */}
      <p className="text-center text-xs text-gray-500 mt-4">
        Powered by AI • Fast • Secure
      </p>
    </div>
  </div>
);
}