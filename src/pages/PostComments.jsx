import { useState } from "react";
import { motion } from "framer-motion";
import { API } from "../features/Api";

export default function PostComments({ postId, comments = [], user, onNewComment }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComment = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);

      const res = await API.post(`/post/${postId}/comment`, {
        text: text.trim(),
      });

      onNewComment(res.data.comment); // update parent
      setText("");
    } catch (err) {
      console.error(err);
      alert("Failed to comment");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="mt-4 space-y-4">

      {/* COMMENT LIST */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet</p>
        ) : (
          comments.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {c.user?.avatar ? (
                  <img
                    src={c.user.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(c.user?.name || "U")
                )}
              </div>

              {/* Comment Bubble */}
              <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-gray-800">
                  {c.user?.name || "User"}
                </p>
                <p className="text-sm text-gray-700">{c.text}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD COMMENT */}
      {user && (
        <div className="flex gap-3 items-center mt-2">

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>

          {/* Input */}
          <input
            type="text"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 p-2 rounded-full bg-white/40 border border-white/30 outline-none focus:ring-2 focus:ring-white/50 text-sm"
          />

          {/* Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleComment}
            disabled={loading}
            className="px-4 py-1 rounded-full text-white bg-gradient-to-r from-purple-500 to-indigo-500 text-sm"
          >
            {loading ? "..." : "Send"}
          </motion.button>
        </div>
      )}
    </div>
  );
}