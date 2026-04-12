import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { transferCoins } from "../features/coins/CoinSlice";
import { API } from "../features/Api";

export default function PostGalleryWithUpload({
  postId,
  postOwnerId,
  token, // ✅ ADD THIS
  user,
  text = "",
  createdAt,
  mediaFiles = [],
  initialLikes = 0,
  initialLoves = 0,
  comments = [],
}) {
  const dispatch = useDispatch();

  const [index, setIndex] = useState(null);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loveCount, setLoveCount] = useState(initialLoves);

  const [liked, setLiked] = useState(false);
  const [loved, setLoved] = useState(false);

  const [animateLike, setAnimateLike] = useState(false);
  const [animateLove, setAnimateLove] = useState(false);

  const [muted, setMuted] = useState(true);

  const videoRefs = useRef([]);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  // ================= AUTO PLAY =================
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      },
      { threshold: 0.6 },
    );

    videoRefs.current.forEach((v) => v && observer.observe(v));

    return () => {
      videoRefs.current.forEach((v) => v && observer.unobserve(v));
    };
  }, [mediaFiles]);

  // ================= MUTE =================
  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);

    videoRefs.current.forEach((v) => {
      if (v) v.muted = newMuted;
    });
  };

  // ================= NAV =================
  const next = () => setIndex((p) => (p === mediaFiles.length - 1 ? 0 : p + 1));

  const prev = () => setIndex((p) => (p === 0 ? mediaFiles.length - 1 : p - 1));

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
        }),
      ).unwrap();

      const res = await API.post(`/post/${postId}/react`, { type });

      setLikeCount(res.data.likeCount);
      setLoveCount(res.data.loveCount);

      if (type === "like") {
        setLiked(true);
        setAnimateLike(true);
        setTimeout(() => setAnimateLike(false), 500);
      }

      if (type === "love") {
        setLoved(true);
        setAnimateLove(true);
        setTimeout(() => setAnimateLove(false), 500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="space-y-3">
      {/* DATE */}
      {createdAt && (
        <p className="text-sm text-gray-600">{formatDate(createdAt)}</p>
      )}

      {/* TEXT */}
      {text && <p className="text-base">{text}</p>}

      {/* ================= MEDIA ================= */}

      {mediaFiles.length === 1 ? (
        mediaFiles[0].type === "video" ? (
          <div className="relative w-full flex justify-center">
            <div className="relative w-full max-w-6xl">
              <video
                ref={(el) => (videoRefs.current[0] = el)}
                src={mediaFiles[0].url}
                className="
                  w-full
                  max-h-[80vh]
                  object-cover
                  rounded-lg
                  border border-gray-200
                "
                muted={muted}
                loop
                playsInline
              />

              {/* 🔊 MUTE */}
              <button
                onClick={toggleMute}
                className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-md text-sm"
              >
                {muted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>
        ) : (
          <img
            src={mediaFiles[0].url}
            className="w-full max-h-[80vh] object-contain rounded-lg"
            alt=""
          />
        )
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mediaFiles.map((m, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-md border border-gray-200"
              onClick={() => setIndex(i)}
            >
              {m.type === "video" ? (
                <div className="relative w-full h-44 sm:h-52 md:h-60">
                  <video
                    ref={(el) => (videoRefs.current[i] = el)}
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted={muted}
                    loop
                    playsInline
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                  >
                    {muted ? "🔇" : "🔊"}
                  </button>
                </div>
              ) : (
                <img
                  src={m.url}
                  className="w-full h-44 sm:h-52 md:h-60 object-cover"
                  alt=""
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL ================= */}

      {index !== null && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={() => setIndex(null)}
        >
          <button
            className="absolute left-4 text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>

          <motion.div
            key={index}
            className="relative w-full max-w-6xl px-3"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {mediaFiles[index].type === "video" ? (
              <>
                <video
                  src={mediaFiles[index].url}
                  className="
                    w-full
                    max-h-[90vh]
                    object-contain
                    rounded-lg
                    border border-gray-200
                  "
                  controls
                  autoPlay
                  muted={muted}
                />

                <button
                  onClick={toggleMute}
                  className="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded-md"
                >
                  {muted ? "🔇" : "🔊"}
                </button>
              </>
            ) : (
              <img
                src={mediaFiles[index].url}
                className="max-h-[90vh] max-w-full rounded-lg"
                alt=""
              />
            )}
          </motion.div>

          <button
            className="absolute right-4 text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            ›
          </button>

          <div className="absolute bottom-6 text-white text-sm">
            {index + 1} / {mediaFiles.length}
          </div>
        </div>
      )}

      {/* ================= REACTIONS ================= */}

      <div className="flex gap-4 mt-4 flex-wrap">
        <button
          onClick={() => handleReaction("like")}
          className={`px-4 py-2 rounded-xl text-white ${
            liked ? "bg-blue-700" : "bg-blue-500"
          } ${animateLike ? "scale-125" : ""}`}
        >
          👍 {likeCount}
        </button>

        <button
          onClick={() => handleReaction("love")}
          className={`px-4 py-2 rounded-xl text-white ${
            loved ? "bg-pink-700" : "bg-pink-500"
          } ${animateLove ? "scale-125" : ""}`}
        >
          ❤️ {loveCount}
        </button>
      </div>
    </div>
  );
}
