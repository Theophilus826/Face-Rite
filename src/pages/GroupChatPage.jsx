import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

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

  /* ================= SOCKET (SOURCE OF TRUTH) ================= */
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

    const temp = {
      _id: Date.now(),
      text,
      fromUser: user,
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);

    try {
      await API.post("/group/send-message", {
        groupId,
        text,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <GroupHeader
        group={null} // replace later with real group fetch
        onlineMembers={onlineMembers}
        onAddMembers={() => {}}
        onOpenAdmin={() => {}}
      />

      {/* ADMIN PANEL */}
      <GroupAdminPanel groupId={groupId} />

      {/* MESSAGES */}
      <MessageList messages={messages} userId={user._id} />

      {/* INPUT */}
      <ChatInput onSend={sendMessage} typingUser={typingUser} />
    </div>
  );
}