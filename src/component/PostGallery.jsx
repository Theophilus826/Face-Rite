import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { transferCoins } from "../features/coins/CoinSlice";
import { API } from "../features/Api";
import { toast } from "react-toastify";

interface MediaFile {
  url: string;
  type: "image" | "video";
}

interface Comment {
  id: string;
  userId: string;
  username?: string;
  text: string;
  createdAt: string;
}

interface PostGalleryWithUploadProps {
  postId: string;
  postOwnerId: string;
  token: { userId: string; [key: string]: any };
  text?: string;
  initialLikes?: number;
  initialLoves?: number;
  createdAt: string;
  mediaFiles?: MediaFile[];
  user?: { id: string; name?: string };
  comments?: Comment[];
  onNewComment?: (comment: Comment) => void;
}

export default function PostGalleryWithUpload({
  postId,
  postOwnerId,
  token,
  text = "",
  initialLikes = 0,
  initialLoves = 0,
  createdAt,
  mediaFiles: initialMediaFiles = [],
  user,
  comments: initialComments = [],
  onNewComment,
}: PostGalleryWithUploadProps) {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [mediaFiles, setMediaFiles] = useState(initialMediaFiles);
  const [postText, setPostText] = useState(text);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loveCount, setLoveCount] = useState(initialLoves);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [animateLike, setAnimateLike] = useState(false);
  const [animateLove, setAnimateLove] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newCommentText, setNewCommentText] = useState("");

  const LIKE_COST = 50;
  const LOVE_COST = 100;
  const isOwner = token?.userId === postOwnerId;

  // Sync props
  useEffect(() => setMediaFiles(initialMediaFiles), [initialMediaFiles]);
  useEffect(() => setPostText(text), [text]);
  useEffect(() => setComments(initialComments), [initialComments]);

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFile(e.target.files?.[0] ?? null);

  const handleUpload = async () => {
    if (!file) return toast.warning("Select a file first!");
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
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("File uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Reactions
  const handleReaction = async (type: "like" | "love") => {
    if (!postOwnerId) return;
    if (token?.userId === postOwnerId) {
      toast.info("You cannot react to your own post.");
      return;
    }

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

      toast.success(`${type === "like" ? "Liked" : "Loved"} the post!`);
    } catch (err) {
      console.error("Reaction failed:", err);
      toast.error("Reaction failed");
    }
  };

  // Comments
  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      const res = await API.post(`/post/${postId}/comment`, {
        text: newCommentText,
      });
      setComments([...comments, res.data.comment]);
      onNewComment?.(res.data.comment);
      setNewCommentText("");
      toast.success("Comment added!");
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast.error("Failed to add comment");
    }
  };

  // Media Preview
  const nextMedia = () =>
    setPreviewIndex((prev) => (prev !== null ? (prev + 1) % mediaFiles.length : 0));
  const prevMedia = () =>
    setPreviewIndex(
      (prev) => (prev !== null ? (prev - 1 + mediaFiles.length) % mediaFiles.length : 0)
    );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  return (
    <div className="mb-6 p-5 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg text-gray-900">
      {/* Timestamp */}
      {createdAt && <p className="text-gray-600 text-sm mb-2">{formatDate(createdAt)}</p>}

      {/* Post text */}
      {postText && <p className="mb-3 whitespace-pre-wrap text-gray-800">{postText}</p>}

      {/* File Upload (owner only) */}
      {token && isOwner && (
        <div className="mb-3 flex gap-2">
          <input
            ref={fileInputRef}
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
                  src={media.url}
                  className="w-full h-auto max-h-[500px] object-cover rounded-xl"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={media.url}
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
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewIndex(null)}
        >
          {mediaFiles[previewIndex].type === "video" ? (
            <video
              src={mediaFiles[previewIndex].url}
              controls
              autoPlay
              muted
              loop
              className="max-h-full max-w-full rounded-lg"
            />
          ) : (
            <img
              src={mediaFiles[previewIndex].url}
              className="max-h-full max-w-full rounded-lg"
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

      {/* Comments */}
      <div className="mt-4 space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="p-2 bg-gray-100 rounded-lg">
            <p className="text-sm font-semibold">{c.username || c.userId}</p>
            <p className="text-sm">{c.text}</p>
          </div>
        ))}

        {/* Add Comment */}
        {token && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1 rounded-lg border border-gray-300"
            />
            <button
              onClick={handleAddComment}
              className="px-3 py-1 rounded-lg bg-blue-500 text-white"
            >
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}