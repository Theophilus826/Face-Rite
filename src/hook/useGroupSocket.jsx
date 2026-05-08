import { useEffect, useRef, useState, useCallback } from "react";
import { API } from "../features/Api";

export default function useGroupSocket({ groupId, user, token }) {
  const esRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);

  const handleEvent = useCallback((data, handlers = {}) => {
    switch (data.type) {
      case "new_message":
        setMessages((prev) => [...prev, data.message]);
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
        handlers.onGroupEvent?.(data);
        break;

      default:
        break;
    }
  }, []);

  const connect = useCallback(
    (handlers = {}) => {
      if (!groupId || !user) return;

      esRef.current?.close();

      const url = `${API.defaults.baseURL}/group/stream/${groupId}/${user._id}?token=${encodeURIComponent(token)}`;

      const es = new EventSource(url);

      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent(data, handlers);
        } catch (err) {
          console.error("Group socket error:", err);
        }
      };

      es.onerror = () => {
        console.error("Group SSE disconnected");
      };
    },
    [groupId, user, token, handleEvent]
  );

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    messages,
    setMessages,
    typingUser,
    onlineMembers,
    connect,
    disconnect,
  };
}