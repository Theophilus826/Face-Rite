import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";
import { Send, Users, UserPlus, Crown, Shield, Trash2, LogOut } from "lucide-react";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { user } = useSelector((state) => state.auth);

  /* ================= STATE ================= */
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionUser, setActionUser] = useState(null);

  const esRef = useRef(null);
  const bottomRef = useRef(null);

  /* ================= HELPERS ================= */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const isSelectedUser = useCallback(
    (id) => selectedUsers.some((u) => u._id === id),
    [selectedUsers]
  );

  const myMember = useMemo(() => {
    if (!group || !user) return null;
    return group.members?.find((m) => m.user?._id === user._id);
  }, [group, user]);

  const myRole = myMember?.role;

  const isAdmin = myRole === "admin";
  const isModerator = myRole === "moderator";

  const canManage = isAdmin || isModerator;

  /* ================= FETCH GROUP ================= */
  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/group/${groupId}`);
      setGroup(res.data.group);
    } catch (err) {
      toast.error("Failed to load group");
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate]);

  /* ================= FETCH MESSAGES ================= */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await API.get(`/group/${groupId}/messages`);
      setMessages(res.data.messages || []);
    } catch {
      toast.error("Failed to load messages");
    }
  }, [groupId]);

  /* ================= LOAD USERS ================= */
  const loadUsers = useCallback(async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data.users || []);
    } catch {
      toast.error("Failed to load users");
    }
  }, []);

  useEffect(() => {
    if (!groupId) return;
    fetchGroup();
    fetchMessages();
  }, [groupId]);

  useEffect(() => {
    if (showAddMembers) loadUsers();
  }, [showAddMembers]);

  /* ================= SSE ================= */
  useEffect(() => {
    if (!user || !groupId) return;

    esRef.current?.close();

    const es = new EventSource(
      `${API.defaults.baseURL}/group/stream/${groupId}/${user._id}?token=${encodeURIComponent(token)}`
    );

    esRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "new_message":
          setMessages((p) => [...p, data.message]);
          break;

        case "typing":
          setTypingUser(data.fromUser?.name);
          break;

        case "stop_typing":
          setTypingUser(null);
          break;

        case "group_event":
          handleGroupEvent(data);
          break;

        default:
          break;
      }
    };

    return () => es.close();
  }, [groupId, user]);

  const handleGroupEvent = (data) => {
    if (data.event === "member_removed") {
      toast.info("Member removed");
      fetchGroup();
    }

    if (data.event === "group_deleted") {
      toast.info("Group deleted");
      navigate("/groups");
    }
  };

  useEffect(() => scrollToBottom(), [messages]);

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const temp = {
      _id: Date.now(),
      text,
      fromUser: { _id: user._id, name: user.name },
      pending: true,
    };

    setMessages((p) => [...p, temp]);
    const msg = text;
    setText("");

    try {
      const res = await API.post("/group/send-message", {
        groupId,
        text: msg,
      });

      setMessages((p) =>
        p.map((m) => (m._id === temp._id ? res.data.message : m))
      );
    } catch {
      toast.error("Failed to send message");
    }
  };

  /* ================= ADMIN ACTIONS ================= */

  const changeRole = async (memberId, role) => {
    try {
      await API.patch(`/group/${groupId}/members/${memberId}/role`, {
        role,
      });
      toast.success("Role updated");
      fetchGroup();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await API.delete(`/group/${groupId}/members/${memberId}`);
      toast.success("Member removed");
      fetchGroup();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const leaveGroup = async () => {
    try {
      await API.delete(`/group/${groupId}/members/me`);
      toast.success("Left group");
      navigate("/groups");
    } catch {
      toast.error("Failed to leave group");
    }
  };

  const deleteGroup = async () => {
    try {
      await API.delete(`/group/${groupId}`);
      toast.success("Group deleted");
      navigate("/groups");
    } catch {
      toast.error("Failed to delete group");
    }
  };

  /* ================= FILTER USERS ================= */
  const availableUsers = useMemo(() => {
    if (!group) return [];

    return users.filter(
      (u) => !group.members?.some((m) => m.user?._id === u._id)
    );
  }, [users, group]);

  /* ================= UI ================= */

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* ================= HEADER ================= */}
      <header className="bg-white border-b px-4 py-3 flex justify-between">
        <div>
          <h1 className="font-semibold text-lg">{group.name}</h1>

          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Users size={14} />
            {group.members?.length} members
          </p>
        </div>

        <div className="flex gap-2">

          {canManage && (
            <button
              onClick={() => setShowAddMembers(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              Add Members
            </button>
          )}

          <button
            onClick={leaveGroup}
            className="bg-gray-200 px-3 py-2 rounded"
          >
            Leave
          </button>

          {isAdmin && (
            <button
              onClick={deleteGroup}
              className="bg-red-600 text-white px-3 py-2 rounded"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      {/* ================= MESSAGES ================= */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">

        {messages.map((msg) => {
          const isMe = msg.fromUser?._id === user._id;

          const sender = group.members?.find(
            (m) => m.user?._id === msg.fromUser?._id
          );

          return (
            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="bg-white px-3 py-2 rounded shadow max-w-md">

                {!isMe && (
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    {msg.fromUser?.name}

                    {sender?.role === "admin" && <Crown size={12} />}
                    {sender?.role === "moderator" && <Shield size={12} />}
                  </div>
                )}

                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </main>

      {/* ================= INPUT ================= */}
      <footer className="p-3 bg-white border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border px-3 py-2 rounded"
          placeholder="Message..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded"
        >
          <Send size={16} />
        </button>
      </footer>

      {/* ================= ADD MEMBERS ================= */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">

            <h2 className="font-bold mb-2">Add Members</h2>

            {availableUsers.map((u) => (
              <div key={u._id} className="flex justify-between p-2 border-b">
                <span>{u.name}</span>

                <button
                  onClick={() =>
                    API.post(`/group/${groupId}/members`, {
                      memberId: u._id,
                    }).then(fetchGroup)
                  }
                  className="text-blue-600"
                >
                  Add
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowAddMembers(false)}
              className="mt-3 w-full bg-gray-200 p-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}