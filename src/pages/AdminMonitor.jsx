// src/components/AdminMonitor.jsx
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function AdminMonitor() {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const camera = useRef({ zoom: 1, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token"); // ✅ token from login
    if (!token) {
      console.warn("⚠️ No token found. Please log in.");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || "https://swordgame-5.onrender.com";
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const SCALE = 10;

    // =========================
    // Helper functions
    // =========================
    const worldToScreen = (x, z) => ({
      x: x * SCALE * camera.current.zoom + canvas.width / 2 + camera.current.offsetX,
      y: z * SCALE * camera.current.zoom + canvas.height / 2 + camera.current.offsetY,
    });

    const drawGrid = () => {
      const spacing = 50 * camera.current.zoom;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x + (camera.current.offsetX % spacing), 0);
        ctx.lineTo(x + (camera.current.offsetX % spacing), canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y + (camera.current.offsetY % spacing));
        ctx.lineTo(canvas.width, y + (camera.current.offsetY % spacing));
        ctx.stroke();
      }
    };

    const drawBoard = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0a7f4f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid();
    };

    const getRoomColor = (room) =>
      ({ arena1: "#ffd700", arena2: "#00bfff", arena3: "#ff4d4d" }[room] || "yellow");

    const drawHealthBar = (x, y, health) => {
      const width = 30;
      const height = 4;
      ctx.fillStyle = "red";
      ctx.fillRect(x - width / 2, y, width, height);
      ctx.fillStyle = "lime";
      ctx.fillRect(x - width / 2, y, (health / 100) * width, height);
    };

    const drawOverlay = (players) => {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(10, 10, 200, 80);
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText(`👥 Players: ${players.length}`, 20, 35);
      const alive = players.filter((p) => p.health > 0).length;
      ctx.fillText(`❤️ Alive: ${alive}`, 20, 55);
      ctx.fillText(`🔎 Zoom: ${camera.current.zoom.toFixed(2)}`, 20, 75);
    };

    const drawPlayer = (p) => {
      if (!p.position) return;
      const { x, y } = worldToScreen(p.position.x, p.position.z);
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = p.health > 0 ? getRoomColor(p.room) : "gray";
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.fillText(p.username, x - 15, y - 15);

      drawHealthBar(x, y + 12, p.health);
    };

    drawBoard();

    // =========================
    // Socket.IO Connection
    // =========================
    socketRef.current = io(`${API_URL}/admin`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: { token }, // ✅ send token to backend
    });

    socketRef.current.on("connect", () =>
      console.log("🛡 Admin monitor connected:", socketRef.current.id)
    );

    socketRef.current.on("connect_error", (err) =>
      console.error("⚠️ Connection failed:", err.message)
    );

    socketRef.current.on("disconnect", (reason) =>
      console.log("❌ Socket disconnected:", reason)
    );

    socketRef.current.on("tacticalUpdate", ({ players = [] }) => {
      drawBoard();
      players.forEach(drawPlayer);
      drawOverlay(players);
    });

    // =========================
    // Zoom control
    // =========================
    const handleWheel = (e) => {
      e.preventDefault();
      camera.current.zoom += e.deltaY * -0.001;
      camera.current.zoom = Math.min(Math.max(0.5, camera.current.zoom), 2);
    };
    canvas.addEventListener("wheel", handleWheel);

    return () => {
      socketRef.current?.disconnect();
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div className="flex justify-center items-center h-screen bg-green-950">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="rounded-xl shadow-2xl bg-green-800"
      />
    </div>
  );
}