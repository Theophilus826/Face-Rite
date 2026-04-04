import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { API } from "../features/Api";
import PostGalleryWithUpload from "../component/PostGallery";
import { setUser } from "../features/AuthSlice";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

/* ================= PROFILE HEADER ================= */
function ProfileHeader({ image, isUploading, onUpload }) {
  const DEFAULT_AVATAR = "https://swordgame-5.onrender.com/default-avatar.jpg";

  const handleSelectFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result;
      const img = new Image();
      img.src = src;
      await new Promise((resolve) => (img.onload = resolve));

      const size = Math.min(img.width, img.height);
      const crop = { x: (img.width - size) / 2, y: (img.height - size) / 2, width: size, height: size };
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

      canvas.toBlob(async (blob) => await onUpload(blob, src), "image/jpeg", 0.9);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center mb-10">
      <img
        src={image || DEFAULT_AVATAR}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover border border-theme shadow-sm"
      />
      <label className="mt-3 cursor-pointer text-sm text-blue-600 hover:underline">
        {isUploading ? "Uploading..." : "Change Profile Image"}
        <input type="file" accept="image/*" onChange={handleSelectFile} className="hidden" />
      </label>
    </div>
  );
}

/* ================= POSTS ================= */
function ProfilePosts({ posts, isLoading, user }) {
  if (isLoading) return <p className="text-center text-muted">Loading posts...</p>;
  if (!posts.length) return <p className="text-center text-muted">No posts yet. Start sharing 🚀</p>;

  return (
    <>
      {posts.map((post) => (
        <div key={post._id} className="mb-6">
          <PostGalleryWithUpload
            postId={post._id}
            postOwnerId={post.user?._id || post.user}
            token={user?.token}
            text={post.text || ""}
            initialLikes={post.likeCount || 0}
            initialLoves={post.loveCount || 0}
            createdAt={post.createdAt}
            mediaFiles={post.media || []}
            onSelectMedia={() => {}}
          />
        </div>
      ))}
    </>
  );
}

/* ================= MAIN PROFILE ================= */
export default function Profile() {
  const { profileUserId } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [posts, setPosts] = useState([]);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [socket, setSocket] = useState(null);

  /* ================= LOAD POSTS ================= */
  const loadPosts = useCallback(async () => {
    if (!profileUserId || !user?.token) return;

    try {
      setIsLoading(true);
      const { data } = await API.get(`/users/${profileUserId}/posts`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setPosts(data?.posts || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId, user]);

  /* ================= UPLOAD AVATAR ================= */
  const uploadAvatar = async (blob, previewURL) => {
    if (!user?._id || !user?.token) return;

    setPreview(previewURL);

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      const { data } = await API.put(`/users/${user._id}/avatar`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (data?.avatar) {
        dispatch(setUser({ avatar: data.avatar }));
        toast.success("Avatar updated successfully!");
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Failed to update avatar");
    } finally {
      setIsUploading(false);
      setPreview(null);
    }
  };

  /* ================= CHAT LOGIC ================= */
  useEffect(() => {
    if (!user) return;
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || "https://face-rite.onrender.com", {
      path: "/socket.io",
      auth: { token: user.token },
    });
    setSocket(newSocket);

    // Load chat history
    const loadMessages = async () => {
      try {
        const { data } = await API.get(`/users/${user._id}/${profileUserId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to load chat:", err);
      }
    };
    loadMessages();

    // Receive incoming messages
    newSocket.on("chat:receive", (msg) => {
      if (msg.fromUser === profileUserId || msg.toUser === profileUserId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => newSocket.disconnect();
  }, [user, profileUserId]);

  const sendMessage = () => {
    if (!chatText.trim()) return;
    socket.emit("chat:send", { toUserId: profileUserId, text: chatText });
    setChatText("");
  };

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  if (!user)
    return (
      <div className="text-center mt-10 text-muted">Please log in to view this profile.</div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center my-6">{user.name}&apos;s Profile</h1>

      <ProfileHeader
        image={preview || user.avatar}
        isUploading={isUploading}
        onUpload={uploadAvatar}
      />

      <ProfilePosts posts={posts} isLoading={isLoading} user={user} />

      {/* ================= CHAT UI ================= */}
      <div className="mt-8 border-t pt-4">
        <h2 className="text-xl font-semibold mb-2">Chat with {profileUserId}</h2>
        <div className="h-64 overflow-y-auto border rounded p-2 mb-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-1 p-1 rounded ${
                msg.fromUser === user._id ? "bg-blue-200 text-right" : "bg-gray-200 text-left"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded p-2"
            placeholder="Type a message..."
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}