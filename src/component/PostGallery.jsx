import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { transferCoins } from "../features/coins/CoinSlice";
import { API } from "../features/Api";

export default function PostGalleryWithUpload({
  postId,
  postOwnerId,
  token,
  user,
  comments = [],
  text = "",
  initialLikes = 0,
  initialLoves = 0,
  createdAt,
  mediaFiles: initialMediaFiles = [],
}) {
  const dispatch = useDispatch();

  // ===== States =====
  const [mediaFiles, setMediaFiles] = useState(initialMediaFiles);
  const [postText, setPostText] = useState(text);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loveCount, setLoveCount] = useState(initialLoves);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [animateLike, setAnimateLike] = useState(false);
  const [animateLove, setAnimateLove] = useState(false);

  const LIKE_COST = 50;
  const LOVE_COST = 100;
  const isOwner = user?._id === postOwnerId || user?.id === postOwnerId;

  // ===== Polling to auto-refresh post every 5 seconds =====
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/post/${postId}`);
        if (res.data?.post) {
          const p = res.data.post;
          setMediaFiles(p.media || []);
          setPostText(p.text || "");
          setLikeCount(p.likeCount || 0);
          setLoveCount(p.loveCount || 0);
        }
      } catch (err) {
        console.error("Polling fetch failed:", err.response?.data || err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [postId]);

  // ===== File Upload =====
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];
    const filtered = selectedFiles.filter((f) => allowed.includes(f.type));
    if (filtered.length !== selectedFiles.length)
      alert("Some files were skipped due to invalid type");
    setFiles(filtered);
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Select files first!");
    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    try {
      setUploading(true);
      // Cloudinary upload endpoint (backend handles it)
      const res = await API.post(`/post/${postId}/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.post?.media) setMediaFiles(res.data.post.media);
      if (res.data.post?.text) setPostText(res.data.post.text);
      setFiles([]);
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ===== Reactions =====
  const handleReaction = async (type) => {
    if (!postOwnerId || token?.userId === postOwnerId) return;

    try {
      await dispatch(
        transferCoins({
          toUserId: postOwnerId,
          coins: type === "like" ? LIKE_COST : LOVE_COST,
          description: `${type.toUpperCase()} reaction`,
        })
      ).unwrap();

      const res = await API.post(`/post/${postId}/react`, { type });
      setLikeCount(res.data.likeCount);
      setLoveCount(res.data.loveCount);

      if (type === "like") {
        setAnimateLike(true);
        setTimeout(() => setAnimateLike(false), 500);
      } else {
        setAnimateLove(true);
        setTimeout(() => setAnimateLove(false), 500);
      }
    } catch (err) {
      console.error("Reaction failed:", err.response?.data || err);
    }
  };

  // ===== Media Preview =====
  const nextMedia = () =>
    setPreviewIndex((prev) => (prev + 1) % mediaFiles.length);
  const prevMedia = () =>
    setPreviewIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  return (
    <div className="mb-6 p-5 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg text-gray-900">
      {createdAt && (
        <p className="text-gray-600 text-sm mb-2">{formatDate(createdAt)}</p>
      )}

      {postText && (
        <p className="mb-3 whitespace-pre-wrap text-gray-800">{postText}</p>
      )}

      {/* Upload Section */}
      {token && isOwner && (
        <div className="mb-3 flex gap-2">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="text-gray-700"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="px-3 py-1 rounded-lg bg-green-500 text-white"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {/* Media Gallery */}
      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          {mediaFiles.map((media, i) => (
            <div
              key={i}
              className="w-full overflow-hidden rounded-xl cursor-pointer"
              onClick={() => setPreviewIndex(i)}
            >
              {media.type === "video" ? (
                <video
                  src={media.url}
                  className="w-full h-auto max-h-[500px] object-cover rounded-xl"
                  controls
                  autoPlay
                  muted
                  loop
                  preload="metadata"
                />
              ) : (
                <img
                  src={media.url}
                  alt={postText || "Post media"}
                  loading="lazy"
                  className="w-full h-auto max-h-[500px] object-cover rounded-xl"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Preview */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={(e) =>
            e.target === e.currentTarget && setPreviewIndex(null)
          }
        >
          {mediaFiles[previewIndex].type === "video" ? (
            <video
              src={mediaFiles[previewIndex].url}
              controls
              autoPlay
              muted
              loop
              className="max-h-full max-w-full"
            />
          ) : (
            <img
              src={mediaFiles[previewIndex].url}
              className="max-h-full max-w-full"
              alt={postText || "Post media"}
            />
          )}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-6 mt-5">
        <div className="relative">
          <button
            onClick={() => handleReaction("like")}
            className={`px-4 py-2 rounded-xl text-white bg-blue-500 transition-all duration-300 ${
              animateLike ? "scale-125 shadow-lg" : "scale-100"
            }`}
          >
            👍 {likeCount}
          </button>
          {animateLike && (
            <span className="absolute left-1/2 -translate-x-1/2 -top-6 text-xl animate-bounce">
              👍
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => handleReaction("love")}
            className={`px-4 py-2 rounded-xl text-white bg-pink-500 transition-all duration-300 ${
              animateLove ? "scale-125 shadow-lg" : "scale-100"
            }`}
          >
            ❤️ {loveCount}
          </button>
          {animateLove && (
            <span className="absolute left-1/2 -translate-x-1/2 -top-6 text-xl animate-bounce">
              ❤️
            </span>
          )}
        </div>
      </div>
    </div>
  );
}