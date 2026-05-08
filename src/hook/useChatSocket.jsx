import { useEffect, useRef } from "react";
import { API } from "../features/Api";

export function useChatSocket({ userId, chatUserId, setMessages }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!userId || !chatUserId) return;

    ref.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/chat/stream/${userId}/${chatUserId}`
    );

    ref.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "init") {
        setMessages(data.messages || []);
      }

      if (data.type === "new_message") {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    return () => es.close();
  }, [userId, chatUserId]);
}