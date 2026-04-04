import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { API } from "../features/Api";
import PostGalleryWithUpload from "../component/PostGallery";

/* ================= IMAGE UTILITY ================= */
const createCroppedImage = async (src, crop) => {
  const image = new Image();
  image.src = src;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
};

/* ================= PROFILE HEADER ================= */
function ProfileHeader({ image, isUploading, onUpload }) {
  const DEFAULT_AVATAR =
    "https://swordgame-5.onrender.com/default-avatar.jpg";

  const handleSelectFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result;

      const img = new Image();
      img.src = src;
      await new Promise((resolve) => (img.onload = resolve));

      // Center square crop
      const size = Math.min(img.width, img.height);
      const crop = {
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        width: size,
        height: size,
      };

      const blob = await createCroppedImage(src, crop);

      // send blob + preview URL
      onUpload(blob, src);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center mb-10 relative">
      <img
        src={image || DEFAULT_AVATAR}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover border border-theme shadow-sm"
      />
      <label className="mt-3 cursor-pointer text-sm text-blue-600 hover:underline">
        {isUploading ? "Uploading..." : "Change Profile Image"}
        <input
          type="file"
          accept="image/*"
          onChange={handleSelectFile}
          className="hidden"
        />
      </label>
    </div>
  );
}

/* ================= PROFILE POSTS ================= */
function ProfilePosts({ posts, isLoading, user, onSelectMedia }) {
  if (isLoading) {
    return <p className="text-center text-muted">Loading posts...</p>;
  }

  if (!posts.length) {
    return (
      <p className="text-center text-muted">
        No posts yet. Start sharing 🚀
      </p>
    );
  }

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
            onSelectMedia={onSelectMedia}
          />
        </div>
      ))}
    </>
  );
}

/* ================= MAIN PROFILE ================= */
export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  const CLOUD_DEFAULT_AVATAR =
    "https://swordgame-5.onrender.com/default-avatar.jpg";

  const [posts, setPosts] = useState([]);
  const [avatar, setAvatar] = useState(user?.avatar || CLOUD_DEFAULT_AVATAR);
  const [preview, setPreview] = useState(null); // for live preview
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ================= LOAD POSTS ================= */
  const loadPosts = useCallback(async () => {
    if (!user?._id || !user?.token) return;

    try {
      setIsLoading(true);
      const { data } = await API.get(`/users/${user._id}/posts`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setPosts(data?.posts || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /* ================= SOCKET ================= */
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
  }, [user?.token, loadPosts]);

  /* ================= UPLOAD AVATAR ================= */
  const uploadAvatar = async (blob, previewURL) => {
    if (!user?._id || !user?.token) return;

    setPreview(previewURL); // show preview immediately

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      const { data } = await API.put(
        `/users/${user._id}/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`, // Axios sets Content-Type automatically
          },
        }
      );

      if (data?.avatar) {
        setAvatar(data.avatar); // update actual avatar from server
        setPreview(null);
        toast.success("Avatar updated successfully!");
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Failed to update avatar");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center mt-10 text-muted">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center my-6">
        {user.name}&apos;s Profile
      </h1>

      <ProfileHeader
        image={preview || avatar} // show preview first
        isUploading={isUploading}
        onUpload={uploadAvatar}
      />

      <ProfilePosts
        posts={posts}
        isLoading={isLoading}
        user={user}
        onSelectMedia={() => {}}
      />
    </div>
  );
}