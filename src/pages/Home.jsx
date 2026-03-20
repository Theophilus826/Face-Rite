import { Link, useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
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
import { io } from "socket.io-client";

function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const games = useSelector((state) => state.games.games);
  const user = useSelector((state) => state.auth.user);

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);

  const socketRef = useRef(null);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  // Load posts
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

    // Initialize socket connection
    const socket = io("http://localhost:5000", {
      auth: { token: user?.token },
      withCredentials: true,
    });
    socketRef.current = socket;

    // Listen for comment notifications
    socket.on("new-comment", (notif) => {
      toast.info(`🔔 ${notif.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

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
        const uploadRes = await API.post(`/post/${finalPost._id}/media`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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

  const handleReaction = async (postId, postOwnerId, type) => {
    if (!user || !postOwnerId || user._id === postOwnerId) return;

    const amount = type === "like" ? LIKE_COST : LOVE_COST;

    try {
      await dispatch(
        transferCoins({
          toUserId: postOwnerId,
          amount,
          description: `${type.toUpperCase()} reaction`,
        })
      ).unwrap();

      const res = await API.post(`/post/${postId}/react`, { type });

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, reactions: { likes: res.data.likeCount, loves: res.data.loveCount } }
            : p
        )
      );
    } catch (err) {
      console.error("Reaction failed", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to react");
    }
  };

  const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase();

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
                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : getInitials(user?.name)}
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
              <motion.div key={post._id} variants={fadeUp} whileHover={{ scale: 1.02 }} className="bg-white/30 backdrop-blur-xl border border-white/30 shadow-md rounded-xl p-4 space-y-4">
                {/* POST HEADER */}
                <div onClick={() => navigate("/profile")} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {postUser?.avatar ? <img src={postUser.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(postUser?.name || "U")}
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
                  initialLikes={post.reactions?.likes || post.likeCount || 0}
                  initialLoves={post.reactions?.loves || post.loveCount || 0}
                  createdAt={post.createdAt}
                  mediaFiles={post.media || []}
                />

                {/* COMMENTS & REPLIES WITH REAL-TIME NOTIFICATIONS */}
                <PostComments
                  postId={post._id}
                  comments={post.comments || []}
                  user={user}
                  onNewComment={async (newComment) => {
                    // Update posts state locally
                    setPosts((prev) =>
                      prev.map((p) => {
                        if (p._id === post._id) {
                          if (newComment.parentId) {
                            return {
                              ...p,
                              comments: p.comments.map((c) =>
                                c._id === newComment.parentId
                                  ? { ...c, replies: [...(c.replies || []), newComment] }
                                  : c
                              ),
                            };
                          }
                          return { ...p, comments: [...(p.comments || []), newComment] };
                        }
                        return p;
                      })
                    );

                    // Notify post owner in real-time via socket
                    if (post.user?._id !== user._id) {
                      try {
                        await API.post(`/notifications`, {
                          toUserId: post.user._id,
                          message: `${user.name} commented on your post.`,
                          postId: post._id,
                        });

                        // Emit socket event to notify the owner
                        socketRef.current.emit("notify-user", {
                          toUserId: post.user._id,
                          message: `${user.name} commented on your post.`,
                        });
                      } catch (err) {
                        console.error("Notification failed", err);
                      }
                    }
                  }}
                />
              </motion.div>
            );
          })
        )}
      </motion.section>

      {/* GAMES & SUPPORT sections remain the same */}
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
      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="mt-16">
        <div className="rounded-2xl overflow-hidden shadow-lg"><Carousel /></div>
        <div className="text-center py-10 max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-3 text-gray-900">What help do you need?</h1>
          <p className="text-gray-600 mb-6">Please choose from an option below</p>

          <div className="space-y-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link to="/NewFeedback" className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl shadow-md">
                <FaQuestionCircle />
                Create New Feedback
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link to="/Feedbacks" className="flex items-center justify-center gap-2 bg-white/40 border border-white/30 text-gray-800 py-3 rounded-xl shadow-sm backdrop-blur">
                <FaTicketAlt />
                View My Feedbacks
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-6xl mx-auto mt-8 bg-white/30 backdrop-blur-xl p-6 rounded-2xl shadow-md border border-white/30">
          <CardGrid />
        </motion.div>
      </motion.section>
    </div>
  );
}

export default Home;