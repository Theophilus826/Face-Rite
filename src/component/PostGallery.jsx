import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { transferCoins } from "../features/coins/CoinSlice";
import { API } from "../features/Api";

export default function PostGalleryWithUpload({
  postId,
  postOwnerId,
  token,
  user,
  comments = [],
  onNewComment = () => {},
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
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loveCount, setLoveCount] = useState(initialLoves);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [animateLike, setAnimateLike] = useState(false);
  const [animateLove, setAnimateLove] = useState(false);

  const LIKE_COST = 50;
  const LOVE_COST = 100;
  const isOwner = user?.id === postOwnerId;

  // Sync props
  useEffect(() => setMediaFiles(initialMediaFiles), [initialMediaFiles]);
  useEffect(() => setPostText(text), [text]);

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
    if (!postOwnerId || token?.userId === postOwnerId) return;

    try {
      await dispatch(
        transferCoins({
          toUserId: postOwnerId,
          coins: type === "like" ? LIKE_COST : LOVE_COST, // ← use coins
          description: `${type.toUpperCase()} reaction`,
        }),
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
    setPreviewIndex(
      (prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length,
    );

  // ===== Format Date =====
  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  return (
    <div className="mb-6 p-5 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg text-gray-900">
      {/* Timestamp */}
      {createdAt && (
        <p className="text-gray-600 text-sm mb-2">{formatDate(createdAt)}</p>
      )}

      {/* Post text */}
      {postText && (
        <p className="mb-3 whitespace-pre-wrap text-gray-800">{postText}</p>
      )}

      {/* File Upload (owner only) */}
      {token && isOwner && (
        <div className="mb-3 flex gap-2">
          <input
            type="file"
            onChange={handleFileChange}
            className="text-gray-700"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
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
                  src={
                    media.url?.startsWith("http")
                      ? media.url
                      : `https://swordgame-5.onrender.com${media.url}`
                  }
                  className="w-full h-auto max-h-[500px] object-cover rounded-xl"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={
                    media.url?.startsWith("http")
                      ? media.url
                      : `https://swordgame-5.onrender.com${media.url}`
                  }
                  alt="post"
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
          onClick={() => setPreviewIndex(null)}
        >
          {mediaFiles[previewIndex].type === "video" ? (
            <video
              src={
                mediaFiles[previewIndex].url?.startsWith("http")
                  ? mediaFiles[previewIndex].url
                  : `https://swordgame-5.onrender.com${mediaFiles[previewIndex].url}`
              }
              controls
              autoPlay
              muted
              loop
              className="max-h-full max-w-full"
            />
          ) : (
            <img
              src={
                mediaFiles[previewIndex].url?.startsWith("http")
                  ? mediaFiles[previewIndex].url
                  : `https://swordgame-5.onrender.com${mediaFiles[previewIndex].url}`
              }
              className="max-h-full max-w-full"
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
