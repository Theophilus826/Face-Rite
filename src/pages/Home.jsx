import { Link } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import Carousel from "../component/Carousel";
import CardGrid from "../component/CardGrid";
import CoinBalanceCard from "../component/CoinBalanceCard";
import PostGalleryWithUpload from "../component/PostGallery";

function Home() {
  const navigate = useNavigate();

  const games = useSelector((state) => state.games.games);
  const user = useSelector((state) => state.auth.user);

  const [posts, setPosts] = useState([]);

  const loadPosts = async () => {
    try {
      const res = await axios.get("/api/posts");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Failed to load posts", err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8">

      {/* ================= COIN + TITLE ================= */}
      <section className="text-center mb-8">
        <div className="flex justify-center gap-4 mb-4 flex-wrap">
          <CoinBalanceCard />
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Hosted Games 🎮
        </h1>
      </section>

      {/* ================= POSTS ================= */}
      <section className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto mt-10 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          Community Posts
        </h2>

        {posts.length === 0 ? (
          <p className="text-center text-gray-400">No posts yet</p>
        ) : (
          posts.map((post) => (
            <PostGalleryWithUpload
              key={post._id}
              postId={post._id}
              postOwnerId={post.user}
              token={user?.token}
              initialLikes={post.reactions?.likes || 0}
              initialLoves={post.reactions?.loves || 0}
              createdAt={post.createdAt}
              mediaFiles={post.media || []}
            />
          ))
        )}
      </section>

      {/* ================= GAMES ================= */}
      <section className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto mt-12 space-y-4">
        {games.length === 0 ? (
          <p className="text-center text-gray-400">No games hosted yet</p>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className="bg-neutral-900 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
            >
              <div className="text-sm sm:text-base space-y-1">
                <p>Host: {game.hostId}</p>
                <p>Bet: {game.amount}</p>
                <p>
                  Players: {game.players.length}/{game.maxPlayers}
                </p>
                <p>Status: {game.status}</p>
              </div>

              {user && (
                <button
                  onClick={() => navigate(`/play/${game.id}`)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Play 🎮
                </button>
              )}
            </div>
          ))
        )}
      </section>

      {/* ================= CAROUSEL ================= */}
      <section className="mt-14">
        <Carousel />

        <div className="text-center py-8 max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            What help do you need?
          </h1>

          <p className="text-success-600 mb-6">
            Please choose from an option below
          </p>

          <div className="space-y-3">
            <Link
              to="/NewFeedback"
              className="flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:bg-gray-800"
            >
              <FaQuestionCircle />
              Create New Feedback
            </Link>

            <Link
              to="/Feedbacks"
              className="flex items-center justify-center gap-2 bg-gray-200 text-black py-3 rounded-lg hover:bg-gray-300"
            >
              <FaTicketAlt />
              View My Feedbacks
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <CardGrid />
        </div>
      </section>

    </div>
  );
}

export default Home;