import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function BubbleGames() {
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data } = await axios.get("/api/bubble");

      if (data.success) {
        setGames(data.games);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const joinGame = async (gameId) => {
    try {
      // Optional: reserve a player slot in the game
      await axios.post(`/api/bubble/${gameId}/join`);

      // Open the Babylon game
      navigate(`/host-game/${gameId}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to join game.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 text-white">
      <h1 className="text-3xl font-bold mb-6">
        🫧 Bubble Games
      </h1>

      {games.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
          No games hosted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <div
              key={game._id}
              className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-blue-500 transition"
            >
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-44 object-cover"
              />

              <div className="p-4">
                <h2 className="font-bold text-lg">
                  {game.title}
                </h2>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>💰 Bet</span>
                    <span className="text-yellow-400">
                      ₦{game.betAmount}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>🏆 Reward</span>
                    <span className="text-green-400">
                      ₦{game.rewardAmount}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>👥 Players</span>
                    <span>
                      {game.players.length}/{game.maxPlayers}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="text-green-500">
                      {game.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => joinGame(game._id)}
                  disabled={game.status !== "Waiting"}
                  className="w-full mt-5 bg-blue-600 rounded-lg py-2 hover:bg-blue-700 disabled:bg-gray-600"
                >
                  Join Game
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}