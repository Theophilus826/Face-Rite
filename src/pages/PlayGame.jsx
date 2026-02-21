import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import * as BABYLON from "@babylonjs/core";

import gameScene from "../scenes/gameScene.js";

export default function PlayGame() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const { id } = useParams();
  const games = useSelector((state) => state.games.games);
  const user = useSelector((state) => state.auth.user);

  const game = games.find((g) => String(g.id) === id);

  useEffect(() => {
    if (!canvasRef.current || !game || !user) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    engineRef.current = engine;

    const startGame = async () => {
      setLoading(true);
      setProgress(0);

      // Pass progress callback to gameScene
      const scene = await gameScene(BABYLON, engine, sceneRef.current, setProgress, user);
      sceneRef.current = scene;

      setLoading(false);

      engine.runRenderLoop(() => {
        if (scene && !scene.isDisposed()) scene.render();
      });
    };

    startGame();

    const resizeHandler = () => engine.resize();
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      sceneRef.current?.dispose();
      engineRef.current?.dispose();
    };
  }, [game, user]);

  if (!game) return <h2>Game not found</h2>;

  return (
    <>
      {loading && (
        <div className="absolute inset-0 bg-black/85 flex flex-col justify-center items-center text-white z-10">
          <div
            className="border-4 border-t-4 border-white border-t-blue-500 rounded-full w-16 h-16 mb-4 animate-spin"
          />
          Loading game... {progress}%
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ width: "100vw", height: "100vh", display: "block" }}
      />
    </>
  );
}
