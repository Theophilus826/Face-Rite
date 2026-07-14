import React, { useState } from "react";

function AdminBubble() {
  const [form, setForm] = useState({
    title: "Bubble Tournament",
    scoreTarget: 300,
    turnsBeforeShift: 3,
    timeLimit: 180,
    level: 1,
  });

  const [games, setGames] = useState([]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const hostGame = () => {
    const newGame = {
      id: Date.now(),
      ...form,
      status: "Waiting",
      players: 0,
    };

    setGames((prev) => [...prev, newGame]);

    // TODO:
    // axios.post("/api/bubble/create", newGame)
    // OR
    // socket.emit("bubble:create", newGame)
  };

  const removeGame = (id) => {
    setGames((prev) => prev.filter((game) => game.id !== id));

    // TODO:
    // axios.delete(`/api/bubble/${id}`)
    // OR
    // socket.emit("bubble:remove", id)
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        🎮 Bubble Game Admin
      </h1>

      {/* Host Game */}
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
            className="bg-gray-800 rounded-lg px-4 py-3 outline-none"
          />

          <input
            type="number"
            name="scoreTarget"
            value={form.scoreTarget}
            onChange={handleChange}
            placeholder="Target Score"
            className="bg-gray-800 rounded-lg px-4 py-3 outline-none"
          />

          <input
            type="number"
            name="turnsBeforeShift"
            value={form.turnsBeforeShift}
            onChange={handleChange}
            placeholder="Turns Before Shift"
            className="bg-gray-800 rounded-lg px-4 py-3 outline-none"
          />

          <input
            type="number"
            name="timeLimit"
            value={form.timeLimit}
            onChange={handleChange}
            placeholder="Time Limit"
            className="bg-gray-800 rounded-lg px-4 py-3 outline-none"
          />

          <input
            type="number"
            name="level"
            value={form.level}
            onChange={handleChange}
            placeholder="Level"
            className="bg-gray-800 rounded-lg px-4 py-3 outline-none"
          />
        </div>

        <button
          onClick={hostGame}
          className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          Host Game
        </button>
      </div>

      {/* Hosted Games */}
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
                key={game.id}
                className="flex justify-between items-center bg-gray-800 rounded-lg p-4"
              >
                <div>
                  <h3 className="font-bold text-lg">
                    {game.title}
                  </h3>

                  <p className="text-sm text-gray-300">
                    🎯 Score: {game.scoreTarget}
                  </p>

                  <p className="text-sm text-gray-300">
                    ⏱ {game.timeLimit}s
                  </p>

                  <p className="text-sm text-gray-300">
                    ⭐ Level {game.level}
                  </p>

                  <p className="text-green-400">
                    {game.status}
                  </p>
                </div>

                <button
                  onClick={() => removeGame(game.id)}
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

export default AdminBubble;