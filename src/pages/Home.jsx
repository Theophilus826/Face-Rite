import { Link, useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { API } from "../features/Api";

import Carousel from "../component/Carousel";
import CardGrid from "../component/CardGrid";
import CoinBalanceCard from "../component/CoinBalanceCard";
import PostGalleryWithUpload from "../component/PostGallery";

function Home() {
  const navigate = useNavigate();
  const games = useSelector((state) => state.games.games);
  const user = useSelector((state) => state.auth.user);

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);

  // ===== Load posts =====
  const loadPosts = async () => {
    try {
      const res = await API.get("/post");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Failed to load posts", err.response?.data || err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8">

      {/* ================= HEADER ================= */}
      <section className="text-center mb-8">
        <div className="flex justify-center gap-4 mb-4 flex-wrap">
          <CoinBalanceCard />
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Hosted Games 🎮
        </h1>
      </section>

      {/* ================= POSTS ================= */}
      <section className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto mt-6 space-y-6">
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
              postOwnerId={post.user?._id || post.user}
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
          <p className="text-center text-gray-400">
            No games hosted yet
          </p>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className="p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
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
                  className="w-full sm:w-auto px-4 py-2 rounded hover:opacity-80"
                >
                  Play 🎮
                </button>
              )}
            </div>
          ))
        )}
      </section>

      {/* ================= CAROUSEL + SUPPORT ================= */}
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
              className="flex items-center justify-center gap-2 text-white py-3 rounded-lg hover:opacity-80"
            >
              <FaQuestionCircle />
              Create New Feedback
            </Link>

            <Link
              to="/Feedbacks"
              className="flex items-center justify-center gap-2 text-black py-3 rounded-lg hover:opacity-80"
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
