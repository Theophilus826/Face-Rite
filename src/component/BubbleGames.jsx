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
    try {
      setJoining(true);

      const { data } = await API.post(`/bubble/${gameId}/join`);

      if (!data.success) {
        throw new Error(data.message);
      }

      navigate(`/host-game/${gameId}`);
    } catch (err) {
      setJoining(false);

      alert(
        err.response?.data?.message ||
          err.message ||
          "Unable to join game."
      );
    }
  };

  if (loading || joining) {
    return <RobotLoader />;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">🫧 Live Bubble Games</h2>
          <p className="text-gray-400 text-sm">
            Join a hosted multiplayer match
          </p>
        </div>

        <span className="bg-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
          {games.length} Live
        </span>
      </div>

      {games.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center text-gray-400">
          No live games available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game._id}
              className="group overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={game.image || "/multA.jpg"}
                  alt={game.title}
                  className="w-full h-48 object-cover"
                />

                <span className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full text-xs">
                  {game.status}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-xl mb-4">{game.title}</h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <div className="text-gray-400">Bet</div>
                    <div className="text-yellow-400 font-bold">
                      ₦{game.betAmount}
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-xl p-3">
                    <div className="text-gray-400">Reward</div>
                    <div className="text-green-400 font-bold">
                      ₦{game.rewardAmount}
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-xl p-3">
                    <div className="text-gray-400">Players</div>
                    <div>
                      {game.players?.length || 0}/{game.maxPlayers}
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-xl p-3">
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
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 font-semibold disabled:bg-gray-600"
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