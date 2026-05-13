import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";

import GroupAdminModal from "../hook/GroupAdminModal";
import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import GroupHeader from "../hook/GroupHeader";

import useGroupSocket from "../hook/useGroupSocket";
import { API } from "../features/Api";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const { user } = useSelector((s) => s.auth);
  const token = localStorage.getItem("token");

  /* ================= STATE ================= */

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);

  /* ================= LOAD GROUP ================= */

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(`/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGroup(res.data.group);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;

      if (status === 401) {
        navigate("/login");
        return;
      }

      if (status === 403) {
        setError("You are not allowed to access this group");
        return;
      }

      setError(msg || "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [groupId, token, navigate]);

  useEffect(() => {
    if (groupId && token) fetchGroup();
  }, [groupId, token, fetchGroup]);

  /* ================= SOCKET ================= */

  const {
    messages,
    setMessages,
    addMessage,
    typingUser,
    onlineMembers,
  } = useGroupSocket({
    groupId,
    user,
    token,
  });

  /* ================= TEXT MESSAGE ================= */

  const sendTextMessage = async (text) => {
    const tempId = Date.now().toString();

    const tempMessage = {
      _id: tempId,
      type: "text",
      text,
      fromUser: {
        _id: user._id,
        name: user.name,
      },
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await API.post(
        "/group/send-message",
        { groupId, text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId ? res.data.message : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.filter((m) => m._id !== tempId)
      );
    }
  };

  /* ================= MEDIA MESSAGE ================= */

  const sendMediaMessage = async (file, type) => {
    const formData = new FormData();
    formData.append("groupId", groupId);
    formData.append(type, file);

    try {
      const res = await API.post(
        "/group/send-message",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      addMessage(res.data.message);
    } catch (err) {
      console.error(`${type} send failed`, err.response?.data || err.message);
    }
  };

  /* ================= MESSAGE ROUTER ================= */

  const sendMessage = async (payload) => {
    if (!payload || !user) return;

    if (payload.type === "text") {
      const text = payload.content?.trim();
      if (!text) return;
      return sendTextMessage(text);
    }

    if (payload.type === "image") {
      return sendMediaMessage(payload.file, "image");
    }

    if (payload.type === "audio") {
      return sendMediaMessage(payload.file, "audio");
    }
  };

  /* ================= ADMIN REFRESH ================= */

  const refreshGroup = async () => {
    await fetchGroup();
  };

  /* ================= LOADING UI ================= */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading group...</p>
      </div>
    );
  }

  /* ================= ERROR UI ================= */

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-3">
        <p className="text-red-500">{error}</p>

        <button
          onClick={() => navigate("/groups")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  /* ================= EMPTY STATE ================= */

  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <div className="h-screen flex flex-col">

      {/* HEADER */}
      <GroupHeader
        group={group}
        onlineMembers={onlineMembers}
        onAddMembers={() => setAdminOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {/* ADMIN PANEL */}
      <GroupAdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        group={group}
        token={token}
        onUpdated={refreshGroup}
      />

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          userId={user?._id}
        />
      </div>

      {/* INPUT */}
      <div className="sticky bottom-0 z-30">
        <ChatInput
          onSend={sendMessage}
          typingUser={typingUser}
        />
      </div>

    </div>
  );
}