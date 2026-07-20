import { useEffect, useRef } from "react";
import { API } from "../features/Api";

export function useChatSocket({
  userId,
  chatUserId,
  setMessages,
  onStatus,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!userId || !chatUserId) return;

    // close old connection
    if (ref.current) {
      ref.current.close();
    }

    const base =
      API.defaults.baseURL?.replace(/\/$/, "");

    const url =
      `${base}/chat/stream/` +
      `${userId}/${chatUserId}`;

    const es = new EventSource(url);

    ref.current = es;

    /* ================= CONNECTED ================= */

    es.onopen = () => {
      
    };

    /* ================= MESSAGE ================= */

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        /* ================= INIT ================= */

        if (data.type === "init") {
          setMessages((prev) => {
            // merge init messages with any pending optimistic messages
            const serverMessages = data.messages || [];
            const pendingMessages = prev.filter(m => m.pending);
            
            // combine and remove duplicates
            const combined = [...serverMessages, ...pendingMessages];
            const unique = [];
            const seen = new Set();
            
            for (const msg of combined) {
              const id = msg._id?.toString?.() || msg._id;
              if (!seen.has(id)) {
                seen.add(id);
                unique.push(msg);
              }
            }
            
            return unique;
          });
          return;
        }

        /* ================= NEW MESSAGE ================= */

        if (data.type === "new_message") {
          setMessages((prev) => {
            // prevent duplicates
            const exists = prev.some(
              (m) => m._id === data.message?._id
            );

            if (exists) return prev;

            return [...prev, data.message];
          });

          return;
        }

        /* ================= MESSAGE UPDATED ================= */

        if (data.type === "message_updated") {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === data.message?._id
                ? data.message
                : m
            )
          );

          return;
        }

        /* ================= MESSAGE DELETED ================= */

        if (data.type === "message_deleted") {
          setMessages((prev) =>
            prev.filter(
              (m) => m._id !== data.messageId
            )
          );
          return;
        }

        if (data.type === "status") {
          onStatus?.(data.status, data.userId);
          return;
        }
      } catch (err) {
        console.error(
          "CHAT SSE PARSE ERROR:",
          err
        );
      }
    };

    /* ================= ERROR ================= */

    es.onerror = (err) => {
      console.error(
        "CHAT SSE ERROR:",
        err
      );
    };

    /* ================= CLEANUP ================= */

    return () => {
      console.log("CHAT SSE CLOSED");

      es.close();

      if (ref.current === es) {
        ref.current = null;
      }
    };
  }, [userId, chatUserId]);
}