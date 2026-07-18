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
    console.log("canvas", canvas);

    console.log("parent", canvas.parentElement);
    console.log("parent rect", canvas.parentElement.getBoundingClientRect());

    console.log(
      "grandparent rect",
      canvas.parentElement.parentElement?.getBoundingClientRect(),
    );

    console.log("body", document.body.getBoundingClientRect());

    console.log(
      "root",
      document.getElementById("root")?.getBoundingClientRect(),
    );

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    console.log("================================");
    console.log("Canvas Element");
    console.log("client:", canvas.clientWidth, canvas.clientHeight);
    console.log("offset:", canvas.offsetWidth, canvas.offsetHeight);
    console.log("bounding:", canvas.getBoundingClientRect());

    console.log("================================");
    console.log("Babylon Engine");
    console.log("render:", engine.getRenderWidth(), engine.getRenderHeight());

    requestAnimationFrame(() => {
      console.log("================================");
      console.log("After requestAnimationFrame");

      console.log("client:", canvas.clientWidth, canvas.clientHeight);
      console.log("offset:", canvas.offsetWidth, canvas.offsetHeight);
      console.log("bounding:", canvas.getBoundingClientRect());

      engine.resize();

      console.log(
        "render after resize:",
        engine.getRenderWidth(),
        engine.getRenderHeight(),
      );
    });

    engineRef.current = engine;

    //------------------------------------------------
    // Resize
    //------------------------------------------------

    const handleResize = () => {
      engine.resize();
      gameRef.current?.resize();
    };

    window.addEventListener("resize", handleResize);

    //------------------------------------------------
    // Socket Events
    //------------------------------------------------

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", reason);
    });

    //------------------------------------------------
    // Game Started
    //------------------------------------------------

    socket.on("gameStarted", (config) => {
      try {
        console.log("🎮 gameStarted", config);

        if (String(config.gameId) !== String(gameId)) return;

        if (gameRef.current) return;

        const game = new Game(engine, canvas, gameId, socket);

        gameRef.current = game;

        game.start(config);

        engine.runRenderLoop(() => {
          game.render();
        });

        setLoading(false);
      } catch (err) {
        console.error("gameStarted crashed:", err);
      }
    });

    //------------------------------------------------
    // Config Updates
    //------------------------------------------------

    socket.on("gameConfig", (config) => {
      console.log("⚙️ gameConfig", config);
      gameRef.current?.setConfig(config);
    });

    //------------------------------------------------
    // Timer Updates
    //------------------------------------------------

    socket.on("timer", (timeRemaining) => {
      gameRef.current?.updateTimer(timeRemaining);
    });

    //------------------------------------------------
    // Finished
    //------------------------------------------------

    socket.on("gameFinished", (result) => {
      console.log("🏆", result);
      gameRef.current?.finish?.(result);
    });

    //------------------------------------------------
    // Errors
    //------------------------------------------------

    socket.on("bubble:error", ({ message }) => {
      alert(message);
      navigate("/bubble");
    });

    //------------------------------------------------
    // Join Game
    //------------------------------------------------

    const connectAndJoin = async () => {
      try {
        await API.get(`/bubble/${gameId}`);

        const join = () => {
          if (joinedRef.current) return;

          joinedRef.current = true;

          socket.emit("bubble:join", gameId, (response) => {
            if (!response?.success) {
              joinedRef.current = false;

              alert(response?.message || "Unable to join");

              navigate("/bubble");
            }
          });
        };

        if (!socket.connected) {
          socket.connect();
          socket.once("connect", join);
        } else {
          join();
        }
      } catch (err) {
        joinedRef.current = false;

        alert(err.response?.data?.message || "Unable to join.");

        navigate("/bubble");
      }
    };

    connectAndJoin();

    //------------------------------------------------
    // Cleanup
    //------------------------------------------------

    return () => {
      window.removeEventListener("resize", handleResize);

      socket.disconnect();

      engine.stopRenderLoop();

      gameRef.current?.scene?.dispose();

      gameRef.current = null;

      engine.dispose();

      joinedRef.current = false;
    };
  }, [gameId, navigate]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#111",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
      />
    </div>
  );
}
