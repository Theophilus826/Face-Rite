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

  // ✅ Independent reactions
  const [liked, setLiked] = useState(false);
  const [loved, setLoved] = useState(false);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  const isOwner = String(user?._id) === String(postOwnerId);
  // ===== Polling =====
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

          if (p.userReactions) {
            setLiked(p.userReactions.includes("like"));
            setLoved(p.userReactions.includes("love"));
          }
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [postId]);

  // ===== Upload =====
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    try {
      setUploading(true);
      const res = await API.post(`/post/${postId}/media`, formData);
      setMediaFiles(res.data.post.media || []);
      setFiles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // ===== Reactions =====
  const handleReaction = async (type) => {
    if (!postOwnerId || token?.userId === postOwnerId) return;

    // Prevent duplicate
    if (type === "like" && liked) return;
    if (type === "love" && loved) return;

    try {
      await dispatch(
        transferCoins({
          toUserId: postOwnerId,
          coins: type === "like" ? LIKE_COST : LOVE_COST,
          description: `${type} reaction`,
        })
      ).unwrap();

      const res = await API.post(`/post/${postId}/react`, { type });

      setLikeCount(res.data.likeCount);
      setLoveCount(res.data.loveCount);

      if (type === "like") {
        setLiked(true);
        setAnimateLike(true);
        setTimeout(() => setAnimateLike(false), 700);
      }

      if (type === "love") {
        setLoved(true);
        setAnimateLove(true);
        setTimeout(() => setAnimateLove(false), 700);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="mb-6 p-5 rounded-2xl bg-white/30 backdrop-blur-xl shadow-lg">

      {createdAt && (
        <p className="text-sm text-gray-600">{formatDate(createdAt)}</p>
      )}

      {postText && <p className="my-3">{postText}</p>}

      {/* Upload */}
      {token && isOwner && (
        <div className="flex gap-2 mb-3">
          <input type="file" multiple onChange={handleFileChange} />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {/* Media */}
      {mediaFiles.map((m, i) => (
        <div key={i} onClick={() => setPreviewIndex(i)}>
          {m.type === "video" ? (
            <video src={m.url} className="rounded-xl w-full" controls />
          ) : (
            <img src={m.url} className="rounded-xl w-full" alt="" />
          )}
        </div>
      ))}

      {/* Preview */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex justify-center items-center"
          onClick={() => setPreviewIndex(null)}
        >
          <img
            src={mediaFiles[previewIndex].url}
            className="max-h-full max-w-full"
            alt=""
          />
        </div>
      )}

      {/* Reactions */}
      <div className="flex gap-6 mt-5">

        {/* LIKE */}
        <div className="relative">
          <button
            onClick={() => handleReaction("like")}
            className={`px-4 py-2 rounded-xl text-white transition-all duration-300 ${
              liked ? "bg-blue-700" : "bg-blue-500"
            } ${animateLike ? "scale-125 shadow-2xl" : ""}`}
          >
            👍 {likeCount}
          </button>

          {animateLike && (
            <span className="absolute left-1/2 -translate-x-1/2 -top-6 text-2xl animate-float">
              👍
            </span>
          )}
        </div>

        {/* LOVE */}
        <div className="relative">
          <button
            onClick={() => handleReaction("love")}
            className={`px-4 py-2 rounded-xl text-white transition-all duration-300 ${
              loved ? "bg-pink-700" : "bg-pink-500"
            } ${animateLove ? "scale-125 shadow-2xl" : ""}`}
          >
            ❤️ {loveCount}
          </button>

          {animateLove && (
            <span className="absolute left-1/2 -translate-x-1/2 -top-6 text-2xl animate-float">
              ❤️
            </span>
          )}
        </div>

      </div>
    </div>
  );
}