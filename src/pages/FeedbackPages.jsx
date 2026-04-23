import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFeedbacks, deleteFeedback } from "../features/FeedbackSlice";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function FeedbackPages() {
  const dispatch = useDispatch();
  const { feedbacks, isLoading } = useSelector((state) => state.feedbacks);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getFeedbacks());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?"))
      return;
    try {
      await dispatch(deleteFeedback(id)).unwrap();
      toast.success("Feedback deleted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete feedback");
    }
  };

  if (isLoading) return <p className="text-center">Loading feedbacks...</p>;

  // Filter feedbacks to show only those created by the logged-in user
  const userFeedbacks = (Array.isArray(feedbacks) ? feedbacks : []).filter(
    (fb) => fb.user?._id === user?._id,
  );

  if (userFeedbacks.length === 0) {
    return (
      <p className="text-center">You have not created any feedback yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {userFeedbacks.map((fb) => (
        <div key={fb._id} className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-bold mb-1">{fb.subject}</h3>
          <p className="text-gray-600 mb-2">{fb.message}</p>
          <p className="text-sm text-gray-500 mb-2">Category: {fb.category}</p>
          <p className="text-sm mb-2">
            Status:{" "}
            <span
              className={`capitalize font-semibold ${fb.status === "open" ? "text-green-600" : fb.status === "pending" ? "text-yellow-600" : "text-red-600"}`}
            >
              {fb.status}
            </span>
          </p>

          <div className="flex gap-2">
            <Link
              to={`/feedback/${fb._id}`}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View
            </Link>

            {/* Admin-only buttons */}
            {user?.role === "admin" && (
              <>
                <Link
                  to={`/edit-feedback/${fb._id}`}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(fb._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
