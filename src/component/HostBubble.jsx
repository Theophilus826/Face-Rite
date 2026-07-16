import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Engine } from "@babylonjs/core";
import { Game } from "../bubble/Game";
import { socket } from "../bubble/socket";
import { GameLoader } from "../component/Spinner";

export default function HostBubble() {
  const { gameId } = useParams();

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const gameRef = useRef(null);
  const joinedRef = useRef(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const engine = new Engine(canvas, true);
    engineRef.current = engine;

    const handleStart = (config) => {
      if (config.gameId !== gameId) return;

      // Prevent duplicate starts
      if (gameRef.current) return;

      const game = new Game(engine, canvas, gameId);
      gameRef.current = game;

      game.start();

      engine.runRenderLoop(() => {
        game.render();
      });

      setLoading(false);
    };

    const handleResize = () => {
      engine.resize();
      gameRef.current?.resize?.();
    };

    // Listen before emitting to avoid race conditions
    socket.on("gameStarted", handleStart);

    // Join only once
    if (!joinedRef.current) {
      joinedRef.current = true;
      socket.emit("joinGame", gameId);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      socket.off("gameStarted", handleStart);

      window.removeEventListener("resize", handleResize);

      engine.stopRenderLoop();

      if (gameRef.current?.scene) {
        gameRef.current.scene.dispose();
      }

      gameRef.current = null;
      engineRef.current = null;
      joinedRef.current = false;

      engine.dispose();
    };
  }, [gameId]);

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