import * as BABYLON from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

import { buyItem } from "../features/coins/CoinSlice.js";
import gameScene from "../scenes/gameScene.js";

export default function HostGame() {
  /* =========================================================
     REDUX
  ========================================================= */
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const coins = useSelector((state) => state.coins.balance);

  /* =========================================================
     REFS
  ========================================================= */
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const socketRef = useRef(null);

  /* =========================================================
     STATE
  ========================================================= */
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [game, setGame] = useState(null);

  /* =========================================================
     HELPERS
  ========================================================= */
  const getGameConfig = (amount) => {
    const safeAmount = Number(amount) || 0;

    return {
      pot: safeAmount * 2,
      numEnemies: Math.max(1, Math.ceil(safeAmount / 50)),
    };
  };

  const {
    pot: previewPot,
    numEnemies: previewEnemies,
  } = getGameConfig(amount);

  /* =========================================================
     GAME CREATION
  ========================================================= */
  const createServerGame = ({ amount, pot, numEnemies }) => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      return toast.error("Server connection not ready");
    }

    const gameId = crypto.randomUUID();

    socket.emit(
      "game:create",
      {
        gameId,
        hostId: user._id,
        betAmount: amount,
      },
      (createAck) => {
        if (!createAck?.success) {
          return toast.error(createAck?.message || "Failed to create game");
        }

        socket.emit("joinRoom", gameId, (joinAck) => {
          if (!joinAck?.joined) {
            return toast.error("Failed to join room");
          }

          socket.emit(
            "host:configureEnemies",
            {
              gameId,
              numEnemies,
            },
            (enemyAck) => {
              if (!enemyAck?.success) {
                return toast.error(enemyAck?.message);
              }

              setGame({
                id: gameId,
                hostId: user._id,
                username: user.username,
                amount,
                pot,
                enemies: enemyAck.enemies,
              });

              socket.emit("host:startGame", { gameId });
            }
          );
        });
      }
    );
  };

  const handlePlaySolo = async () => {
    if (!user?._id) {
      return toast.error("User session error");
    }

    if (coins < amount) {
      return toast.error("Not enough coins");
    }

    const { pot, numEnemies } = getGameConfig(amount);

    try {
      setLoading(true);

      await dispatch(
        buyItem({
          itemName: "Play Game",
          cost: amount,
        })
      );

      createServerGame({
        amount,
        pot,
        numEnemies,
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPot = (amountToAdd) => {
    if (!game) return toast.error("No active game");

    if (!socketRef.current?.connected) {
      return toast.error("Socket not connected");
    }

    socketRef.current.emit("host:addToPot", {
      gameId: game.id,
      amount: amountToAdd,
    });
  };

  /* =========================================================
     SOCKET CONNECTION
  ========================================================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    const socket = io("https://swordgame-5.onrender.com", {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("connected");
    });

    socket.on("game:event", (data) => {
      switch (data.type) {
        case "GAME_STARTED":
          setGameStarted(true);
          break;

        case "ADMIN_ADD_POT":
          setGame((prev) => ({
            ...prev,
            pot: data.newPot,
          }));
          break;

        case "GAME_RESULT":
          toast.success(`Game ${data.result}`);
          break;

        default:
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /* =========================================================
     BABYLON GAME SCENE
  ========================================================= */
  useEffect(() => {
    if (!gameStarted || !canvasRef.current || !game || !user) {
      return;
    }

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
          if (scene && !scene.isDisposed()) {
            scene.render();
          }
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

        <div className="mt-6 text-yellow-400">
          Current Pot: {game?.pot || 0} coins
        </div>

        <div className="mt-2 text-red-400">
          Enemies: {game?.enemies?.length || 1}
        </div>

        <div className="mt-2 text-cyan-400">
          Player: {game?.username}
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
          style={{
            width: "100vw",
            height: "100vh",
            display: "block",
          }}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-6 text-white">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-lg shadow-lg">
            AI
          </div>

          <div>
            <h2 className="text-xl font-semibold">Spirit Sword</h2>
            <p className="text-xs text-gray-400">
              AI Powered Game
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">
            Enter Amount
          </label>

          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-gray-400">Pot</p>
              <p className="text-xl font-bold text-yellow-400">
                {previewPot} Coins
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-gray-400">Enemies</p>
              <p className="text-xl font-bold text-red-400">
                {previewEnemies}
              </p>
            </div>
          </div>
        </div>

        {/* Play Button */}
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