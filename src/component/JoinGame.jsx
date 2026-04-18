import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { joinGame } from "../features/gameSlice/gameSlice";

export default function JoinGame({ gameId }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const games = useSelector((state) => state.games.games);

  const [game, setGame] = useState(null);

  // Keep local game state synced with global Redux state
  useEffect(() => {
    const foundGame = games.find((g) => g.id === gameId) || null;
    setGame(foundGame);
  }, [games, gameId]);

  if (!game) return <p className="text-white">Game not found.</p>;

  const handleJoin = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // Type-safe check for existing player
    const isUserInGame = game.players.some(
      (p) => String(p) === String(user.id)
    );
    if (isUserInGame) {
      toast.info("You are already in this game");
      return;
    }

    if (game.status !== "waiting") {
      toast.error("Game already started");
      return;
    }

    try {
      // Optimistic UI update
      setGame((prev) => ({
        ...prev,
        players: [...prev.players, user.id],
        status:
          prev.players.length + 1 === prev.maxPlayers ? "started" : prev.status,
        pot: prev.pot + game.amount,
      }));

      // Dispatch Redux action to update global state
      await dispatch(joinGame({ gameId: game.id, userId: user.id, amount: game.amount })).unwrap();

      toast.success("Joined game successfully 🎮");
    } catch (err) {
      toast.error(err?.message || "Failed to join game");
      // Rollback in case of failure
      setGame(games.find((g) => g.id === gameId) || null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-neutral-900 p-6 rounded-lg text-white space-y-4">
      <h2 className="text-2xl font-bold">1v1 Game</h2>
      <p>Game ID: {game.id}</p>
      <p>Status: {game.status}</p>
      <p>Host: {game.players[0]}</p>
      {game.players[1] && <p>Player: {game.players[1]}</p>}
      <p>Pot: {game.pot} coins</p>

      {game.status === "waiting" &&
        !game.players.some((p) => String(p) === String(user?.id)) && (
          <button
            onClick={handleJoin}
            className="w-full bg-green-600 py-2 rounded hover:bg-green-700 transition"
          >
            Join Game
          </button>
        )}

      {game.status === "started" && <p className="text-yellow-400">Game in progress...</p>}
      {game.status === "finished" && <p className="text-green-400">Winner: {game.winner}</p>}
    </div>
  );
}
