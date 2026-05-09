import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import ChatHeader from "../hook/ChatHeader";
import { useMessages } from "../hook/useMessages";
import { useChatSocket } from "../hook/useChatSocket";

export default function ChatPage() {
  const { chatUserId } = useParams();
  const { user } = useSelector((s) => s.auth);

  const { messages, setMessages, sendMessage } = useMessages(chatUserId);

  useChatSocket({
    userId: user?._id,
    chatUserId,
    setMessages,
  });

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <ChatHeader users={users} chatUserId={chatUserId} />

      <MessageList messages={messages} userId={user._id} />

      <ChatInput onSend={sendMessage} />
    </div>
  );
}
