import { useEffect, useRef, useState } from "react";
import { API } from "../features/Api";

export default function useGroupSocket({
  groupId,
  user,
  token,
}) {
  const eventRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);

  /* ================= ADD MESSAGE ================= */

  const addMessage = (message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m._id === message._id);

      if (exists) return prev;

      return [...prev, message];
    });
  };

  /* ================= SSE ================= */

  useEffect(() => {
    if (!groupId || !token) return;

    // close old stream
    if (eventRef.current) {
      eventRef.current.close();
    }

    const baseURL = API.defaults.baseURL;

    // IMPORTANT: token passed in query
    const streamURL =
      `${baseURL}/group/stream/${groupId}?token=${token}`;

    const es = new EventSource(streamURL);

    eventRef.current = es;

    es.onopen = () => {
      console.log("✅ GROUP SSE CONNECTED");
    };

    es.onerror = (err) => {
      console.error("❌ GROUP SSE ERROR:", err);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log("SSE EVENT:", data);

        /* ================= INITIAL ================= */

        if (data.type === "init") {
          setMessages(data.messages || []);
        }

        /* ================= NEW MESSAGE ================= */

        if (
          data.type === "new_message" ||
          data.type === "group_message"
        ) {
          addMessage(data.message);
        }

        /* ================= TYPING ================= */

        if (data.type === "typing") {
          setTypingUser(data.user);

          setTimeout(() => {
            setTypingUser(null);
          }, 2000);
        }

        /* ================= ONLINE ================= */

        if (data.type === "online_members") {
          setOnlineMembers(data.members || []);
        }

        /* ================= GROUP EVENTS ================= */

        if (data.type === "group_event") {
          console.log("GROUP EVENT:", data);
        }

        if (data.type === "group_message_deleted") {
          setMessages((prev) =>
            prev.filter((m) => m._id !== data.messageId),
          );
        }
      } catch (err) {
        console.error("SSE PARSE ERROR:", err);
      }
    };

    return () => {
      es.close();
    };
  }, [groupId, token]);

  return {
    messages,
    setMessages,
    addMessage,
    typingUser,
    onlineMembers,
  };
}