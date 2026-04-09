import React, { useState } from "react";
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

  // ===== Reactions =====
  const handleReaction = async (type) => {
    if (!postOwnerId || token?.userId === postOwnerId) return;
    if ((type === "like" && liked) || (type === "love" && loved)) return;

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
      {createdAt && <p className="text-sm text-gray-600">{formatDate(createdAt)}</p>}
      {postText && <p className="my-3">{postText}</p>}

      {/* Media Grid */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {mediaFiles.map((m, i) => (
            <div
              key={i}
              className="relative cursor-pointer rounded-xl overflow-hidden"
              onClick={() => setPreviewIndex(i)}
            >
              {m.type === "video" ? (
                <video src={m.url} className="w-full h-32 object-cover" controls />
              ) : (
                <img src={m.url} className="w-full h-32 object-cover" alt="" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex justify-center items-center z-50"
          onClick={() => setPreviewIndex(null)}
        >
          <img
            src={mediaFiles[previewIndex].url}
            className="max-h-full max-w-full rounded-lg"
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