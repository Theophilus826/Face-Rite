import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Cropper from "react-easy-crop";
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

  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
};

/* ================= PROFILE HEADER ================= */
function ProfileHeader({ image, isUploading, onUpload }) {
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState(null);

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (_, areaPixels) => {
    setCropArea(areaPixels);
  };

  const handleSave = async () => {
    if (!preview || !cropArea) return;

    const blob = await createCroppedImage(preview, cropArea);
    onUpload(blob);
    setPreview(null);
  };

  const handleCancel = () => setPreview(null);

  return (
    <div className="flex flex-col items-center mb-10">
      {/* Avatar */}
      <img
        src={image || "/default-avatar.png"}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover border border-theme shadow-sm"
      />

      {/* Upload */}
      <label className="mt-3 cursor-pointer text-sm text-blue-600 hover:underline">
        {isUploading ? "Uploading..." : "Change Profile Image"}
        <input
          type="file"
          accept="image/*"
          onChange={handleSelectFile}
          className="hidden"
        />
      </label>

      {/* Cropper */}
      {preview && (
        <div className="mt-4 w-full max-w-md">
          <div className="profile-crop-container">
            <Cropper
              image={preview}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
            <div className="profile-crop-overlay" />
          </div>

          {/* Controls */}
          <div className="profile-crop-controls">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="profile-crop-slider"
            />

            <div className="flex gap-2">
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= POSTS ================= */
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

  const [posts, setPosts] = useState([]);
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!user?._id) return;

    try {
      setIsLoading(true);
      const { data } = await API.get(`/user/${user._id}/posts`);
      setPosts(data?.posts || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const uploadAvatar = async (blob) => {
    if (!user?._id) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      const { data } = await API.post("/upload", formData);
      const url = data?.url;

      if (url) {
        await API.put(`/user/${user._id}/avatar`, { avatar: url });
        setAvatar(url);
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
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
        image={avatar}
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