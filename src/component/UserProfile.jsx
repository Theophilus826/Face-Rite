import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../features/Api";
import PostGalleryWithUpload from "../component/PostGallery";
import { setUser } from "../features/AuthSlice"; // Redux action to update user

/* ================= PROFILE HEADER ================= */
function ProfileHeader({ image, isUploading, onUpload, editable }) {
  const DEFAULT_AVATAR = "https://swordgame-5.onrender.com/default-avatar.jpg";

  const handleSelectFile = async (e) => {
    if (!editable) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result;
      const img = new Image();
      img.src = src;
      await new Promise((resolve) => (img.onload = resolve));

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
        crop.height,
      );

      canvas.toBlob(
        async (blob) => {
          await onUpload(blob, src);
        },
        "image/jpeg",
        0.9,
      );
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
      <label
        className={`mt-3 text-sm ${
          editable
            ? "cursor-pointer text-blue-600 hover:underline"
            : "text-gray-400"
        }`}
      >
        {isUploading
          ? "Uploading..."
          : editable
          ? "Change Profile Image"
          : "View-only profile"}
        <input
          type="file"
          accept="image/*"
          disabled={!editable}
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
    return (
      <p className="text-center text-muted">No posts yet. Start sharing 🚀</p>
    );

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
  const { profileUserId } = useParams();

  const [profileUser, setProfileUser] = useState(user || null);
  const [posts, setPosts] = useState([]);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile = !profileUserId || profileUserId === user?._id;

  /* ================= LOAD PROFILE AND POSTS ================= */
  const loadProfile = useCallback(async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      const targetUserId = profileUserId || user._id;

      const [{ data: userData }, { data: postsData }] = await Promise.all([
        API.get(`/users/${targetUserId}`),
        API.get(`/users/${targetUserId}/posts`),
      ]);

      setProfileUser(userData?.user || null);
      setPosts(postsData?.posts || []);
    } catch (err) {
      console.error("Failed to load profile:", err);
      toast.error("Unable to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId, user]);

  /* ================= UPLOAD AVATAR ================= */
  const uploadAvatar = async (blob, previewURL) => {
    if (!isOwnProfile || !user?._id || !user?.token) return;

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
        setProfileUser((prev) => ({
          ...prev,
          avatar: data.avatar,
        }));
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
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const token = user?.token || localStorage.getItem("token");
    if (!token) {
      console.warn("No auth token available for SSE");
      return;
    }

    const base = API.defaults.baseURL?.replace(/\/$/, "");
    const url = `${base}/chat/notifications/stream?token=${encodeURIComponent(token)}`;

    let es;

    try {
      es = new EventSource(url);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          if (data.type === "status") {
            const { userId, status } = data;

            const targetId = profileUserId || user?._id;
            if (String(userId) === String(targetId)) {
              setProfileUser((prev) => ({
                ...prev,
                status,
                ...(status === "offline" ? { lastActive: Date.now() } : {}),
              }));
            }
          }
        } catch (err) {
          console.error("PROFILE SSE PARSE ERROR:", err);
        }
      };

      es.onerror = (err) => {
        console.error("PROFILE SSE ERROR:", err);
        es.close();
      };
    } catch (err) {
      console.error("Failed to open profile notifications SSE:", err);
    }

    return () => {
      try {
        es?.close();
      } catch {}
    };
  }, [profileUserId, user?._id, user?.token]);

  if (!user)
    return (
      <div className="text-center mt-10 text-muted">
        Please log in to view profiles.
      </div>
    );

  if (isLoading)
    return (
      <div className="text-center mt-10 text-muted">Loading profile...</div>
    );

  if (!profileUser)
    return <div className="text-center mt-10 text-muted">User not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center my-6">
        {profileUser.name}&apos;s Profile
      </h1>

      <ProfileHeader
        image={preview || profileUser.avatar}
        isUploading={isUploading}
        onUpload={uploadAvatar}
        editable={isOwnProfile}
      />

      <div className="mb-6 text-center text-sm text-gray-300">
        Status: {profileUser.status || "offline"}
        {profileUser.lastActive && (
          <span>
            {" • Last active "}
            {new Date(profileUser.lastActive).toLocaleString()}
          </span>
        )}
        <p className="text-xs text-gray-500">
          {profileUser?.user?.phone || "No phone"}
        </p>
      </div>

      <ProfilePosts posts={posts} isLoading={isLoading} user={profileUser} />
    </div>
  );
}
