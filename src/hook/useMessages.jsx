import { useState } from "react";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export function useMessages(chatUserId) {
  const [messages, setMessages] = useState([]);

  const sendMessage = async (payload) => {
    try {
      /* ================= NORMALIZE ================= */

      const type = payload?.type || "text";

      /* ================= TEMP MESSAGE ================= */

      const temp = {
        _id: Date.now(),
        fromUser: "me",
        type,
        text: type === "text" ? payload.text : "",
        createdAt: new Date(),
        pending: true,
        /* LOCAL PREVIEW */
        ...(payload.file && {
          file: URL.createObjectURL(payload.file),
        }),
      };

      setMessages((prev) => [...prev, temp]);

      /* ================= FORM DATA ================= */

      const formData = new FormData();

      formData.append(
        "toUserId",
        chatUserId
      );

      formData.append("type", type);

      if (payload.text) {
        formData.append(
          "text",
          payload.text
        );
      }

      if (payload.file) {
        formData.append(
          "file",
          payload.file
        );
      }

      /* ================= API ================= */

      const { data } = await API.post(
        "/chat/messages",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      /* ================= REPLACE TEMP & DEDUPE ================= */

      setMessages((prev) => {
        // replace the optimistic message with the server message
        const replaced = prev.map((msg) => (msg._id === temp._id ? data : msg));

        // dedupe by _id to guard against races with SSE/new_message
        const unique = [];
        const seen = new Set();

        for (const m of replaced) {
          const id = m._id?.toString?.() || m._id;
          if (!seen.has(id)) {
            seen.add(id);
            unique.push(m);
          }
        }

        return unique;
      });
    } catch (err) {
      console.log(err);

      toast.error("Send failed");
    }
  };

  return {
    messages,
    setMessages,
    sendMessage,
  };
}