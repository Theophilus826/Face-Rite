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
  const [expandedPosts, setExpandedPosts] = useState({});
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);

  const socketRef = useRef(null);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  const loadPosts = async () => {
    try {
      const res = await API.get("/post");
      setPosts(res.data.posts || []);
    } catch (err) {
      toast.error("Failed to load posts");
    }
  };

  useEffect(() => {
    loadPosts();

    const socket = io("https://swordgame-5.onrender.com", {
      auth: { token: user?.token },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("new-comment", (notif) => {
      toast.info(`🔔 ${notif.message}`);
    });

    return () => socket.disconnect();
  }, [user?.token]);

  const toggleComments = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

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
    } catch {
      toast.error("Post creation failed");
    } finally {
      setCreatingPost(false);
    }
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase();

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8">
      {/* HEADER */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Sparkles className="text-purple-500" />
          <h1 className="text-xl font-semibold">AI Hub</h1>
        </div>
        <CoinBalanceCard />
      </motion.section>

      {/* CREATE POST */}
      {user && (
        <div className="max-w-4xl mx-auto mb-10">
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Share something..."
            className="w-full p-3 border rounded"
          />
          <input type="file" onChange={handleFileChange} />
          <button onClick={createPost}>
            {creatingPost ? "Posting..." : "Create Post"}
          </button>
        </div>
      )}

      {/* POSTS */}
      <motion.section variants={stagger} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-6">
        {posts.map((post) => {
          const postUser = post.user || {};
          const isExpanded = expandedPosts[post._id];
          const allComments = post.comments || [];
          const visibleComments = isExpanded ? allComments : allComments.slice(0, 1);

          return (
            <motion.div key={post._id} variants={fadeUp} className="p-4 border rounded-xl space-y-4">
              {/* HEADER */}
              <div onClick={() => navigate("/profile")} className="flex gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  {postUser?.avatar ? (
                    <img src={postUser.avatar} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(postUser?.name || "U")
                  )}
                </div>
                <div>
                  <p>{postUser?.name}</p>
                  <p className="text-xs">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <PostGalleryWithUpload
                postId={post._id}
                text={post.text}
                mediaFiles={post.media || []}
              />

              {/* COMMENTS */}
              <div className="space-y-2">
                {allComments.length > 1 && !isExpanded && (
                  <button onClick={() => toggleComments(post._id)}>
                    View more comments ({allComments.length})
                  </button>
                )}

                <PostComments
                  postId={post._id}
                  comments={visibleComments}
                  user={user}
                  onNewComment={async (newComment) => {
                    setPosts((prev) =>
                      prev.map((p) =>
                        p._id === post._id
                          ? {
                              ...p,
                              comments: [...(p.comments || []), newComment],
                            }
                          : p
                      )
                    );

                    // auto expand
                    setExpandedPosts((prev) => ({
                      ...prev,
                      [post._id]: true,
                    }));
                  }}
                />

                {allComments.length > 1 && isExpanded && (
                  <button onClick={() => toggleComments(post._id)}>
                    Hide comments
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.section>

      {/* SUPPORT */}
      <div className="mt-16">
        <Carousel />
        <CardGrid />
      </div>
    </div>
  );
}

export default Home;