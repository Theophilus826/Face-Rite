import React, { useState, useRef, useEffect } from "react";
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
  comments = [],
}) {
  const dispatch = useDispatch();

  /* ================= STATE ================= */
  const [index, setIndex] = useState(null);

  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loveCount, setLoveCount] = useState(initialLoves);

  const [liked, setLiked] = useState(false);
  const [loved, setLoved] = useState(false);

  const [animateLike, setAnimateLike] = useState(false);
  const [animateLove, setAnimateLove] = useState(false);

  const [muted, setMuted] = useState(true);

  const videoRefs = useRef([]);
  const observerRef = useRef(null);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  /* ================= AUTO PLAY ================= */
  useEffect(() => {
    if (!mediaFiles?.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 },
    );

    videoRefs.current.forEach((v) => {
      if (v) observerRef.current.observe(v);
    });

    return () => {
      videoRefs.current.forEach((v) => {
        if (v) observerRef.current?.unobserve(v);
      });
      observerRef.current?.disconnect();
    };
  }, [mediaFiles]);

  /* ================= MUTE ================= */
  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev;

      videoRefs.current.forEach((v) => {
        if (v) v.muted = newMuted;
      });

      return newMuted;
    });
  };

  /* ================= NAVIGATION ================= */
  const next = () => setIndex((p) => (p === mediaFiles.length - 1 ? 0 : p + 1));

  const prev = () => setIndex((p) => (p === 0 ? mediaFiles.length - 1 : p - 1));

  /* ================= REACTIONS ================= */
  const handleReaction = async (type) => {
  if (!postOwnerId) return;

  try {
    const res = await API.post(
      `/post/${postId}/react`,
      { type },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );

    setLikeCount(res.data.likeCount);
    setLoveCount(res.data.loveCount);

    // toggle UI based on response OR local
    if (type === "like") {
      setLiked((prev) => !prev);
      setLoved(false);
    }

    if (type === "love") {
      setLoved((prev) => !prev);
      setLiked(false);
    }
  } catch (err) {
    console.error(err);
  }
};

  /* ================= FORMAT ================= */
  const formatDate = (d) => (d ? new Date(d).toLocaleString() : "");

  /* ================= UI ================= */

  return (
    <div className="space-y-3">
      {/* DATE */}
      {createdAt && (
        <p className="text-sm text-gray-500">{formatDate(createdAt)}</p>
      )}

      {/* TEXT */}
      {text && <p className="text-base">{text}</p>}

      {/* ================= MEDIA ================= */}

      {mediaFiles?.length === 1 ? (
        // ===== SAME SINGLE VIEW (UNCHANGED) =====
        mediaFiles[0].type === "video" ? (
          <div className="relative w-full flex justify-center">
            <div className="relative w-full max-w-5xl">
              <video
                ref={(el) => (videoRefs.current[0] = el)}
                src={mediaFiles[0].url}
                className="w-full max-h-[80vh] object-cover rounded-lg border"
                muted={muted}
                loop
                playsInline
              />
              <button
                onClick={toggleMute}
                className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded"
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
      ) : mediaFiles?.length >= 3 ? (
        // ===== 🔥 COLLAGE LAYOUT =====
        <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[400px]">
          {/* LEFT BIG */}
          <div
            onClick={() => setIndex(0)}
            className="col-span-1 row-span-2 cursor-pointer overflow-hidden rounded-xl"
          >
            {mediaFiles[0]?.type === "video" ? (
              <video
                ref={(el) => (videoRefs.current[0] = el)}
                src={mediaFiles[0]?.url}
                className="w-full h-full object-cover"
                muted={muted}
                loop
              />
            ) : (
              <img
                src={mediaFiles[0]?.url}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </div>

          {/* RIGHT TOP */}
          <div
            onClick={() => setIndex(1)}
            className="col-span-2 row-span-1 cursor-pointer overflow-hidden rounded-xl"
          >
            {mediaFiles[1]?.type === "video" ? (
              <video
                ref={(el) => (videoRefs.current[1] = el)}
                src={mediaFiles[1]?.url}
                className="w-full h-full object-cover"
                muted={muted}
                loop
              />
            ) : (
              <img
                src={mediaFiles[1]?.url}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </div>

          {/* BOTTOM RIGHT */}
          <div className="col-span-2 grid grid-cols-2 gap-2">
            {mediaFiles.slice(2, 4).map((m, i) => {
              if (!m) return null;

              return (
                <div
                  key={i}
                  onClick={() => setIndex(i + 2)}
                  className="cursor-pointer relative overflow-hidden rounded-xl"
                >
                  {m.type === "video" ? (
                    <video
                      ref={(el) => (videoRefs.current[i + 2] = el)}
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted={muted}
                      loop
                    />
                  ) : (
                    <img
                      src={m.url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  )}

                  {/* +MORE */}
                  {i === 1 && mediaFiles.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-bold">
                      +{mediaFiles.length - 4}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // ===== YOUR ORIGINAL GRID (SAFE FALLBACK) =====
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mediaFiles.map((m, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              className="relative rounded-md overflow-hidden border cursor-pointer"
            >
              {m.type === "video" ? (
                <>
                  <video
                    ref={(el) => (videoRefs.current[i] = el)}
                    src={m.url}
                    className="w-full h-48 object-cover"
                    muted={muted}
                    loop
                    playsInline
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded"
                  >
                    {muted ? "🔇" : "🔊"}
                  </button>
                </>
              ) : (
                <img src={m.url} className="w-full h-48 object-cover" alt="" />
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
            className="relative max-w-6xl w-full px-3"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {mediaFiles[index].type === "video" ? (
              <>
                <video
                  src={mediaFiles[index].url}
                  className="w-full max-h-[90vh] object-contain rounded-lg"
                  controls
                  autoPlay
                  muted={muted}
                />
                <button
                  onClick={toggleMute}
                  className="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded"
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
          } ${animateLike ? "scale-110" : ""}`}
        >
          👍 {likeCount}
        </button>

        <button
          onClick={() => handleReaction("love")}
          className={`px-4 py-2 rounded-xl text-white ${
            loved ? "bg-pink-700" : "bg-pink-500"
          } ${animateLove ? "scale-110" : ""}`}
        >
          ❤️ {loveCount}
        </button>
      </div>
    </div>
  );
}
