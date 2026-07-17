import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Engine } from "@babylonjs/core";
import { Game } from "../bubble/Game";
import { io } from "socket.io-client";
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
    // GAME STARTED
    //----------------------------------------------------
    const handleGameStarted = (config) => {
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
    // CONNECT & JOIN
    //----------------------------------------------------
    const connectAndJoin = async () => {
      try {
        await API.get(`/bubble/${gameId}`);

        const join = () => {
          if (joinedRef.current) return;

          joinedRef.current = true;

          socket.emit("bubble:init");

          socket.emit("joinGame", gameId, (res) => {
            if (!res.success) {
              alert(res.message);
              navigate("/bubble");
            }
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
        console.error(err);
        alert(err.response?.data?.message || "Unable to join game.");
        navigate("/bubble");
      }
    };

    socket.on("gameStarted", handleGameStarted);

    connectAndJoin();

    return () => {
      socket.off("gameStarted", handleGameStarted);
      socket.disconnect();

      engine.stopRenderLoop();
      gameRef.current?.scene?.dispose();
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
