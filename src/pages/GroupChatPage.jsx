import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import GroupHeader from "../hook/GroupHeader";
import GroupAdminPanel from "../hook/ChatAdmin";

import useGroupSocket from "../hook/useGroupSocket";
import { API } from "../features/Api";

export default function GroupChatPage() {
  const { groupId } = useParams();

  const { user } = useSelector((s) => s.auth);

  const token = localStorage.getItem("token");

  /* ================= STATE ================= */
  const [group, setGroup] = useState(null);

  const [loading, setLoading] = useState(true);

  /* ================= LOAD GROUP ================= */
  useEffect(() => {
    const loadGroup = async () => {
      try {
        if (!groupId) return;

        if (!token) {
          console.error("No token found");
          return;
        }

        setLoading(true);

        const res = await API.get(`/group/${groupId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setGroup(res.data.group);
      } catch (err) {
        console.error(
          "Failed to load group:",
          err.response?.data || err.message
        );

        /*
          403 = user not member
          401 = invalid token
        */

        if (err.response?.status === 403) {
          alert("You are not a member of this group");
        }

        if (err.response?.status === 401) {
          alert("Session expired. Please login again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [groupId, token]);

  /* ================= SOCKET ================= */
  const {
    messages,
    setMessages,
    typingUser,
    onlineMembers,
  } = useGroupSocket({
    groupId,
    user,
    token,
  });

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (text) => {
    if (!text?.trim()) return;

    /* TEMP MESSAGE */
    const tempMessage = {
      _id: Date.now().toString(),
      text,
      fromUser: {
        _id: user._id,
        name: user.name,
      },
      pending: true,
      createdAt: new Date().toISOString(),
    };

    /* ADD TEMP */
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await API.post(
        "/group/send-message",
        {
          groupId,
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      /* REPLACE TEMP */
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempMessage._id
            ? res.data.message
            : m
        )
      );
    } catch (err) {
      console.error(
        "Send message failed:",
        err.response?.data || err.message
      );

      /* REMOVE FAILED TEMP */
      setMessages((prev) =>
        prev.filter((m) => m._id !== tempMessage._id)
      );
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Loading group...
        </p>
      </div>
    );
  }

  /* ================= NO GROUP ================= */
  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500">
          Group not found
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* ================= HEADER ================= */}
      <GroupHeader
        group={group}
        onlineMembers={onlineMembers}
        onAddMembers={() => {}}
        onOpenAdmin={() => {}}
      />

      {/* ================= ADMIN PANEL ================= */}
      <GroupAdminPanel groupId={groupId} />

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          userId={user._id}
        />
      </div>

      {/* ================= INPUT ================= */}
      <ChatInput
        onSend={sendMessage}
        typingUser={typingUser}
      />
    </div>
  );
}