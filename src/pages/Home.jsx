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


function Home() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [creatingPost, setCreatingPost] = useState(false);

  // ===== Load Posts =====
  const loadPosts = async () => {
    try {
      const res = await API.get("/post");
      setPosts(res.data.posts || []);
    } catch {
      toast.error("Failed to load posts");
    }
  };

  // ===== Init =====
  useEffect(() => {
  loadPosts();

  if (!user?.token) return;

  // ===== Poll for new notifications every 15 seconds =====
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Assume API returns array of notifications like: [{ id, message }]
      res.data.notifications?.forEach((notif) => {
        toast.info(`🔔 ${notif.message}`);
      });
    } catch (err) {
      console.error("Failed to fetch notifications:", err.response || err);
    }
  };

  // Fetch immediately and then every 15s
  fetchNotifications();
  const interval = setInterval(fetchNotifications, 15000);

  return () => clearInterval(interval);
}, [user?.token]);

  // ===== Create Post =====
  const createPost = async () => {
  // 1️⃣ Validation
  if (!newPostText.trim() && selectedFiles.length === 0) {
    return toast.error("Write something or select a file");
  }

  if (!user?.token) {
    return toast.error("You must be logged in to post");
  }

  try {
    setCreatingPost(true);

    let post = null;

    // 2️⃣ Handle files with FormData if any, else send JSON
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      formData.append("text", newPostText.trim());
      selectedFiles.forEach((file) => formData.append("files", file));

      const uploadRes = await API.post(`/post`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      post = uploadRes.data.post;
    } else {
      // Only text, JSON
      const res = await API.post(
        `/post`,
        { text: newPostText.trim() },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      post = res.data.post;
    }

    // 3️⃣ Update state
    setPosts((prev) => [post, ...prev]);
    setNewPostText("");
    setSelectedFiles([]);
    toast.success("Post created!");
  } catch (err) {
    console.error("Post creation error:", err.response || err);
    toast.error(err.response?.data?.message || "Post failed");
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

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
      {/* HEADER */}
      <motion.section className="text-center mb-8 sm:mb-12">
        <div className="flex justify-center items-center gap-2 mb-3 sm:mb-4">
          <Sparkles className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6" />
          <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-teal-300 to-blue-500 text-transparent bg-clip-text">
            AI LIFETIME VALUE
          </h1>
        </div>

        <CoinBalanceCard />

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-4">
          Hosted Games 🎮
        </h2>
      </motion.section>

      {/* CREATE POST */}
      {user && (
        <section className="max-w-3xl md:max-w-4xl mx-auto mb-8 sm:mb-10">
          <div className="p-4 sm:p-6 rounded-2xl bg-white/30 backdrop-blur-xl space-y-4">
            {/* TOP */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Avatar */}
              <div
                onClick={() => navigate("/profile")}
                className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-purple-500 flex items-center justify-center text-white cursor-pointer overflow-hidden"
              >
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </div>

              {/* Input */}
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Share something..."
                className="w-full sm:flex-1 p-3 rounded-xl text-sm sm:text-base resize-none"
              />
            </div>

            {/* Preview selected files */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-24 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-2">
              <input
                type="file"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                className="text-sm"
                multiple
              />

              <button
                onClick={createPost}
                disabled={creatingPost}
                className="w-full sm:w-auto bg-purple-500 text-white px-5 py-2 rounded-xl"
              >
                {creatingPost ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* POSTS */}
      <section className="max-w-3xl sm:max-w-4xl lg:max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {posts.map((post) => {
          const postUser = post.user || {};

          return (
            <div key={post._id} className="p-3 sm:p-4 bg-white/30 rounded-xl break-words">
              {/* HEADER */}
              <div className="flex gap-3 items-center mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-purple-500 flex items-center justify-center text-white overflow-hidden">
                  {postUser?.avatar ? (
                    <img src={postUser.avatar} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(postUser?.name || "U")
                  )}
                </div>

                <div className="text-sm sm:text-base">
                  <p className="font-semibold">{postUser?.name}</p>
                </div>
              </div>

              {/* CONTENT */}
              <PostGalleryWithUpload
                postId={post._id}
                postOwnerId={post.user?._id || post.user?._id?.toString()}
                token={user?.token}
                user={user}
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
                onNewComment={(newComment) => {
                  setPosts((prevPosts) =>
                    prevPosts.map((p) =>
                      p._id === post._id
                        ? { ...p, comments: [...(p.comments || []), newComment] }
                        : p
                    )
                  );
                }}
              />
            </div>
          );
        })}
      </section>

      {/* SUPPORT */}
      <div className="mt-12 sm:mt-16 text-center px-2">
        <Carousel />

        <Link
          to="/NewFeedback"
          className="flex justify-center items-center gap-2 mt-4 text-blue-500 text-sm sm:text-base"
        >
          <FaQuestionCircle /> New Feedback
        </Link>

        <Link
          to="/Feedbacks"
          className="flex justify-center items-center gap-2 mt-2 text-sm sm:text-base"
        >
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