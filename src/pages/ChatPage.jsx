import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import ChatHeader from "../hook/ChatHeader";

import { useMessages } from "../hook/useMessages";
import { useChatSocket } from "../hook/useChatSocket";

import { API } from "../features/Api";

export default function ChatPage() {
  const { chatUserId } = useParams();

  const { user } = useSelector((s) => s.auth);

  /* ================= LOCAL STATE ================= */
  const [typingUser, setTypingUser] = useState(null);

  /* ================= CHAT ================= */
  const { messages, setMessages } = useMessages(chatUserId);

  /* ================= SOCKET ================= */
  useChatSocket({
    userId: user?._id,
    chatUserId,

    setMessages: (updater) => {
      setMessages((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;

        // ✅ remove duplicates
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

    setTypingUser,
  });

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (payload) => {
    if (!payload || !user || !chatUserId) return;

    /* ================= TEXT ================= */
    if (payload.type === "text") {
      const text = payload.content?.trim();

      if (!text) return;

      const tempId = Date.now().toString();

      const tempMessage = {
        _id: tempId,
        text,
        type: "text",

        fromUser: {
          _id: user._id,
          name: user.name,
        },

        toUser: chatUserId,

        pending: true,

        createdAt: new Date().toISOString(),
      };

      // optimistic UI
      setMessages((prev) => [...prev, tempMessage]);

      try {
        const res = await API.post("/chat/messages", {
          toUserId: chatUserId,
          text,
        });

        // replace temp message
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.data.message : m)),
        );
      } catch (err) {
        console.error("Text send failed:", err.response?.data || err.message);

        // remove failed message
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    }

    /* ================= IMAGE ================= */
    if (payload.type === "image") {
      const formData = new FormData();

      formData.append("image", payload.file);
      formData.append("toUserId", chatUserId);

      const tempId = Date.now().toString();

      const tempMessage = {
        _id: tempId,

        type: "image",

        image: URL.createObjectURL(payload.file),

        fromUser: {
          _id: user._id,
          name: user.name,
        },

        pending: true,

        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);

      try {
        const res = await API.post("/chat/messages/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.data.message : m)),
        );
      } catch (err) {
        console.error("Image send failed:", err.response?.data || err.message);

        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    }

    /* ================= AUDIO ================= */
    if (payload.type === "audio") {
      const formData = new FormData();

      formData.append("audio", payload.file);
      formData.append("toUserId", chatUserId);

      const tempId = Date.now().toString();

      const tempMessage = {
        _id: tempId,

        type: "voice",

        audio: URL.createObjectURL(payload.file),

        fromUser: {
          _id: user._id,
          name: user.name,
        },

        pending: true,

        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);

      try {
        const res = await API.post("/chat/messages/voice", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.data.message : m)),
        );
      } catch (err) {
        console.error("Voice send failed:", err.response?.data || err.message);

        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    }
  };

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

        {/* typing */}
        {typingUser && (
          <p className="text-xs text-gray-400 px-3 pb-2">
            {typingUser} is typing...
          </p>
        )}
      </div>

      {/* ================= INPUT ================= */}
      <div className="sticky bottom-0 w-full z-50 bg-transparent pb-[30px]">
        <ChatInput onSend={sendMessage} typingUser={typingUser} />
      </div>
    </div>
  );
}
