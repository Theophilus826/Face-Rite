import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";

import { API } from "../features/Api";
import callService from "../features/CallService";

export default function ChatHeader({
  users = [],
  chatUserId,
  status,
}) {
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const [chatUser, setChatUser] = useState(null);

  const [calling, setCalling] = useState(false);

  /* ===========================
      LOCAL LOOKUP
  =========================== */

  const selectedUser = useMemo(() => {
    return users.find((u) => u._id === chatUserId);
  }, [users, chatUserId]);

  /* ===========================
      LOAD USER
  =========================== */

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

  /* ===========================
      LIVE STATUS
  =========================== */

  useEffect(() => {
    if (!status) return;

    setChatUser((prev) =>
      prev
        ? {
            ...prev,
            status,
          }
        : prev
    );
  }, [status]);

  /* ===========================
      FORMAT LAST ACTIVE
  =========================== */

  const formatTimeAgo = (date) => {
    if (!date) return "";

    const diff =
      Date.now() - new Date(date).getTime();

    const sec = Math.floor(diff / 1000);

    if (sec < 60) return "just now";

    const min = Math.floor(sec / 60);

    if (min < 60)
      return `${min}m ago`;

    const hr = Math.floor(min / 60);

    if (hr < 24)
      return `${hr}h ago`;

    return new Date(date).toLocaleString();
  };

  /* ===========================
      START CALL
  =========================== */

  const startCall = async (type) => {
    if (!chatUserId) return;

    try {
      setCalling(true);

      await callService.start(
        chatUserId,
        type
      );
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.error ||
          "Unable to start call."
      );
    } finally {
      setCalling(false);
    }
  };

  if (!chatUserId) return null;

  return (
    <div className="bg-white border-b px-5 py-4 flex items-center justify-between">

      {/* ================= LEFT ================= */}

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
          <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            {chatUser?.name?.charAt(0) || "U"}
          </div>
        )}

        <div>

          <h2 className="font-semibold text-base">
            {chatUser?.name || "Loading..."}
          </h2>

          {(status || chatUser?.status) ===
          "online" ? (
            <p className="text-xs text-green-500">
              ● Online
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Last seen{" "}
              {formatTimeAgo(
                chatUser?.lastActive
              )}
            </p>
          )}

        </div>

      </div>

      {/* ================= RIGHT ================= */}

      <div className="flex items-center gap-2">

        <button
          onClick={() =>
            navigate(`/profile/${chatUserId}`)
          }
          className="px-3 py-2 border rounded-lg hover:bg-gray-100 text-sm"
        >
          View Profile
        </button>

        {/* Voice */}

        <button
          disabled={calling}
          onClick={() =>
            startCall("voice")
          }
          className="w-10 h-10 rounded-lg border hover:bg-green-50 hover:border-green-500 flex items-center justify-center disabled:opacity-50"
          title="Voice Call"
        >
          <Phone size={18} />
        </button>

        {/* Video */}

        <button
          disabled={calling}
          onClick={() =>
            startCall("video")
          }
          className="w-10 h-10 rounded-lg border hover:bg-blue-50 hover:border-blue-500 flex items-center justify-center disabled:opacity-50"
          title="Video Call"
        >
          <Video size={18} />
        </button>

        {/* Menu */}

        <button
          className="w-10 h-10 rounded-lg border hover:bg-gray-100 flex items-center justify-center"
        >
          <MoreVertical size={18} />
        </button>

      </div>

    </div>
  );
}