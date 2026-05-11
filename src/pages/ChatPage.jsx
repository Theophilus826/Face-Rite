import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";

import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import ChatHeader from "../hook/ChatHeader";

import { useMessages } from "../hook/useMessages";
import { useChatSocket } from "../hook/useChatSocket";

export default function ChatPage() {
  const { chatUserId } = useParams();

  const { user } = useSelector((s) => s.auth);

  /* ================= CHAT ================= */
  const { messages, setMessages, sendMessage } = useMessages(chatUserId);

  /* ================= SOCKET ================= */
  useChatSocket({
    userId: user?._id,
    chatUserId,
    setMessages: (updater) => {
      /*
        Prevent duplicate messages
      */
      setMessages((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;

        const unique = [];

        const ids = new Set();

        for (const msg of next) {
          if (!ids.has(msg._id)) {
            ids.add(msg._id);
            unique.push(msg);
          }
        }

        return unique;
      });
    },
  });

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    const container = document.getElementById("chat-scroll");

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  /* ================= EMPTY STATE ================= */
  if (!chatUserId) {
    return (
      <div className="h-screen flex items-center justify-center bg-transparent">
        <p className="text-gray-500">Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* ================= HEADER ================= */}
      <ChatHeader chatUserId={chatUserId} />

      {/* ================= MESSAGES ================= */}
      <div
        id="chat-scroll"
        className="flex-1 overflow-y-auto bg-transparent px-2 pb-2"
      >
        <MessageList messages={messages} userId={user?._id} />
      </div>

      {/* ================= INPUT (FIXED ABOVE BOTTOM NAV) ================= */}
      <div className="fixed bottom-[70px] left-0 right-0 z-50 bg-transparent">
        <ChatInput onSend={sendMessage} typingUser={typingUser} />
      </div>
    </div>
  );
}
