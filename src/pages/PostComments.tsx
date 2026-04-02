import { useState } from "react";
import { motion } from "framer-motion";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export type CommentType = {
  _id: string;
  text: string;
  user?: {
    name?: string;
    avatar?: string;
  };
  replies?: CommentType[];
};

type User = {
  id: string;
  name: string;
  avatar?: string;
  token?: string;
};

type PostCommentsProps = {
  postId: string;
  comments?: CommentType[];
  user: User | null;
  onNewComment: (comment: CommentType) => void;
};

export default function PostComments({
  postId,
  comments = [],
  user,
  onNewComment,
}: PostCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const getInitials = (name?: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";

  // =========================
  // ADD COMMENT / REPLY
  // =========================
  const handleComment = async (parentId: string | null = null) => {
    const text = parentId ? replyTexts[parentId] : commentText;
    if (!text?.trim()) return;

    try {
      setLoading(true);

      const res = await API.post(`/post/${postId}/comment`, {
        text: text.trim(),
        parentId,
      });

      if (!res?.data?.comment) {
        throw new Error("Invalid response");
      }

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

  // =========================
  // TOGGLE REPLIES
  // =========================
  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div className="mt-4 space-y-4">
      {/* COMMENTS */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet</p>
        ) : (
          comments.map((comment) => {
            const replies = Array.isArray(comment.replies) ? comment.replies : [];
            const isExpanded = expandedReplies[comment._id];

            return (
              <div key={comment._id} className="space-y-2">
                {/* MAIN COMMENT */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {comment.user?.avatar ? (
                      <img src={comment.user.avatar} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(comment.user?.name)
                    )}
                  </div>

                  <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs font-semibold text-gray-800">
                      {comment.user?.name || "User"}
                    </p>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                </motion.div>

                {/* REPLIES */}
                {replies.length > 0 && (
                  <div className="pl-10 space-y-1">
                    {(isExpanded ? replies : replies.slice(0, 1)).map((reply) => (
                      <motion.div
                        key={reply._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {reply.user?.avatar ? (
                            <img src={reply.user.avatar} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(reply.user?.name)
                          )}
                        </div>

                        <div className="bg-white/30 backdrop-blur-md border border-white/30 rounded-xl px-3 py-1 flex-1">
                          <p className="text-xs font-semibold text-gray-800">
                            {reply.user?.name || "User"}
                          </p>
                          <p className="text-sm text-gray-700">{reply.text}</p>
                        </div>
                      </motion.div>
                    ))}

                    {replies.length > 1 && !isExpanded && (
                      <button
                        className="text-xs text-blue-500 mt-1"
                        onClick={() => toggleReplies(comment._id)}
                      >
                        View {replies.length - 1} more{" "}
                        {replies.length - 1 === 1 ? "reply" : "replies"}
                      </button>
                    )}
                  </div>
                )}

                {/* REPLY INPUT */}
                {user && (
                  <div className="flex gap-3 items-center pl-10 mt-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyTexts[comment._id] || ""}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({
                          ...prev,
                          [comment._id]: e.target.value,
                        }))
                      }
                      className="flex-1 p-2 rounded-full bg-white/40 border border-white/30 outline-none text-sm"
                    />

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleComment(comment._id)}
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

      {/* ADD COMMENT */}
      {user && (
        <div className="flex gap-3 items-center mt-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.name)
            )}
          </div>

          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 p-2 rounded-full bg-white/40 border border-white/30 outline-none text-sm"
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