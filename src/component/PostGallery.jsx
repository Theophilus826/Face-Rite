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
  const safeMedia = Array.isArray(mediaFiles)
    ? mediaFiles.filter((m) => m && m.url && m.type)
    : [];
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
  const next = () => setIndex((p) => (p === safeMedia.length - 1 ? 0 : p + 1));

  const prev = () => setIndex((p) => (p === 0 ? safeMedia.length - 1 : p - 1));
  /* ================= REACTIONS ================= */
  const handleReaction = async (type) => {
    if (!postOwnerId) return;

    if ((type === "like" && liked) || (type === "love" && loved)) {
      return;
    }

    try {
      // 💰 Transfer coins
      await dispatch(
        transferCoins({
          toUserId: postOwnerId,
          coins: type === "like" ? LIKE_COST : LOVE_COST,
          description: `${type} reaction`,
        }),
      ).unwrap();

      // ❤️ Backend reaction
      const res = await API.post(
        `/post/${postId}/react`,
        { type },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      setLikeCount(res.data.likeCount);
      setLoveCount(res.data.loveCount);

      // ✨ Animation
      if (type === "like") {
        setLiked(true);
        setAnimateLike(true);
        setTimeout(() => setAnimateLike(false), 400);
      }

      if (type === "love") {
        setLoved(true);
        setAnimateLove(true);
        setTimeout(() => setAnimateLove(false), 400);
      }
    } catch (err) {
      console.error("Reaction error:", err);
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

      {safeMedia.length === 1 ? (
        /* ================= SINGLE ================= */
        safeMedia[0].type === "video" ? (
          <div className="relative w-full flex justify-center">
            <div className="relative w-full max-w-5xl">
              <video
                ref={(el) => (videoRefs.current[0] = el)}
                src={safeMedia[0].url}
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
            src={safeMedia[0].url}
            className="w-full max-h-[80vh] object-contain rounded-lg"
            alt=""
          />
        )
      ) : safeMedia.length === 2 ? (
        /* ================= 2 ITEMS ================= */
        <div className="grid grid-cols-2 gap-2">
          {safeMedia.map((m, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              className="relative h-60 rounded-lg overflow-hidden cursor-pointer"
            >
              {m.type === "video" ? (
                <video
                  ref={(el) => (videoRefs.current[i] = el)}
                  src={m.url}
                  className="w-full h-full object-cover"
                  muted={muted}
                  loop
                  playsInline
                />
              ) : (
                <img src={m.url} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      ) : safeMedia.length === 3 ? (
        /* ================= 3 ITEMS ================= */
        <div className="grid grid-cols-3 gap-2 h-[400px]">
          <div
            className="col-span-2 row-span-2 rounded-lg overflow-hidden"
            onClick={() => setIndex(0)}
          >
            <img
              src={safeMedia[0].url}
              className="w-full h-full object-cover"
            />
          </div>
          {safeMedia.slice(1).map((m, i) => (
            <div
              key={i}
              onClick={() => setIndex(i + 1)}
              className="rounded-lg overflow-hidden"
            >
              <img src={m.url} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        /* ================= 4+ ITEMS (INSTAGRAM STYLE) ================= */
        <>
          {/* DESKTOP */}
          <div className="hidden sm:grid grid-cols-3 gap-2 h-[420px]">
            {/* BIG */}
            <div
              className="col-span-2 row-span-2 relative rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setIndex(0)}
            >
              {safeMedia[0].type === "video" ? (
                <video
                  ref={(el) => (videoRefs.current[0] = el)}
                  src={safeMedia[0].url}
                  className="w-full h-full object-cover"
                  muted={muted}
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={safeMedia[0].url}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* GRID */}
            {safeMedia.slice(1, 5).map((m, i) => (
              <div
                key={i}
                onClick={() => setIndex(i + 1)}
                className="relative rounded-lg overflow-hidden cursor-pointer"
              >
                {m.type === "video" ? (
                  <video
                    ref={(el) => (videoRefs.current[i + 1] = el)}
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted={muted}
                    loop
                    playsInline
                  />
                ) : (
                  <img src={m.url} className="w-full h-full object-cover" />
                )}

                {/* +MORE */}
                {safeMedia.length > 5 && i === 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
                    +{safeMedia.length - 5}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* MOBILE */}
          <div className="grid sm:hidden grid-cols-2 gap-2">
            {safeMedia.map((m, i) => (
              <div
                key={i}
                onClick={() => setIndex(i)}
                className="relative h-40 rounded-md overflow-hidden cursor-pointer"
              >
                {m.type === "video" ? (
                  <video
                    ref={(el) => (videoRefs.current[i] = el)}
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted={muted}
                    loop
                    playsInline
                  />
                ) : (
                  <img src={m.url} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {/* ================= MODAL ================= */}

      {index !== null && safeMedia[index] && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={() => setIndex(null)}
        >
          {/* PREV */}
          <button
            className="absolute left-4 text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((p) => (p === 0 ? safeMedia.length - 1 : p - 1));
            }}
          >
            ‹
          </button>

          {/* MEDIA */}
          <motion.div
            key={index}
            className="relative max-w-6xl w-full px-3"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {safeMedia[index]?.type === "video" ? (
              <video
                src={safeMedia[index].url}
                className="w-full max-h-[90vh] object-contain rounded-lg"
                controls
                autoPlay
                muted={muted}
              />
            ) : (
              <img
                src={safeMedia[index]?.url}
                className="max-h-[90vh] max-w-full rounded-lg"
                alt=""
              />
            )}
          </motion.div>

          {/* NEXT */}
          <button
            className="absolute right-4 text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((p) => (p === safeMedia.length - 1 ? 0 : p + 1));
            }}
          >
            ›
          </button>

          {/* COUNT */}
          <div className="absolute bottom-6 text-white text-sm">
            {index + 1} / {safeMedia.length}
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
