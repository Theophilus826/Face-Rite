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
  const [loading, setLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const getInitials = (name?: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  // Only show the first comment initially
  const visibleComments = showAllComments ? comments : comments.slice(0, 1);

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      setLoading(true);

      const res = await API.post(`/post/${postId}/comment`, {
        text: commentText.trim(),
      });

      const newComment = res?.data?.comment || res?.data?.data || res?.data;

      if (!newComment || !newComment._id) {
        throw new Error("Invalid response");
      }

      onNewComment(newComment);
      toast.success("Comment posted!");
      setCommentText("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* COMMENTS */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet</p>
        ) : (
          <>
            {visibleComments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {comment.user?.avatar ? (
                    <img
                      src={comment.user.avatar}
                      className="w-full h-full object-cover"
                    />
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
            ))}

            {/* VIEW MORE / HIDE COMMENTS */}
            {comments.length > 1 && !showAllComments && (
              <button
                className="text-sm text-blue-500 mt-2"
                onClick={() => setShowAllComments(true)}
              >
                View {comments.length - 1} more{" "}
                {comments.length - 1 === 1 ? "comment" : "comments"}
              </button>
            )}
            {comments.length > 1 && showAllComments && (
              <button
                className="text-sm text-gray-500 mt-2"
                onClick={() => setShowAllComments(false)}
              >
                Hide comments
              </button>
            )}
          </>
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
