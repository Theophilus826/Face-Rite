import { Link, useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { API } from "../features/Api";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import PostComments from "../pages/PostComments";
import Carousel from "../component/Carousel";
import CardGrid from "../component/CardGrid";
import CoinBalanceCard from "../component/CoinBalanceCard";
import PostGalleryWithUpload from "../component/PostGallery";
import { transferCoins } from "../features/coins/CoinSlice";
import { toast } from "react-toastify";

function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const games = useSelector((state) => state.games.games);
  const user = useSelector((state) => state.auth.user);

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  // ===== Polling for posts =====
  const loadPosts = async () => {
    try {
      const res = await API.get("/post");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Failed to load posts", err);
      toast.error("Failed to load posts");
    }
  };

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // ===== File Selection =====
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  // ===== Create Post =====
  const createPost = async () => {
    if (!newPostText.trim() && !selectedFile)
      return toast.error("Write something or select a file first");

    try {
      setCreatingPost(true);
      let postRes = await API.post("/post", { text: newPostText.trim() });
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
      toast.success("Post created!");
    } catch (err) {
      console.error("Post creation failed", err);
      toast.error("Post creation failed");
    } finally {
      setCreatingPost(false);
    }
  };

  // ===== Utility: get initials =====
  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
  const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* HEADER */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Sparkles className="text-purple-500" size={28} />
          <h1 className="text-xl font-semibold text-gray-800">AI Hub</h1>
        </div>
        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          <CoinBalanceCard />
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">
          Hosted Games 🎮
        </h1>
      </motion.section>

      {/* CREATE POST */}
      {user && (
        <motion.section initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto mb-10">
          <div className="p-6 rounded-2xl bg-white/30 backdrop-blur-xl shadow-lg border border-white/30 space-y-4">
            <div className="flex gap-4 items-start">
              <div
                onClick={() => navigate("/profile")}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold cursor-pointer overflow-hidden"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              <textarea
                placeholder="Share something with the community..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="flex-1 p-4 rounded-xl bg-white/40 border border-white/30 focus:ring-2 focus:ring-white/50 outline-none text-gray-800"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="text-gray-700" />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={createPost}
                disabled={creatingPost}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md"
              >
                {creatingPost ? "Posting..." : "Create Post"}
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {/* POSTS */}
      <motion.section variants={stagger} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">Community Posts</h2>
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet</p>
        ) : (
          posts.map((post) => {
            const postUser = post.user || {};
            return (
              <motion.div
                key={post._id}
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                className="bg-white/30 backdrop-blur-xl border border-white/30 shadow-md rounded-xl p-4 space-y-4"
              >
                {/* POST HEADER */}
                <div onClick={() => navigate("/profile")} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {postUser?.avatar ? (
                      <img src={postUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(postUser?.name || "U")
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{postUser?.name || "User"}</p>
                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* POST CONTENT */}
                <PostGalleryWithUpload
                  postId={post._id}
                  postOwnerId={post.user?._id || post.user}
                  token={user?.token}
                  text={post.text || ""}
                  initialLikes={post.likeCount || 0}
                  initialLoves={post.loveCount || 0}
                  createdAt={post.createdAt}
                  mediaFiles={post.media || []}
                />

                {/* COMMENTS */}
                <PostComments postId={post._id} comments={post.comments || []} user={user} />
              </motion.div>
            );
          })
        )}
      </motion.section>

      {/* GAMES */}
      <motion.section variants={stagger} initial="hidden" animate="visible" className="max-w-6xl mx-auto mt-14 space-y-5">
        {games.length === 0 ? (
          <p className="text-center text-gray-500">No games hosted yet</p>
        ) : (
          games.map((game) => (
            <motion.div
              key={game.id}
              variants={fadeUp}
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-2xl bg-white/30 backdrop-blur-xl shadow-md border border-white/30 flex flex-col sm:flex-row justify-between items-center gap-4"
            >
              <div className="text-gray-800 space-y-1">
                <p>Host: {game.hostId}</p>
                <p>Bet: {game.amount}</p>
                <p>
                  Players: {game.players.length}/{game.maxPlayers}
                </p>
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
      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="mt-16">
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <Carousel />
        </div>
        <div className="text-center py-10 max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-3 text-gray-900">What help do you need?</h1>
          <p className="text-gray-600 mb-6">Please choose from an option below</p>

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
                className="flex items-center justify-center gap-2 bg-white/40 border border-white/30 text-gray-800 py-3 rounded-xl shadow-sm backdrop-blur"
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
          className="max-w-6xl mx-auto mt-8 bg-white/30 backdrop-blur-xl p-6 rounded-2xl shadow-md border border-white/30"
        >
          <CardGrid />
        </motion.div>
      </motion.section>
    </div>
  );
}

export default Home;