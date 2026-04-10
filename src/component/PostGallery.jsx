import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { transferCoins } from "../features/coins/CoinSlice";
import { API } from "../features/Api";

export default function PostGalleryWithUpload({
  postId,
  postOwnerId,
  token,
  user,
  text = "",
  createdAt,
  mediaFiles = [],
  initialLikes = 0,
  initialLoves = 0,
}) {
  const dispatch = useDispatch();

  // ================= STATES =================
  const [index, setIndex] = useState(null);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loveCount, setLoveCount] = useState(initialLoves);

  const [liked, setLiked] = useState(false);
  const [loved, setLoved] = useState(false);

  const [animateLike, setAnimateLike] = useState(false);
  const [animateLove, setAnimateLove] = useState(false);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  // ================= NAVIGATION =================
  const next = () =>
    setIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));

  const prev = () =>
    setIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));

  // ================= REACTIONS =================
  const handleReaction = async (type) => {
    if (!postOwnerId) return;
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
        setTimeout(() => setAnimateLike(false), 600);
      }

      if (type === "love") {
        setLoved(true);
        setAnimateLove(true);
        setTimeout(() => setAnimateLove(false), 600);
      }
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="space-y-3">

      {/* DATE */}
      {createdAt && (
        <p className="text-sm text-gray-600">
          {formatDate(createdAt)}
        </p>
      )}

      {/* TEXT */}
      {text && <p className="text-base">{text}</p>}

      {/* ================= MEDIA ================= */}

      {mediaFiles.length === 1 ? (
        <img
          src={mediaFiles[0].url}
          className="w-full max-h-[500px] object-contain rounded-xl cursor-pointer"
          onClick={() => setIndex(0)}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mediaFiles.map((m, i) => (
            <div
              key={i}
              className="relative cursor-pointer overflow-hidden rounded-lg"
              onClick={() => setIndex(i)}
            >
              {m.type === "video" ? (
                <video
                  src={m.url}
                  className="w-full h-32 sm:h-40 object-cover"
                />
              ) : (
                <img
                  src={m.url}
                  className="w-full h-32 sm:h-40 object-cover"
                  alt=""
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= SWIPE MODAL ================= */}

      {index !== null && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={() => setIndex(null)}
        >
          {/* LEFT */}
          <button
            className="absolute left-4 text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>

          {/* IMAGE / VIDEO */}
          <motion.div
            key={index}
            className="max-w-full max-h-full px-3"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.x < -80) next();
              if (info.offset.x > 80) prev();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {mediaFiles[index].type === "video" ? (
              <video
                src={mediaFiles[index].url}
                className="max-h-[90vh] max-w-[95vw] rounded-xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={mediaFiles[index].url}
                className="max-h-[90vh] max-w-[95vw] rounded-xl"
                alt=""
              />
            )}
          </motion.div>

          {/* RIGHT */}
          <button
            className="absolute right-4 text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            ›
          </button>

          {/* COUNTER */}
          <div className="absolute bottom-6 text-white text-sm">
            {index + 1} / {mediaFiles.length}
          </div>
        </div>
      )}

      {/* ================= REACTIONS ================= */}

      <div className="flex gap-4 mt-4">

        {/* LIKE */}
        <div className="relative">
          <button
            onClick={() => handleReaction("like")}
            className={`px-4 py-2 rounded-xl text-white transition ${
              liked ? "bg-blue-700" : "bg-blue-500"
            } ${animateLike ? "scale-125" : ""}`}
          >
            👍 {likeCount}
          </button>

          {animateLike && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl animate-bounce">
              👍
            </span>
          )}
        </div>

        {/* LOVE */}
        <div className="relative">
          <button
            onClick={() => handleReaction("love")}
            className={`px-4 py-2 rounded-xl text-white transition ${
              loved ? "bg-pink-700" : "bg-pink-500"
            } ${animateLove ? "scale-125" : ""}`}
          >
            ❤️ {loveCount}
          </button>

          {animateLove && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl animate-bounce">
              ❤️
            </span>
          )}
        </div>
      </div>
    </div>
  );
}