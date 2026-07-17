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

    const engine = new Engine(canvas, true);
    engineRef.current = engine;

    //----------------------------------------------------
    // Bubble Started
    //----------------------------------------------------
    const handleGameStarted = (config) => {
      console.log("🫧 Bubble Started", config);

      if (String(config.gameId) !== String(gameId)) return;
      if (gameRef.current) return;

      const game = new Game(engine, canvas, gameId, socket);

      gameRef.current = game;

      game.start(config);

      engine.runRenderLoop(() => {
        game.render();
      });

      setLoading(false);
    };

    //----------------------------------------------------
    // Bubble Finished
    //----------------------------------------------------
    const handleFinished = (data) => {
      console.log("🏁 Bubble Finished", data);

      gameRef.current?.finish?.(data);
    };

    //----------------------------------------------------
    // Bubble Timer
    //----------------------------------------------------
    const handleTimer = (data) => {
      gameRef.current?.updateTimer?.(data.timeRemaining);
    };

    //----------------------------------------------------
    // Bubble Config
    //----------------------------------------------------
    const handleConfig = (config) => {
      gameRef.current?.setConfig?.(config);
    };

    //----------------------------------------------------
    // Bubble Error
    //----------------------------------------------------
    const handleError = ({ message }) => {
      alert(message);
      navigate("/bubble");
    };

    //----------------------------------------------------
    // Connect
    //----------------------------------------------------
    const connectAndJoin = async () => {
      try {
        await API.get(`/bubble/${gameId}`);

        const join = () => {
          if (joinedRef.current) return;

          joinedRef.current = true;

          console.log("🫧 Joining Bubble:", gameId);

          socket.emit("bubble:join", gameId);
        };

        if (!socket.connected) {
          socket.connect();

          socket.once("connect", () => {
            console.log("✅ Socket:", socket.id);
            join();
          });
        } else {
          join();
        }
      } catch (err) {
        console.error(err);

        alert(err.response?.data?.message || "Unable to join.");

        navigate("/bubble");
      }
    };

    //----------------------------------------------------
    // Events
    //----------------------------------------------------
    socket.on("bubble:started", handleGameStarted);
    socket.on("bubble:config", handleConfig);
    socket.on("bubble:timer", handleTimer);
    socket.on("bubble:finished", handleFinished);
    socket.on("bubble:error", handleError);

    connectAndJoin();

    //----------------------------------------------------
    // Cleanup
    //----------------------------------------------------
    return () => {
      socket.off("bubble:started", handleGameStarted);
      socket.off("bubble:config", handleConfig);
      socket.off("bubble:timer", handleTimer);
      socket.off("bubble:finished", handleFinished);
      socket.off("bubble:error", handleError);

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