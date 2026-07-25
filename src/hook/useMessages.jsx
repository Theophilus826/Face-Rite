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

        text:
          type === "text"
            ? payload.text
            : "",

        createdAt: new Date(),

        /* LOCAL PREVIEW */

        ...(payload.file && {
          file: URL.createObjectURL(
            payload.file
          ),
        }),
      };

      setMessages((prev) => [
        ...prev,
        temp,
      ]);

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

      /* ================= REPLACE TEMP ================= */

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === temp._id
            ? data
            : msg
        )
      );
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