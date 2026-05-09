import { useEffect, useRef, useState, useCallback } from "react";
import { API } from "../features/Api";

export default function useGroupSocket({
  groupId,
  user,
  token,
  onGroupEvent,
}) {
  const esRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [connected, setConnected] = useState(false);

  /* ================= HANDLE EVENTS ================= */

  const handleEvent = useCallback(
    (data) => {
      switch (data.type) {
        case "connected":
          setConnected(true);
          break;

        case "new_message":
          if (data.message) {
            setMessages((prev) => [...prev, data.message]);
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
    [onGroupEvent]
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
        if (!esRef.current || esRef.current.readyState === 2) {
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

  /* ================= AUTO CONNECT ================= */

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  /* ================= RETURN ================= */

  return {
    connected,

    messages,
    setMessages,

    typingUser,
    onlineMembers,

    reconnect: connect,
    disconnect,
  };
}