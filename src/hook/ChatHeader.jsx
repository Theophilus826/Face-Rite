import { useSelector } from "react-redux";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function ChatHeader({ users = [], chatUserId }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const selectedUser = useMemo(
    () => users.find((u) => u._id === chatUserId),
    [users, chatUserId]
  );

  if (!chatUserId) return null;

  return (
    <div className="px-6 py-4 bg-white border-b flex items-center justify-between">
      {/* LEFT: USER INFO */}
      <div className="flex items-center gap-3">
        {selectedUser?.avatar ? (
          <img
            src={selectedUser.avatar}
            alt={selectedUser.name}
            className="w-11 h-11 rounded-full object-cover border"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {selectedUser?.name?.charAt(0)}
          </div>
        )}

        <div>
          <h2 className="font-semibold text-base">
            {selectedUser?.name || "Chat"}
          </h2>

          {/* You can later replace with real online status */}
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-2">
        {/* Profile */}
        <button
          onClick={() => navigate(`/profile/${chatUserId}`)}
          className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-100 transition"
        >
          View Profile
        </button>

        {/* Call placeholder (future feature) */}
        <button className="w-9 h-9 rounded-lg border hover:bg-gray-100 flex items-center justify-center">
          📞
        </button>

        {/* More actions */}
        <button className="w-9 h-9 rounded-lg border hover:bg-gray-100 flex items-center justify-center">
          ⋮
        </button>
      </div>
    </div>
  );
}