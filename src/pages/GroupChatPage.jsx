import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import GroupAdminModal from "../hook/GroupAdminModal";
import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import GroupHeader from "../hook/GroupHeader";
import GroupAdminPanel from "../hook/ChatAdmin";
import useGroupSocket from "../hook/useGroupSocket";
import { API } from "../features/Api";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const { user } = useSelector((s) => s.auth);
  const token = localStorage.getItem("token");

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  /* ================= LOAD GROUP ================= */
  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(`/group/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGroup(res.data.group);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load group";
      setError(msg);

      console.error("Group load error:", err.response?.data || err.message);

      // handle forbidden properly
      if (err.response?.status === 403) {
        setError("You are not a member of this group");
      }

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, token, navigate]);

  useEffect(() => {
    if (groupId && token) {
      loadGroup();
    }
  }, [groupId, token, loadGroup]);

  /* ================= SOCKET ================= */
  const { messages, setMessages, addMessage, typingUser, onlineMembers } =
    useGroupSocket({
      groupId,
      user,
      token,
    });

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (text) => {
    if (!text?.trim() || !user) return;

    const tempId = Date.now().toString();

    const tempMessage = {
      _id: tempId,
      text,
      fromUser: {
        _id: user._id,
        name: user.name,
      },
      pending: true,
      createdAt: new Date().toISOString(),
    };

    // optimistic UI
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await API.post(
        "/group/send-message",
        { groupId, text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // ✅ SAFE ADD
      addMessage(res.data.message);
    } catch (err) {
      console.error("Send failed:", err.response?.data || err.message);

      // remove failed temp message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
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
      <div className="h-screen flex items-center justify-center flex-col gap-2">
        <p className="text-red-500">{error}</p>

        {error.includes("not a member") && (
          <button
            onClick={() => navigate("/groups")}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <GroupHeader
        group={group}
        onlineMembers={onlineMembers}
        onAddMembers={() => {}}
        onOpenAdmin={() => {}}
      />

      {/* ADMIN */}
      <GroupAdminPanel groupId={groupId} />

      <GroupAdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        group={group}
        token={token}
        onUpdated={loadGroup}
      />
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} userId={user?._id} />
      </div>

      {/* INPUT */}
      <ChatInput onSend={sendMessage} typingUser={typingUser} />
    </div>
  );
}
