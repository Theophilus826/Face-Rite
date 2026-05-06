import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);

  /* USERS (FOR ADD MEMBERS) */
  const [users, setUsers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const esRef = useRef(null);
  const bottomRef = useRef(null);

  /* ================= FETCH GROUP ================= */
  useEffect(() => {
    if (!groupId) return;

    API.get(`/group/${groupId}`)
      .then((res) => setGroup(res.data.group))
      .catch(() => toast.error("Failed to load group"));
  }, [groupId]);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    if (!showAddMembers) return;

    API.get("/users")
      .then((res) => setUsers(res.data.users || []))
      .catch(() => toast.error("Failed to load users"));
  }, [showAddMembers]);

  /* ================= SSE ================= */
  useEffect(() => {
    if (!user || !groupId) return;

    esRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/group/stream/${groupId}/${user._id}`
    );

    esRef.current = es;

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
          setTypingUser(data.fromUser?.name || "Someone");
          break;

        case "stop_typing":
          setTypingUser(null);
          break;

        case "online_members":
          setOnlineMembers(data.members || []);
          break;

        default:
          break;
      }
    };

    return () => es.close();
  }, [user, groupId]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const temp = {
      _id: Date.now(),
      fromUser: { _id: user._id, name: user.name },
      text,
    };

    setMessages((prev) => [...prev, temp]);
    setText("");

    try {
      await API.post("/group/send-message", { groupId, text });
    } catch {
      toast.error("Failed to send");
    }
  };

  /* ================= ADD MEMBERS ================= */
  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x._id === u._id)
        ? prev.filter((x) => x._id !== u._id)
        : [...prev, u]
    );
  };

  const addMembers = async () => {
    if (!selectedUsers.length) {
      return toast.error("Select users first");
    }

    try {
      await API.post(`/group/${groupId}/members`, {
        members: selectedUsers.map((u) => u._id),
      });

      toast.success("Members added");

      setShowAddMembers(false);
      setSelectedUsers([]);
    } catch {
      toast.error("Failed to add members");
    }
  };

  if (!group) return <div className="p-4">Loading group...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* HEADER */}
      <div className="p-3 bg-white border-b flex justify-between items-center">
        <div>
          <h2 className="font-semibold">{group.name}</h2>
          <p className="text-xs text-gray-500">
            {group.members?.length} members • {onlineMembers.length} online
          </p>
        </div>

        <button
          onClick={() => setShowAddMembers(true)}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          + Add Members
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.fromUser?._id === user._id;

          return (
            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`px-3 py-2 rounded max-w-xs text-sm ${
                isMe ? "bg-blue-500 text-white" : "bg-white border"
              }`}>
                {!isMe && (
                  <p className="text-xs font-semibold">{msg.fromUser?.name}</p>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}

        {typingUser && (
          <p className="text-xs text-gray-500">{typingUser} is typing...</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t flex gap-2 bg-white">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type message..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>

      {/* ADD MEMBERS MODAL */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-96 p-4 rounded space-y-3">

            <h3 className="font-semibold">Add Members</h3>

            <div className="max-h-60 overflow-y-auto border rounded">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedUsers.some((s) => s._id === u._id)}
                  />
                  <span>{u.name}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddMembers(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={addMembers}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}