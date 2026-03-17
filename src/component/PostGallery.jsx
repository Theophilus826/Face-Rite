import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { transferCoins } from "../features/coins/CoinSlice";
import { API } from "../features/Api";

export default function PostGalleryWithUpload({
  postId,
  postOwnerId,
  token,
  text = "",
  initialLikes = 0,
  initialLoves = 0,
  createdAt,
  mediaFiles: initialMediaFiles = [],
}) {
  const dispatch = useDispatch();

  // ===== State =====
  const [mediaFiles, setMediaFiles] = useState(initialMediaFiles);
  const [postText, setPostText] = useState(text);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loveCount, setLoveCount] = useState(initialLoves);
  const [previewIndex, setPreviewIndex] = useState(null);
  const swipeStartX = useRef(null);

  const LIKE_COST = 50;
  const LOVE_COST = 100;
  const isOwner = token?.userId === postOwnerId;

  // Sync postText if prop changes (e.g., on re-fetch)
  useEffect(() => {
  console.log("Displaying post text:", postText);
}, [postText]);

  // ===== File Upload =====
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert("Select a file first!");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await API.post(`/post/${postId}/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update media files and post text from backend
      if (res.data.post?.media) setMediaFiles(res.data.post.media);
      if (res.data.post?.text) setPostText(res.data.post.text);

      setFile(null);
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ===== Reactions =====
  const handleReaction = async (type) => {
    const cost = type === "like" ? LIKE_COST : LOVE_COST;
    try {
      await dispatch(
        transferCoins({
          toUserId: postOwnerId,
          coins: cost,
          description: `${type.toUpperCase()} reaction`,
        })
      ).unwrap();

      const res = await API.post(`/post/${postId}/react`, { type });
      setLikeCount(res.data.likeCount);
      setLoveCount(res.data.loveCount); // ✅ fixed
    } catch (err) {
      console.error("Reaction failed:", err.response?.data || err);
    }
  };

  // ===== Gallery Navigation =====
  const nextMedia = () =>
    setPreviewIndex((prev) => (prev + 1) % mediaFiles.length);
  const prevMedia = () =>
    setPreviewIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);

  const handleKeyDown = (e) => {
    if (previewIndex !== null) {
      if (e.key === "ArrowRight") nextMedia();
      if (e.key === "ArrowLeft") prevMedia();
      if (e.key === "Escape") setPreviewIndex(null);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ===== Swipe =====
  const handleTouchStart = (e) => (swipeStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null) return;
    const diff = swipeStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) (diff > 0 ? nextMedia() : prevMedia());
    swipeStartX.current = null;
  };

  // ===== Helpers =====
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString();

  return (
    <div className="mb-6 p-4 border rounded bg-neutral-800 text-white">

      {/* Timestamp */}
      {createdAt && (
        <p className="text-gray-400 text-sm mb-2">
          Posted on: {formatDate(createdAt)}
        </p>
      )}

      {/* Post Text */}
      {postText && <p className="mb-2 whitespace-pre-wrap">{postText}</p>}

      {/* Upload Section */}
      {token && isOwner && (
        <div className="mb-2 flex gap-2">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-2 py-1 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {/* Media Gallery */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {mediaFiles.map((media, i) => (
            <div
              key={i}
              className="relative cursor-pointer overflow-hidden rounded-lg"
              onClick={() => setPreviewIndex(i)}
            >
              {media.type === "video" ? (
                <video
                  src={`https://swordgame-5.onrender.com${media.url}`}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={`https://swordgame-5.onrender.com${media.url}`}
                  alt="post media"
                  className="w-full h-full object-cover"
                />
              )}
              {media.type === "video" && (
                <div className="absolute top-1 right-1 bg-black/60 text-white px-1 text-xs rounded">
                  🎬
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Preview */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setPreviewIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prevMedia(); }}
            className="absolute left-4 text-white text-2xl"
          >
            ◀
          </button>
          {mediaFiles[previewIndex].type === "video" ? (
            <video
              src={`https://swordgame-5.onrender.com${mediaFiles[previewIndex].url}`}
              controls
              autoPlay
              className="max-h-full max-w-full"
            />
          ) : (
            <img
              src={`https://swordgame-5.onrender.com${mediaFiles[previewIndex].url}`}
              alt="preview"
              className="max-h-full max-w-full"
            />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); nextMedia(); }}
            className="absolute right-4 text-white text-2xl"
          >
            ▶
          </button>
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => handleReaction("like")}
          className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
        >
          👍 Like ({LIKE_COST})
        </button>
        <span>{likeCount}</span>
        <button
          onClick={() => handleReaction("love")}
          className="bg-pink-600 px-3 py-1 rounded hover:bg-pink-700"
        >
          ❤️ Love ({LOVE_COST})
        </button>
        <span>{loveCount}</span>
      </div>
    </div>
  );
}