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
  comments = [],
}) {
  const dispatch = useDispatch();

  /* ================= STATE ================= */
  const [index, setIndex] = useState(null);

  const [likedBy, setLikedBy] = useState([]);
  const [lovedBy, setLovedBy] = useState([]);
  const [userReaction, setUserReaction] = useState(null);

  const [animateLike, setAnimateLike] = useState(false);
  const [animateLove, setAnimateLove] = useState(false);

  const [muted, setMuted] = useState(true);

  const videoRefs = useRef([]);
  const observerRef = useRef(null);

  const LIKE_COST = 50;
  const LOVE_COST = 100;

  /* ================= LOAD POST ================= */
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const res = await API.get(`/post/${postId}`);

        const post = res.data.post;

        setLikedBy(post.likedBy || []);
        setLovedBy(post.lovedBy || []);
        setUserReaction(post.userReaction || null);
      } catch (err) {
        console.error("Failed to load post:", err);
      }
    };

    fetchPost();
  }, [postId]);

  /* ================= DERIVED VALUES ================= */
  const liked = likedBy.includes(user?.id);
  const loved = lovedBy.includes(user?.id);

  const likeCount = likedBy.length;
  const loveCount = lovedBy.length;

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
      { threshold: 0.6 }
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

  /* ================= REACTIONS ================= */
  const handleReaction = async (type) => {
    try {
      await dispatch(
        transferCoins({
          toUserId: postOwnerId,
          coins: type === "like" ? LIKE_COST : LOVE_COST,
          description: `${type.toUpperCase()} reaction`,
        })
      ).unwrap();

      const res = await API.post(`/post/${postId}/react`, { type });

      setLikedBy(res.data.likedBy);
      setLovedBy(res.data.lovedBy);
      setUserReaction(res.data.userReaction);

      if (type === "like") {
        setAnimateLike(true);
        setTimeout(() => setAnimateLike(false), 500);
      }

      if (type === "love") {
        setAnimateLove(true);
        setTimeout(() => setAnimateLove(false), 500);
      }
    } catch (err) {
      console.error("Reaction failed:", err.response?.data || err);
    }
  };

  /* ================= LIKE TEXT ================= */
  const getLikeText = () => {
    const total = likedBy.length;
    const likedByMe = likedBy.includes(user?.id);

    if (total === 0) return "Be the first to like this";

    if (likedByMe) {
      if (total === 1) return "Liked by you";
      return `Liked by you and ${total - 1} others`;
    }

    return `Liked by ${total} people`;
  };

  /* ================= DATE ================= */
  const formatDate = (d) =>
    d ? new Date(d).toLocaleString() : "";

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
        mediaFiles[0].type === "video" ? (
          <div className="relative w-full flex justify-center">
            <div className="relative w-full max-w-5xl">
              <video
                ref={(el) => (videoRefs.current[0] = el)}
                src={mediaFiles[0].url}
                className="w-full max-h-[80vh] object-cover rounded-lg"
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mediaFiles.map((m, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              className="rounded-md overflow-hidden border cursor-pointer"
            >
              {m.type === "video" ? (
                <video
                  ref={(el) => (videoRefs.current[i] = el)}
                  src={m.url}
                  className="w-full h-48 object-cover"
                  muted={muted}
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={m.url}
                  className="w-full h-48 object-cover"
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
          <motion.div
            className="max-w-5xl w-full px-3"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {mediaFiles[index].type === "video" ? (
              <video
                src={mediaFiles[index].url}
                className="w-full max-h-[90vh] object-contain"
                controls
                autoPlay
                muted={muted}
              />
            ) : (
              <img
                src={mediaFiles[index].url}
                className="max-h-[90vh] mx-auto"
                alt=""
              />
            )}
          </motion.div>
        </div>
      )}

      {/* ================= REACTIONS ================= */}
      <div className="flex gap-4 mt-4 flex-wrap">

        <button
          onClick={() => handleReaction("like")}
          className={`px-4 py-2 rounded-xl text-white transition ${
            liked
              ? "bg-blue-700 ring-2 ring-white scale-105"
              : "bg-blue-500"
          } ${animateLike ? "scale-110" : ""}`}
        >
          👍 {likeCount}
        </button>

        <button
          onClick={() => handleReaction("love")}
          className={`px-4 py-2 rounded-xl text-white transition ${
            loved
              ? "bg-pink-700 ring-2 ring-white scale-105"
              : "bg-pink-500"
          } ${animateLove ? "scale-110" : ""}`}
        >
          ❤️ {loveCount}
        </button>
      </div>

      {/* ================= LIKE TEXT ================= */}
      <p className="text-sm text-gray-500 mt-2">
        {getLikeText()}
      </p>
    </div>
  );
}