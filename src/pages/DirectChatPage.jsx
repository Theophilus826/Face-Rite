import { useSelector } from "react-redux";
import { useMessages } from "../hooks/useMessages";
import { useChatSocket } from "../hooks/useChatSocket";

import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import ChatHeader from "../components/chat/ChatHeader";

export default function DirectChatPage({ chatUserId }) {
  const { user } = useSelector((s) => s.auth);

  const {
    messages,
    setMessages,
    sendMessage,
  } = useMessages(chatUserId);

  useChatSocket({
    userId: user?._id,
    chatUserId,
    setMessages,
  });

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <ChatHeader chatUserId={chatUserId} />

      <MessageList
        messages={messages}
        userId={user?._id}
      />

      <ChatInput onSend={sendMessage} />
    </div>
  );
}