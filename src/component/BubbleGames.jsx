import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API } from "../features/Api";
import RobotLoader from "./Spinner";

export default function BubbleGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const navigate = useNavigate();
  const socketRef = useRef(null);

  const fetchGames = useCallback(async () => {
    try {
      const { data } = await API.get("/bubble");

      if (data.success) {
        setGames(data.games || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();

    const token = localStorage.getItem("token");

    const socket = io("https://swordgame-5.onrender.com", {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Bubble Lobby:", socket.id);
    });

    socket.on("bubble:created", fetchGames);
    socket.on("bubble:updated", fetchGames);
    socket.on("bubble:removed", fetchGames);

    return () => {
      socket.off("bubble:created", fetchGames);
      socket.off("bubble:updated", fetchGames);
      socket.off("bubble:removed", fetchGames);

      socket.disconnect();
    };
  }, [fetchGames]);

  const joinGame = async (gameId) => {
    console.log("====================================");
    console.log("🟢 JOIN BUTTON CLICKED");
    console.log("Game ID:", gameId);
    console.log("====================================");

    try {
      setJoining(true);

      console.log("📡 Sending POST:", `/bubble/${gameId}/join`);

      const response = await API.post(`/bubble/${gameId}/join`);

      console.log("✅ API RESPONSE");
      console.log(response);

      const { data } = response;

      console.log("Response data:", data);

      if (!data.success) {
        console.error("❌ Server returned success=false");
        throw new Error(data.message || "Join failed");
      }

      console.log("✅ Join successful");
      console.log("➡️ Navigating to:", `/host-game/${gameId}`);

      console.log("➡️ Navigating to:", `/bubble/${gameId}`);
      navigate(`/bubble/${gameId}`);
    } catch (err) {
      console.error("❌ JOIN ERROR");
      console.error(err);

      console.log("Axios response:", err.response);
      console.log("Axios data:", err.response?.data);
      console.log("Status:", err.response?.status);

      setJoining(false);

      alert(
        err.response?.data?.message || err.message || "Unable to join game.",
      );
    }
  };

  if (loading || joining) {
    return <RobotLoader />;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">🫧 Live Bubble Games</h2>
          <p className="text-gray-400 text-xs">
            Join a hosted multiplayer match
          </p>
        </div>

        <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
          {games.length} Live
        </span>
      </div>

      {games.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-sm text-gray-400">
          No live games available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.map((game) => (
            <div
              key={game._id}
              className="group overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500 transition-all duration-300"
            >
              <div className="relative">
                <img
                  src={game.image || "/bub.png"}
                  alt={game.title}
                  className="w-full h-32 object-cover"
                />

                <span className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-full text-[10px]">
                  {game.status}
                </span>
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-lg mb-3 truncate">
                  {game.title}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <div className="text-gray-400">Bet</div>
                    <div className="text-yellow-400 font-bold">
                      ₦{game.betAmount}
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-2">
                    <div className="text-gray-400">Reward</div>
                    <div className="text-green-400 font-bold">
                      ₦{game.rewardAmount}
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-2">
                    <div className="text-gray-400">Players</div>
                    <div>
                      {game.players?.length || 0}/{game.maxPlayers}
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-2">
                    <div className="text-gray-400">Time</div>
                    <div>{game.timeLimit}s</div>
                  </div>
                </div>

                <button
                  onClick={() => joinGame(game._id)}
                  disabled={
                    game.status !== "Waiting" ||
                    (game.players?.length || 0) >= game.maxPlayers
                  }
                  className="mt-3 w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 py-2 text-sm font-semibold disabled:bg-gray-600"
                >
                  {(game.players?.length || 0) >= game.maxPlayers
                    ? "Game Full"
                    : "Join Match"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
