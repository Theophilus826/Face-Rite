import { useState } from "react";
import { motion } from "framer-motion";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export default function PostComments({ postId, comments = [], user, onNewComment }) {
  const [commentText, setCommentText] = useState(""); // main comment
  const [replyTexts, setReplyTexts] = useState({}); // track text per reply input
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({}); // which comment's replies are expanded

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase();

  // Handle posting a comment or a reply
  const handleComment = async (parentId = null) => {
    const text = parentId ? replyTexts[parentId] : commentText;
    if (!text?.trim()) return;

    try {
      setLoading(true);
      const res = await API.post(`/post/${postId}/comment`, {
        text: text.trim(),
        parentId,
      });

      onNewComment(res.data.comment);
      toast.success(parentId ? "Reply sent!" : "Comment posted!");

      if (parentId) {
        setReplyTexts((prev) => ({ ...prev, [parentId]: "" }));
      } else {
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to comment");
    } finally {
      setLoading(false);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  return (
    <div className="mt-4 space-y-4">

      {/* COMMENT LIST */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet</p>
        ) : (
          comments.map((c) => {
            const replies = c.replies || [];
            const isExpanded = expandedReplies[c._id];

            return (
              <div key={c._id} className="space-y-2">

                {/* Parent Comment */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {c.user?.avatar ? (
                      <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(c.user?.name || "U")
                    )}
                  </div>
                  <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs font-semibold text-gray-800">{c.user?.name || "User"}</p>
                    <p className="text-sm text-gray-700">{c.text}</p>
                  </div>
                </motion.div>

                {/* REPLIES */}
                {replies.length > 0 && (
                  <div className="pl-10 space-y-1">
                    {(isExpanded ? replies : replies.slice(0, 1)).map((r) => (
                      <motion.div
                        key={r._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {r.user?.avatar ? (
                            <img src={r.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(r.user?.name || "U")
                          )}
                        </div>
                        <div className="bg-white/30 backdrop-blur-md border border-white/30 rounded-xl px-3 py-1 flex-1">
                          <p className="text-xs font-semibold text-gray-800">{r.user?.name || "User"}</p>
                          <p className="text-sm text-gray-700">{r.text}</p>
                        </div>
                      </motion.div>
                    ))}

                    {/* View more toggle */}
                    {replies.length > 1 && !isExpanded && (
                      <button
                        className="text-xs text-blue-500 mt-1"
                        onClick={() => toggleReplies(c._id)}
                      >
                        View {replies.length - 1} more {replies.length - 1 === 1 ? "reply" : "replies"}
                      </button>
                    )}
                  </div>
                )}

                {/* REPLY INPUT */}
                {user && (
                  <div className="flex gap-3 items-center pl-10 mt-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyTexts[c._id] || ""}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [c._id]: e.target.value }))
                      }
                      className="flex-1 p-2 rounded-full bg-white/40 border border-white/30 outline-none focus:ring-2 focus:ring-white/50 text-sm"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleComment(c._id)}
                      disabled={loading}
                      className="px-3 py-1 rounded-full text-white bg-gradient-to-r from-purple-500 to-indigo-500 text-sm"
                    >
                      {loading ? "..." : "Send"}
                    </motion.button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ADD NEW COMMENT */}
      {user && (
        <div className="flex gap-3 items-center mt-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(user?.name)}
          </div>
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 p-2 rounded-full bg-white/40 border border-white/30 outline-none focus:ring-2 focus:ring-white/50 text-sm"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleComment()}
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