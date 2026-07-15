import React, { useEffect, useState } from "react";
import { API } from "../features/Api";

export default function AdminBubble() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    image: "/multA.jpg",
    betAmount: "",
    rewardAmount: "",
    maxPlayers: "",
    scoreTarget: "",
    turnsBeforeShift: "",
    timeLimit: "",
    level: "",
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data } = await API.get("/bubble");

      if (data.success) {
        setGames(data.games);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const hostGame = async () => {
    if (
      !form.title ||
      form.betAmount === "" ||
      form.rewardAmount === "" ||
      form.maxPlayers === "" ||
      form.scoreTarget === "" ||
      form.turnsBeforeShift === "" ||
      form.timeLimit === "" ||
      form.level === ""
    ) {
      return alert("Please fill in all fields.");
    }

    try {
      setLoading(true);

      const { data } = await API.post("/bubble", form);

      if (data.success) {
        alert("Game hosted successfully!");
        await fetchGames();

        setForm({
          title: "",
          image: "/multA.jpg",
          betAmount: "",
          rewardAmount: "",
          maxPlayers: "",
          scoreTarget: "",
          turnsBeforeShift: "",
          timeLimit: "",
          level: "",
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to host game.");
    } finally {
      setLoading(false);
    }
  };

  const removeGame = async (id) => {
    if (!window.confirm("End this game?")) return;

    try {
      const { data } = await API.delete(`/bubble/${id}`);

      if (data.success) {
        setGames((prev) => prev.filter((game) => game._id !== id));
        alert("Game removed successfully.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to remove game.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">🎮 Bubble Game Admin</h1>

      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-5">Host New Game</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Game Title
            </label>
            <input
              required
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter game title"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Image URL
            </label>
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="/multA.jpg"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Bet Amount (₦)
            </label>
            <input
              required
              type="number"
              min="1"
              name="betAmount"
              value={form.betAmount}
              onChange={handleChange}
              placeholder="100"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Reward Amount (₦)
            </label>
            <input
              required
              type="number"
              min="1"
              name="rewardAmount"
              value={form.rewardAmount}
              onChange={handleChange}
              placeholder="180"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Maximum Players
            </label>
            <input
              required
              type="number"
              min="2"
              name="maxPlayers"
              value={form.maxPlayers}
              onChange={handleChange}
              placeholder="10"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Target Score
            </label>
            <input
              required
              type="number"
              min="1"
              name="scoreTarget"
              value={form.scoreTarget}
              onChange={handleChange}
              placeholder="300"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Turns Before Shift
            </label>
            <input
              required
              type="number"
              min="1"
              name="turnsBeforeShift"
              value={form.turnsBeforeShift}
              onChange={handleChange}
              placeholder="3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Time Limit (seconds)
            </label>
            <input
              required
              type="number"
              min="10"
              name="timeLimit"
              value={form.timeLimit}
              onChange={handleChange}
              placeholder="180"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">
              Difficulty Level
            </label>
            <input
              required
              type="number"
              min="1"
              max="10"
              name="level"
              value={form.level}
              onChange={handleChange}
              placeholder="1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={hostGame}
          disabled={loading}
          className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
        >
          {loading ? "Hosting..." : "Host Game"}
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-5">
          Hosted Games ({games.length})
        </h2>

        {games.length === 0 ? (
          <p className="text-gray-400">No active hosted games.</p>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div
                key={game._id}
                className="flex justify-between items-center bg-gray-800 rounded-lg p-4"
              >
                <div>
                  <h3 className="font-bold text-lg">{game.title}</h3>

                  <p>💰 Bet: ₦{game.betAmount}</p>

                  <p>🏆 Reward: ₦{game.rewardAmount}</p>

                  <p>
                    👥 Players: {game.players.length}/{game.maxPlayers}
                  </p>

                  <p>🎯 Score: {game.scoreTarget}</p>

                  <p>⏱ {game.timeLimit}s</p>

                  <p>⭐ Level {game.level}</p>

                  <p className="text-green-400">{game.status}</p>
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
