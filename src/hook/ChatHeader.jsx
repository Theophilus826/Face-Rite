import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { API } from "../features/Api";
import CallButton from "../component/CallButton";

export default function ChatHeader({ users = [], chatUserId, status }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [chatUser, setChatUser] = useState(null);

  /* ================= LOCAL USER LOOKUP ================= */
  const selectedUser = useMemo(
    () => users.find((u) => u._id === chatUserId),
    [users, chatUserId],
  );

  /* ================= FETCH USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (selectedUser) {
          setChatUser(selectedUser);
          return;
        }

        if (!chatUserId) return;

        const res = await API.get(`/users/${chatUserId}`);

        setChatUser(res.data.user);
      } catch (err) {
        console.error(err);
      }
    };

    loadUser();
  }, [chatUserId, selectedUser]);

  useEffect(() => {
    if (!status) return;
    setChatUser((prev) =>
      prev ? { ...prev, status } : prev
    );
  }, [status]);

  if (!chatUserId) return null;

  const formatTimeAgo = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const diff = Date.now() - d.getTime();

    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "just now";

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;

    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;

    return d.toLocaleString();
  };

  return (
    <div className="px-6 py-4 bg-white border-b flex items-center justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/home");
            }
          }}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>

        {chatUser?.avatar ? (
          <img
            src={chatUser.avatar}
            alt={chatUser.name}
            className="w-11 h-11 rounded-full object-cover border"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {chatUser?.name?.charAt(0) || "U"}
          </div>
        )}

        <div>
          <h2 className="font-semibold text-base">
            {chatUser?.name || "Loading..."}
          </h2>

          {(status || chatUser?.status) === "online" ? (
            <p className="text-xs text-green-500">Online</p>
          ) : (
            <p className="text-xs text-gray-500">Last seen {formatTimeAgo(chatUser?.lastActive)}</p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`/profile/${chatUserId}`)}
          className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-100 transition"
        >
          View Profile
        </button>

        <CallButton userId={chatUserId} />

        <button className="w-9 h-9 rounded-lg border hover:bg-gray-100 flex items-center justify-center">
          ⋮
        </button>
      </div>
    </div>
  );
}
