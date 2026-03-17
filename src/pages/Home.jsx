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

  // ===== File selection =====
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  // ===== Create post =====
  const createPost = async () => {
    if (!newPostText.trim() && !selectedFile) {
      return alert("Write something or select a file first");
    }

    try {
      setCreatingPost(true);

      // 1. Create text post
      const postRes = await API.post("/post", {
        text: newPostText.trim(),
      });

      let finalPost = postRes.data.post;

      // 2. Upload media if exists
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await API.post(
          `/post/${finalPost._id}/media`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        finalPost = uploadRes.data.post;
      }

      // 3. Update UI instantly
      setPosts((prev) => [finalPost, ...prev]);
      setNewPostText("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to create post", err.response?.data || err);
      alert(err.response?.data?.message || "Post creation failed");
    } finally {
      setCreatingPost(false);
    }
  };

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

      {/* ================= CREATE POST ================= */}
      {user && (
        <section className="max-w-4xl lg:max-w-5xl mx-auto mb-8">
          <div className="bg-neutral-900 p-4 rounded space-y-3">
            <textarea
              placeholder="Share something with the community..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="w-full p-3 rounded bg-neutral-800 text-white"
            />

            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />

            <button
              onClick={createPost}
              disabled={creatingPost}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              {creatingPost ? "Posting..." : "Create Post"}
            </button>
          </div>
        </section>
      )}

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
              text={post.text || ""}
              initialLikes={
                post.reactions?.likes || post.likeCount || 0
              }
              initialLoves={
                post.reactions?.loves || post.loveCount || 0
              }
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
