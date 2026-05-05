import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

import GroupChatPage from "./GroupChatPage";

export default function ChatPage() {
  const { chatUserId, groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isGroupChat = Boolean(groupId);

  /* ================= GROUP CHAT MODE ================= */
  if (isGroupChat) {
    return <GroupChatPage />;
  }

  /* ================= DM STATE ================= */
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("offline");

  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selectedUser = users.find((u) => u._id === chatUserId);

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    if (!user) return;

    API.get("/users")
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => toast.error("Failed to load users"));
  }, [user]);

  /* ================= CHAT STREAM ================= */
  useEffect(() => {
    if (!user || !chatUserId) return;

    eventSourceRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/chat/stream/${user._id}/${chatUserId}`
    );

    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.type) {
        case "init":
          setMessages(data.messages || []);
          break;

        case "new_message":
          setMessages((prev) => [...prev, data.message]);
          break;

        case "typing":
          setIsTyping(true);
          break;

        case "stop_typing":
          setIsTyping(false);
          break;

        case "status":
          if (data.userId === chatUserId) {
            setOnlineStatus(data.status);
          }
          break;

        default:
          break;
      }
    };

    return () => es.close();
  }, [user, chatUserId]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!chatText.trim()) return;

    const text = chatText.trim();
    setChatText("");

    const temp = {
      _id: Date.now(),
      fromUser: user._id,
      text,
      type: "text",
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

  if (!user) return <div className="p-4">Login required</div>;

  /* ================= UI ================= */
  return (
    <div className="flex flex-col h-screen bg-transparent">

      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center p-3 border-b">
        <h2 className="font-bold">Chats</h2>

        <button
          onClick={() => navigate("/groups/create")}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          + Create Group
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* USERS LIST */}
        <div className="w-1/3 border-r overflow-y-auto">
          <ul className="divide-y">

            {users.map((u) => (
              <li
                key={u._id}
                onClick={() => navigate(`/chat/${u._id}`)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 ${
                  chatUserId === u._id ? "bg-gray-200" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  {u.name?.charAt(0)}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>

                <span
                  className={`w-2 h-2 rounded-full ${
                    u.status === "online" ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </li>
            ))}

          </ul>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col">

          {/* CHAT HEADER */}
          <div className="p-3 border-b">
            <p className="font-semibold">
              {selectedUser?.name || "Select a user"}
            </p>
            <span className="text-xs text-gray-500">
              {isTyping ? "typing..." : onlineStatus}
            </span>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div key={msg._id} className="text-sm">
                <p className="inline-block px-3 py-2 rounded bg-white/20">
                  {msg.text}
                </p>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="p-3 border-t flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              className="flex-1 border p-2 rounded"
              placeholder="Type message..."
            />

            <button
              onClick={sendMessage}
              className="px-4 bg-blue-500 text-white rounded"
            >
              Send
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}