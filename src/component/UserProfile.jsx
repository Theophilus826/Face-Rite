import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { API } from "../features/Api";
import PostGalleryWithUpload from "../component/PostGallery";
import { setUser } from "../features/AuthSlice"; // Redux action to update user

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

      // Crop image to square
      const size = Math.min(img.width, img.height);
      const crop = {
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        width: size,
        height: size,
      };

      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob(async (blob) => {
        await onUpload(blob, src);
      }, "image/jpeg", 0.9);
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

/* ================= POSTS ================= */
function ProfilePosts({ posts, isLoading, user }) {
  if (isLoading)
    return <p className="text-center text-muted">Loading posts...</p>;

  if (!posts.length)
    return <p className="text-center text-muted">No posts yet. Start sharing 🚀</p>;

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
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [posts, setPosts] = useState([]);
  const [preview, setPreview] = useState(null);
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
        // Update Redux & persist to localStorage
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

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  if (!user)
    return (
      <div className="text-center mt-10 text-muted">
        Please log in to view your profile.
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center my-6">
        {user.name}&apos;s Profile
      </h1>

      <ProfileHeader
        image={preview || user.avatar}
        isUploading={isUploading}
        onUpload={uploadAvatar}
      />

      <ProfilePosts posts={posts} isLoading={isLoading} user={user} />
    </div>
  );
}