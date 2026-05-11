import { useEffect, useRef, useState, useCallback } from "react";
import { API } from "../features/Api";

export default function useGroupSocket({ groupId, user, token, onGroupEvent }) {
  const esRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [connected, setConnected] = useState(false);

  /* ================= LOAD OLD MESSAGES ================= */

  const loadMessages = useCallback(async () => {
    if (!groupId || !token) return;

    try {
      const res = await API.get(`/group/messages/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(
        "LOAD GROUP MESSAGES ERROR:",
        err.response?.data || err.message,
      );
    }
  }, [groupId, token]);

  /* ================= SAFE ADD MESSAGE ================= */

  const addMessage = useCallback((message) => {
    if (!message?._id) return;

    setMessages((prev) => {
      // remove temp message from same sender
      const cleaned = prev.filter((m) => {
        if (!m.pending) return true;

        const sameText = m.text === message.text;

        const tempSender =
          typeof m.fromUser === "object" ? m.fromUser?._id : m.fromUser;

        const realSender =
          typeof message.fromUser === "object"
            ? message.fromUser?._id
            : message.fromUser;

        const sameSender = String(tempSender) === String(realSender);

        return !(sameText && sameSender);
      });

      // avoid duplicates
      const exists = cleaned.some((m) => String(m._id) === String(message._id));

      if (exists) return cleaned;

      return [...cleaned, message];
    });
  }, []);

  /* ================= HANDLE EVENTS ================= */

  const handleEvent = useCallback(
    (data) => {
      switch (data.type) {
        case "connected":
          setConnected(true);
          break;

        case "new_message":
          if (data.message) {
            addMessage(data.message);
          }
          break;

        case "typing":
          setTypingUser(data.fromUser?.name || "Someone");
          break;

        case "stop_typing":
          setTypingUser(null);
          break;

        case "online_members":
          setOnlineMembers(data.members || []);
          break;

        case "group_event":
          onGroupEvent?.(data);
          break;

        case "ping":
          // keep alive
          break;

        default:
          break;
      }
    },
    [onGroupEvent, addMessage],
  );

  /* ================= CONNECT ================= */

  const connect = useCallback(() => {
    if (!groupId || !user || !token) return;

    // close old connection
    if (esRef.current) {
      esRef.current.close();
    }

    const url = `${API.defaults.baseURL}/group/stream/${groupId}?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);

    esRef.current = es;

    es.onopen = () => {
      console.log("✅ Group SSE connected");
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        handleEvent(data);
      } catch (err) {
        console.error("GROUP SSE PARSE ERROR:", err);
      }
    };

    es.onerror = (err) => {
      console.error("❌ GROUP SSE ERROR:", err);

      setConnected(false);

      es.close();

      // auto reconnect
      setTimeout(() => {
        if (esRef.current?.readyState === EventSource.CLOSED) {
          connect();
        }
      }, 3000);
    };
  }, [groupId, user, token, handleEvent]);

  /* ================= DISCONNECT ================= */

  const disconnect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setConnected(false);
  }, []);

  /* ================= INIT ================= */

  useEffect(() => {
    if (!groupId || !token) return;

    loadMessages();
    connect();

    return () => {
      disconnect();
    };
  }, [groupId, token, loadMessages, connect, disconnect]);

  /* ================= RETURN ================= */

  return {
    connected,

    messages,
    setMessages,
    addMessage,

    typingUser,
    onlineMembers,

    reconnect: connect,
    disconnect,
  };
}
