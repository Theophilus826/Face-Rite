import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminBubble() {
  const [games, setGames] = useState([]);

  const [form, setForm] = useState({
    title: "Bubble Tournament",
    image: "/multA.jpg",
    betAmount: 100,
    rewardAmount: 180,
    maxPlayers: 10,
    scoreTarget: 300,
    turnsBeforeShift: 3,
    timeLimit: 180,
    level: 1,
  });

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const hostGame = async () => {
    try {
      const { data } = await axios.post(
        "/api/bubble",
        form,
        { headers }
      );

      if (data.success) {
        setGames((prev) => [data.game, ...prev]);

        alert("Game hosted successfully!");

        setForm({
          title: "Bubble Tournament",
          image: "/multA.jpg",
          betAmount: 100,
          rewardAmount: 180,
          maxPlayers: 10,
          scoreTarget: 300,
          turnsBeforeShift: 3,
          timeLimit: 180,
          level: 1,
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to host game.");
    }
  };

  const removeGame = async (id) => {
    if (!window.confirm("End this game?")) return;

    try {
      const { data } = await axios.delete(
        `/api/bubble/${id}`,
        { headers }
      );

      if (data.success) {
        setGames((prev) =>
          prev.filter((game) => game._id !== id)
        );
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to remove game.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        🎮 Bubble Game Admin
      </h1>

      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-5">
          Host New Game
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Game Title"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="Image URL"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            name="betAmount"
            value={form.betAmount}
            onChange={handleChange}
            placeholder="Bet Amount"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            name="rewardAmount"
            value={form.rewardAmount}
            onChange={handleChange}
            placeholder="Reward Amount"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            name="maxPlayers"
            value={form.maxPlayers}
            onChange={handleChange}
            placeholder="Max Players"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            name="scoreTarget"
            value={form.scoreTarget}
            onChange={handleChange}
            placeholder="Target Score"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            name="turnsBeforeShift"
            value={form.turnsBeforeShift}
            onChange={handleChange}
            placeholder="Turns Before Shift"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            name="timeLimit"
            value={form.timeLimit}
            onChange={handleChange}
            placeholder="Time Limit"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            name="level"
            value={form.level}
            onChange={handleChange}
            placeholder="Level"
            className="bg-gray-800 rounded-lg px-4 py-3"
          />

        </div>

        <button
          onClick={hostGame}
          className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
        >
          Host Game
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-5">
          Hosted Games ({games.length})
        </h2>

        {games.length === 0 ? (
          <p className="text-gray-400">
            No active hosted games.
          </p>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div
                key={game._id}
                className="flex justify-between items-center bg-gray-800 rounded-lg p-4"
              >
                <div>
                  <h3 className="font-bold text-lg">
                    {game.title}
                  </h3>

                  <p>💰 Bet: ₦{game.betAmount}</p>

                  <p>🏆 Reward: ₦{game.rewardAmount}</p>

                  <p>
                    👥 Players: {game.players.length}/{game.maxPlayers}
                  </p>

                  <p>🎯 Score: {game.scoreTarget}</p>

                  <p>⏱ {game.timeLimit}s</p>

                  <p>⭐ Level {game.level}</p>

                  <p className="text-green-400">
                    {game.status}
                  </p>
                </div>

                <button
                  onClick={() => removeGame(game._id)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                >
                  End Game
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}