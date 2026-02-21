import { Link } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Carousel from "../component/Carousel";
import CardGrid from "../component/CardGrid";
import CoinHistory from "../pages/CoinHistory";
import CoinBalanceCard from "../component/CoinBalanceCard";

function Home() {
  const navigate = useNavigate();
  const games = useSelector((state) => state.games.games);
  const user = useSelector((state) => state.auth.user);

  return (
    <>
      <section className="text-center mb-6">
        <div className="flex justify-center gap-4 mb-4">
          <CoinHistory />
          <CoinBalanceCard />
        </div>

        <h1 className="text-3xl font-bold mb-2">Hosted Games 🎮</h1>
      </section>

      <section className="max-w-4xl mx-auto mt-10 space-y-6">
        {games.length === 0 ? (
          <p className="text-center text-gray-400">No games hosted yet</p>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className="bg-neutral-900 p-4 rounded flex justify-between items-center"
            >
              <div>
                <p>Host: {game.hostId}</p>
                <p>Bet: {game.amount}</p>
                <p>Players: {game.players.length}/{game.maxPlayers}</p>
                <p>Status: {game.status}</p>
              </div>

              <div>
                {user && (
                  <button
                    onClick={() => navigate(`/play/${game.id}`)}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
                  >
                    Play 🎮
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <Carousel/>
         <div className="text-center mb-6 gap-3 py-5">
      <h1 className="text-3xl font-bold mb-2">
          What help do you need?
        </h1>

        <p className="text-success-600">
          Please choose from an option below
        </p>

        <Link
          to="/NewFeedback"
          className="flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg mb-4 hover:bg-gray-800 transition"
        >
          <FaQuestionCircle />
          Create New Feedback
        </Link>

        <Link
          to="/Feedbacks"
          className="flex items-center justify-center gap-2 bg-gray-200 text-black py-3 rounded-lg hover:bg-gray-300 transition"
        >
          <FaTicketAlt />
          View My Feedbacks
        </Link>


    </div>
        <CardGrid />
      </section>
    </>
  );
  
}

export default Home;
