import { Link, useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { API } from "../features/Api";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import PostComments from "../pages/PostComments";
import Carousel from "../component/Carousel";
import CardGrid from "../component/CardGrid";
import CoinBalanceCard from "../component/CoinBalanceCard";
import PostGalleryWithUpload from "../component/PostGallery";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

function Home() {
  const navigate = useNavigate();
  const games = useSelector((state) => state.games.games);
  const user = useSelector((state) => state.auth.user);

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);

  const socketRef = useRef(null);

  // ===== Load Posts =====
  const loadPosts = async () => {
    try {
      const res = await API.get("/post");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posts");
    }
  };

  // ===== Init =====
  useEffect(() => {
    loadPosts();

    if (!user?.token) return;

    const socket = io("https://swordgame-5.onrender.com", {
      auth: { token: user.token },
    });

    socketRef.current = socket;

    socket.on("new-comment", (notif) => {
      toast.info(`🔔 ${notif.message}`);
    });

    return () => socket.disconnect();
  }, [user?.token]);

  // ===== Create Post =====
  const createPost = async () => {
    if (!newPostText.trim() && !selectedFile) {
      return toast.error("Write something or select a file");
    }

    try {
      setCreatingPost(true);

      let res = await API.post("/post", {
        text: newPostText.trim(),
      });

      let post = res.data.post;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await API.post(
          `/post/${post._id}/media`,
          formData
        );

        post = uploadRes.data.post;
      }

      setPosts((prev) => [post, ...prev]);
      setNewPostText("");
      setSelectedFile(null);

      toast.success("Post created!");
    } catch (err) {
      console.error(err);
      toast.error("Post failed");
    } finally {
      setCreatingPost(false);
    }
  };

  // ===== Utils =====
  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen px-4 relative overflow-hidden">
      
      {/* HEADER */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
        <div className="flex justify-center gap-2 mb-4">
          <Sparkles className="text-purple-500" />
          <h1 className="text-xl font-semibold">AI LIVETIME VALUE</h1>
        </div>

        <CoinBalanceCard />

        <h1 className="text-4xl font-bold">Hosted Games 🎮</h1>
      </motion.section>

      {/* CREATE POST */}
      {user && (
        <motion.section className="max-w-4xl mx-auto mb-10">
          <div className="p-6 rounded-2xl bg-white/30 backdrop-blur-xl space-y-4">

            <div className="flex gap-4">
              <div
                onClick={() => navigate("/profile")}
                className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white cursor-pointer"
              >
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full rounded-full" />
                ) : (
                  getInitials(user?.name)
                )}
              </div>

              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Share something..."
                className="flex-1 p-3 rounded-xl"
              />
            </div>

            <div className="flex justify-between items-center">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />

              <button
                onClick={createPost}
                disabled={creatingPost}
                className="bg-purple-500 text-white px-5 py-2 rounded-xl"
              >
                {creatingPost ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* POSTS */}
      <motion.section className="max-w-5xl mx-auto space-y-6">
        {posts.map((post) => {
          const postUser = post.user || {};

          return (
            <motion.div key={post._id} className="p-4 bg-white/30 rounded-xl">

              {/* HEADER */}
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  {postUser?.avatar ? (
                    <img src={postUser.avatar} className="w-full h-full rounded-full" />
                  ) : (
                    getInitials(postUser?.name || "U")
                  )}
                </div>

                <div>
                  <p className="font-semibold">{postUser?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* POST CONTENT */}
              <PostGalleryWithUpload
                postId={post._id}
                postOwnerId={post.user?._id || post.user}
                token={user?.token}
                user={user} // ✅ IMPORTANT FIX
                text={post.text}
                initialLikes={post.likeCount || 0}
                initialLoves={post.loveCount || 0}
                createdAt={post.createdAt}
                mediaFiles={post.media || []}
              />

              {/* COMMENTS */}
              <PostComments
                postId={post._id}
                comments={post.comments || []}
                user={user}
              />
            </motion.div>
          );
        })}
      </motion.section>

      {/* SUPPORT */}
      <div className="mt-16 text-center">
        <Carousel />

        <Link to="/NewFeedback" className="block mt-4 text-blue-500">
          <FaQuestionCircle /> New Feedback
        </Link>

        <Link to="/Feedbacks" className="block mt-2">
          <FaTicketAlt /> My Feedbacks
        </Link>

        <CardGrid />
      </div>
    </div>
  );
}

export default Home;