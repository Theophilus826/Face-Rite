import { useState } from "react";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export function useMessages(chatUserId) {
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text) => {
    const temp = {
      _id: Date.now(),
      fromUser: "me",
      text,
    };

    setMessages((prev) => [...prev, temp]);

    try {
      await API.post("/chat/messages", {
        toUserId: chatUserId,
        text,
      });
    } catch {
      toast.error("Send failed");
    }
  };

  return { messages, setMessages, sendMessage };
}