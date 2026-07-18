import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Engine } from "@babylonjs/core";
import { io } from "socket.io-client";
import { Game } from "../bubble/Game";
import { GameLoader } from "../component/Spinner";
import { API } from "../features/Api";

export default function HostBubble() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const gameRef = useRef(null);
  const joinedRef = useRef(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("HostBubble mounted");
    if (!gameId) return;

    const token = localStorage.getItem("token");

    const socket = io("https://swordgame-5.onrender.com", {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      autoConnect: false,
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    engineRef.current = engine;

    //------------------------------------------------
    // CONNECT
    //------------------------------------------------

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", reason);
    });

    //------------------------------------------------
    // GAME STARTED
    //------------------------------------------------

    socket.on("gameStarted", (config) => {
      try {
        console.log("🎮 gameStarted", config);

        if (String(config.gameId) !== String(gameId)) {
          console.log("Wrong game");
          return;
        }

        if (gameRef.current) {
          console.log("Game already exists");
          return;
        }

        console.log("Creating Game");

        const game = new Game(engine, canvas, gameId, socket);

        console.log("Game created");

        gameRef.current = game;

        game.start(config);

        console.log("Game started");

        engine.runRenderLoop(() => {
          game.render();
        });

        setLoading(false);

        console.log("Loading hidden");
      } catch (err) {
        console.error("gameStarted crashed:", err);
      }
    });
    //------------------------------------------------
    // CONFIG
    //------------------------------------------------

    socket.on("gameConfig", (config) => {
      console.log("⚙️ gameConfig", config);

      gameRef.current?.setConfig?.(config);
    });

    //------------------------------------------------
    // TIMER
    //------------------------------------------------

    socket.on("timer", (timeRemaining) => {
      console.log("⏰", timeRemaining);

      gameRef.current?.updateTimer?.(timeRemaining);
    });

    //------------------------------------------------
    // FINISHED
    //------------------------------------------------

    socket.on("gameFinished", (result) => {
      console.log("🏆 gameFinished", result);

      gameRef.current?.finish?.(result);
    });

    //------------------------------------------------
    // ERROR
    //------------------------------------------------

    socket.on("bubble:error", ({ message }) => {
      console.error(message);

      alert(message);

      navigate("/bubble");
    });

    //------------------------------------------------
    // JOIN
    //------------------------------------------------

    const connectAndJoin = async () => {
      try {
        console.log("Checking game...", gameId);

        // Verify game exists
        await API.get(`/bubble/${gameId}`);

        const join = () => {
          if (joinedRef.current) return;

          joinedRef.current = true;

          console.log("📤 bubble:join", gameId);

          socket.emit("bubble:join", gameId, (response) => {
            console.log("🫧 bubble:join response:", response);

            if (!response?.success) {
              joinedRef.current = false;

              alert(response?.message || "Unable to join");

              navigate("/bubble");
              return;
            }

            console.log("✅ Successfully joined Bubble game");
            // Wait for the server to emit:
            // socket.emit("gameStarted", payload)
          });
        };

        if (!socket.connected) {
          socket.connect();

          socket.once("connect", () => {
            console.log("✅ Connected:", socket.id);
            join();
          });
        } else {
          join();
        }
      } catch (err) {
        console.error("Join error:", err);

        joinedRef.current = false;

        alert(err.response?.data?.message || "Unable to join.");

        navigate("/bubble");
      }
    };

    connectAndJoin();

    //------------------------------------------------
    // CLEANUP
    //------------------------------------------------

    return () => {
      socket.disconnect();

      engine.stopRenderLoop();

      gameRef.current?.scene?.dispose();

      gameRef.current = null;

      engine.dispose();

      joinedRef.current = false;
    };
  }, [gameId, navigate]);

  return (
    <>
      {loading && <GameLoader />}

      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100vh",
          display: loading ? "none" : "block",
        }}
      />
    </>
  );
}
