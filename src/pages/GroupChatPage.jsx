import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import GroupHeader from "../hook/GroupHeader";
import GroupAdminPanel from "../hook/ChatAdmin";

import { useGroupSocket } from "../hook/useGroupSocket";
import { useMessages } from "../hook/useMessages";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const { user } = useSelector((s) => s.auth);

  const { messages, setMessages, sendMessage } = useMessages(groupId);

  useGroupSocket({
    groupId,
    userId: user._id,
    setMessages,
  });

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <GroupHeader groupId={groupId} />

      <GroupAdminPanel groupId={groupId} />

      <MessageList messages={messages} userId={user._id} />

      <ChatInput onSend={sendMessage} />
    </div>
  );
}