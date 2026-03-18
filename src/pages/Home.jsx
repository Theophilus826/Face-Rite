import { Link, useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { API } from "../features/Api";
import { motion } from "framer-motion";

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

  const loadPosts = async () => {
    try {
      const res = await API.get("/post");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Failed to load posts", err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const createPost = async () => {
    if (!newPostText.trim() && !selectedFile) {
      return alert("Write something or select a file first");
    }

    try {
      setCreatingPost(true);

      const postRes = await API.post("/post", {
        text: newPostText.trim(),
      });

      let finalPost = postRes.data.post;

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

      setPosts((prev) => [finalPost, ...prev]);
      setNewPostText("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Post failed", err);
      alert("Post creation failed");
    } finally {
      setCreatingPost(false);
    }
  };

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-gray-100 to-gray-200">

      {/* HEADER */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-center mb-12"
      >
        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          <CoinBalanceCard />
        </div>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-500 bg-clip-text text-transparent">
          Hosted Games 🎮
        </h1>
      </motion.section>

      {/* CREATE POST */}
      {user && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl mx-auto mb-10"
        >
          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-lg shadow-lg border border-white/40 space-y-4">

            <textarea
              placeholder="Share something with the community..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/80 border border-gray-200 focus:ring-2 focus:ring-gray-300 outline-none"
            />

            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={createPost}
              disabled={creatingPost}
              className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-gray-700 to-gray-500 shadow-md"
            >
              {creatingPost ? "Posting..." : "Create Post"}
            </motion.button>
          </div>
        </motion.section>
      )}

      {/* POSTS */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-gray-700">
          Community Posts
        </h2>

        {posts.length === 0 ? (
          <p className="text-center text-gray-400">No posts yet</p>
        ) : (
          posts.map((post) => (
            <motion.div
              key={post._id}
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-md rounded-xl p-4"
            >
              <PostGalleryWithUpload
                postId={post._id}
                postOwnerId={post.user?._id || post.user}
                token={user?.token}
                text={post.text || ""}
                initialLikes={post.reactions?.likes || 0}
                initialLoves={post.reactions?.loves || 0}
                createdAt={post.createdAt}
                mediaFiles={post.media || []}
              />
            </motion.div>
          ))
        )}
      </motion.section>

      {/* GAMES */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto mt-14 space-y-5"
      >
        {games.length === 0 ? (
          <p className="text-center text-gray-400">No games hosted yet</p>
        ) : (
          games.map((game) => (
            <motion.div
              key={game.id}
              variants={fadeUp}
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-2xl bg-white/70 backdrop-blur-lg shadow-md border border-white/40 flex flex-col sm:flex-row justify-between items-center gap-4"
            >
              <div className="text-gray-700 space-y-1">
                <p>Host: {game.hostId}</p>
                <p>Bet: {game.amount}</p>
                <p>Players: {game.players.length}/{game.maxPlayers}</p>
                <p>Status: {game.status}</p>
              </div>

              {user && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/play/${game.id}`)}
                  className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md"
                >
                  Play 🎮
                </motion.button>
              )}
            </motion.div>
          ))
        )}
      </motion.section>

      {/* SUPPORT */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-16"
      >
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <Carousel />
        </div>

        <div className="text-center py-10 max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-3 text-gray-800">
            What help do you need?
          </h1>

          <p className="text-gray-500 mb-6">
            Please choose from an option below
          </p>

          <div className="space-y-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/NewFeedback"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl shadow-md"
              >
                <FaQuestionCircle />
                Create New Feedback
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/Feedbacks"
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl shadow-sm"
              >
                <FaTicketAlt />
                View My Feedbacks
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-6xl mx-auto mt-8 bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-md"
        >
          <CardGrid />
        </motion.div>
      </motion.section>
    </div>
  );
}

export default Home;
