import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

import { finishGame } from "../features/gameSlice/gameSlice";
import { creditCoins } from "../features/coins/CoinSlice";

export default function GameRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const game = useSelector((state) =>
    state.games.games.find((g) => g.id === id)
  );

  const user = useSelector((state) => state.auth.user);

  if (!game) return <h2>Game not found</h2>;
  if (!user) return <h2>Please login</h2>;

  /* =========================
     FINISH MATCH → PAYOUT
  ========================= */
  const handleGameEnd = async (winnerId) => {
    if (game.status === "finished") return;

    try {
      // 1️⃣ Mark game finished
      dispatch(
        finishGame({
          gameId: game.id,
          winnerId,
        })
      );

      // 2️⃣ Reward winner
      await dispatch(
        creditCoins({
          userId: winnerId,
          amount: game.pot,
          description: `Winnings from Game ${game.id}`,
        })
      ).unwrap();

      toast.success("Winner rewarded 🏆💰");
      navigate("/");
    } catch (err) {
      toast.error("Reward failed");
    }
  };

  /* =========================
     PLAY LOGIC (FIXED)
  ========================= */

  const isUserInGame = game.players.includes(user.id);

  // ✅ Play allowed ONLY when game started
  const canPlay = isUserInGame && game.status === "started";

  return (
    <div className="text-white p-6">
      <h2 className="text-2xl font-bold">Game Room</h2>

      <p>Bet Amount: {game.amount}</p>
      <p>💰 Pot: {game.pot}</p>
      <p>
        Players: {game.players.length} / {game.maxPlayers}
      </p>
      <p>Status: {game.status}</p>

      {/* ✅ WAITING STATE */}
      {game.status === "waiting" && (
        <p className="text-yellow-400 mt-2">
          Waiting for players...
        </p>
      )}

      {/* ✅ PLAY BUTTON */}
      {canPlay && (
        <button
          onClick={() => navigate(`/play/${game.id}`)}
          className="mt-4 px-6 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Play 🎮
        </button>
      )}

      {/* ✅ STARTED BUT USER NOT IN GAME */}
      {game.status === "started" && !isUserInGame && (
        <p className="text-gray-400 mt-2">
          Game already in progress...
        </p>
      )}

      {/* ✅ FINISHED */}
      {game.status === "finished" && (
        <h3 className="mt-4 text-green-400">
          Winner: {game.winner}
        </h3>
      )}

      {/* ✅ ADMIN TEST CONTROLS */}
      {game.status === "started" && user.id === "admin" && (
        <div className="mt-4 space-x-2">
          <button
            onClick={() => handleGameEnd(game.players[0])}
            className="px-4 py-2 bg-yellow-600 rounded"
          >
            End Game (Host wins)
          </button>

          <button
            onClick={() => handleGameEnd(game.players[1])}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            End Game (Guest wins)
          </button>
        </div>
      )}
    </div>
  );
}
