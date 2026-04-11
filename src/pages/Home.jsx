import { Link, useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaTicketAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { API } from "../features/Api";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import PostComments from "../pages/PostComments";
import Carousel from "../component/Carousel";
import CardGrid from "../component/CardGrid";
import CoinBalanceCard from "../component/CoinBalanceCard";
import PostGalleryWithUpload from "../component/PostGallery";
import { toast } from "react-toastify";

function Home() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [creatingPost, setCreatingPost] = useState(false);

  // ================= LOAD POSTS =================
  const loadPosts = async () => {
    try {
      const res = await API.get("/post");
      setPosts(res.data.posts || []);
    } catch {
      toast.error("Failed to load posts");
    }
  };

  // ================= INIT =================
  useEffect(() => {
    loadPosts();

    if (!user?.token) return;

    let interval;

    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        res.data.notifications?.forEach((n) => {
          toast.info(`🔔 ${n.message}`);
        });
      } catch (err) {
        console.error("Notification error:", err);
      }
    };

    fetchNotifications();
    interval = setInterval(fetchNotifications, 15000);

    return () => clearInterval(interval);
  }, [user?.token]);

  // ================= CREATE POST =================
  const createPost = async () => {
    if (!newPostText.trim() && selectedFiles.length === 0) {
      return toast.error("Write something or select a file");
    }

    if (!user?.token) {
      return toast.error("You must be logged in");
    }

    try {
      setCreatingPost(true);

      let post;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("text", newPostText.trim());
        selectedFiles.forEach((f) => formData.append("files", f));

        const res = await API.post("/post", formData, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        post = res.data.post;
      } else {
        const res = await API.post(
          "/post",
          { text: newPostText.trim() },
          { headers: { Authorization: `Bearer ${user.token}` } },
        );

        post = res.data.post;
      }

      setPosts((prev) => [post, ...prev]);
      setNewPostText("");
      setSelectedFiles([]);
      toast.success("Post created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Post failed");
    } finally {
      setCreatingPost(false);
    }
  };

  // ================= UTILS =================
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  // ================= CLEAN FILE URLS =================
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => URL.revokeObjectURL(file));
    };
  }, [selectedFiles]);

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
      {/* HEADER */}
      <motion.section className="text-center mb-10">
        <div className="flex justify-center items-center gap-2 mb-3">
          <Sparkles className="text-purple-500 w-6 h-6" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-teal-300 to-blue-500 text-transparent bg-clip-text">
            AI LIFETIME VALUE
          </h1>
        </div>

        <CoinBalanceCard />

        <h2 className="text-2xl sm:text-3xl font-bold mt-4">Hosted Games 🎮</h2>
      </motion.section>

      {/* CREATE POST */}
      {user && (
        <section className="max-w-4xl mx-auto mb-10">
          <div className="p-4 sm:p-6 rounded-2xl bg-white/30 backdrop-blur-xl space-y-4">
            {/* USER + INPUT */}
            <div className="flex gap-3">
              <div
                onClick={() => navigate("/profile")}
                className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white overflow-hidden cursor-pointer"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(user?.name)
                )}
              </div>

              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Share something..."
                className="flex-1 p-3 rounded-xl resize-none"
              />
            </div>

            {/* FILE PREVIEW */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedFiles.map((file, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(file)}
                    className="w-full h-28 sm:h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <input
                type="file"
                multiple
                className="w-full sm:w-auto"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setSelectedFiles((prev) => [...prev, ...files]);
                  e.target.value = null;
                }}
              />

              <button
                onClick={createPost}
                disabled={creatingPost}
                className="bg-purple-500 text-white px-5 py-2 rounded-xl w-full sm:w-auto"
              >
                {creatingPost ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* POSTS */}
      <section className="max-w-5xl mx-auto space-y-6">
        {posts.map((post) => {
          const postUser = post.user || {};

          return (
            <div key={post._id} className="p-4 bg-white/30 rounded-xl">
              {/* USER HEADER */}
              <div className="flex gap-3 items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white overflow-hidden">
                  {postUser?.avatar ? (
                    <img
                      src={postUser.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(postUser?.name || "U")
                  )}
                </div>

                <p className="font-semibold">{postUser?.name}</p>
              </div>

              {/* MEDIA */}
              <PostGalleryWithUpload
                postId={post._id}
                postOwnerId={post.user?._id}
                token={user?.token}
                user={user}
                text={post.text}
                createdAt={post.createdAt}
                mediaFiles={post.media || []}
                initialLikes={post.likeCount || 0}
                initialLoves={post.loveCount || 0}
              />

              {/* COMMENTS */}
              <PostComments
                postId={post._id}
                comments={post.comments || []}
                user={user}
                onNewComment={(comment) => {
                  setPosts((prev) =>
                    prev.map((p) =>
                      p._id === post._id
                        ? { ...p, comments: [...(p.comments || []), comment] }
                        : p,
                    ),
                  );
                }}
              />
            </div>
          );
        })}
      </section>

      {/* SUPPORT */}
      <div className="mt-12 text-center">
        <Carousel />

        <Link
          to="/NewFeedback"
          className="flex justify-center gap-2 mt-4 text-blue-500"
        >
          <FaQuestionCircle /> New Feedback
        </Link>

        <Link to="/Feedbacks" className="flex justify-center gap-2 mt-2">
          <FaTicketAlt /> My Feedbacks
        </Link>

        <div className="mt-6">
          <CardGrid />
        </div>
      </div>
    </div>
  );
}

export default Home;
