import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

import { useSelector } from "react-redux";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { API } from "../features/Api";

import { toast } from "react-toastify";

import {
  Send,
  Users,
  UserPlus,
} from "lucide-react";

export default function GroupChatPage() {
  const { groupId } = useParams();

  const navigate = useNavigate();

  const { user } = useSelector(
    (state) => state.auth
  );

  /* ================= STATE ================= */

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [group, setGroup] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [typingUser, setTypingUser] =
    useState(null);

  const [onlineMembers, setOnlineMembers] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [showAddMembers, setShowAddMembers] =
    useState(false);

  const [selectedUsers, setSelectedUsers] =
    useState([]);

  /* ================= REFS ================= */

  const esRef = useRef(null);

  const bottomRef = useRef(null);

  /* ================= HELPERS ================= */

  const scrollToBottom =
    useCallback(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, []);

  const isSelectedUser =
    useCallback(
      (id) =>
        selectedUsers.some(
          (u) => u._id === id
        ),
      [selectedUsers]
    );

  /* ================= FETCH GROUP ================= */

  const fetchGroup =
    useCallback(async () => {
      try {
        setLoading(true);

        const res = await API.get(
          `/group/${groupId}`
        );

        setGroup(res.data.group);

      } catch (err) {
        console.error(err);

        toast.error(
          "Failed to load group"
        );

        navigate("/groups");

      } finally {
        setLoading(false);
      }
    }, [groupId, navigate]);

  /* ================= FETCH MESSAGES ================= */

  const fetchMessages =
    useCallback(async () => {
      try {
        const res = await API.get(
          `/group/${groupId}/messages`
        );

        setMessages(
          res.data.messages || []
        );

      } catch (err) {
        console.error(err);

        toast.error(
          "Failed to load messages"
        );
      }
    }, [groupId]);

  /* ================= LOAD USERS ================= */

  const loadUsers =
    useCallback(async () => {
      try {
        const res = await API.get(
          "/users"
        );

        setUsers(
          res.data.users || []
        );

      } catch (err) {
        console.error(err);

        toast.error(
          "Failed to load users"
        );
      }
    }, []);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (!groupId) return;

    fetchGroup();

    fetchMessages();

  }, [
    groupId,
    fetchGroup,
    fetchMessages,
  ]);

  /* ================= LOAD USERS MODAL ================= */

  useEffect(() => {
    if (showAddMembers) {
      loadUsers();
    }
  }, [
    showAddMembers,
    loadUsers,
  ]);

  /* ================= SSE ================= */

  useEffect(() => {
    if (!user || !groupId)
      return;

    esRef.current?.close();

    const url = `${API.defaults.baseURL}/group/stream/${groupId}/${user._id}`;

    const es =
      new EventSource(url);

    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data
        );

        switch (data.type) {
          case "new_message":
            setMessages((prev) => [
              ...prev,
              data.message,
            ]);
            break;

          case "typing":
            setTypingUser(
              data.fromUser?.name ||
                "Someone"
            );
            break;

          case "stop_typing":
            setTypingUser(null);
            break;

          case "online_members":
            setOnlineMembers(
              data.members || []
            );
            break;

          case "group_event":
            handleGroupEvent(data);
            break;

          default:
            break;
        }

      } catch (err) {
        console.error(
          "SSE ERROR:",
          err
        );
      }
    };

    es.onerror = () => {
      console.error(
        "SSE connection lost"
      );
    };

    return () => {
      es.close();
    };

  }, [groupId, user]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ================= GROUP EVENTS ================= */

  const handleGroupEvent =
    (data) => {
      switch (data.event) {
        case "member_added":
          toast.info(
            "New member added"
          );

          fetchGroup();
          break;

        case "member_removed":
          toast.info(
            "Member removed"
          );

          fetchGroup();
          break;

        case "group_deleted":
          toast.info(
            "Group deleted"
          );

          navigate("/groups");
          break;

        default:
          break;
      }
    };

  /* ================= SEND MESSAGE ================= */

  const sendMessage =
    async () => {
      if (
        !text.trim() ||
        sending
      )
        return;

      const tempId =
        Date.now();

      const tempMessage = {
        _id: tempId,

        text,

        pending: true,

        fromUser: {
          _id: user._id,

          name: user.name,
        },

        createdAt:
          new Date(),
      };

      setMessages((prev) => [
        ...prev,
        tempMessage,
      ]);

      const currentText = text;

      setText("");

      try {
        setSending(true);

        const res =
          await API.post(
            "/group/send-message",
            {
              groupId,
              text: currentText,
            }
          );

        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId
              ? res.data.message
              : m
          )
        );

      } catch (err) {
        console.error(err);

        toast.error(
          "Failed to send message"
        );

        setMessages((prev) =>
          prev.filter(
            (m) => m._id !== tempId
          )
        );

      } finally {
        setSending(false);
      }
    };

  /* ================= ENTER SEND ================= */

  const handleKeyDown = (
    e
  ) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      sendMessage();
    }
  };

  /* ================= TOGGLE USER ================= */

  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find(
        (x) => x._id === u._id
      )
        ? prev.filter(
            (x) =>
              x._id !== u._id
          )
        : [...prev, u]
    );
  };

  /* ================= ADD MEMBERS ================= */

  const addMembers =
    async () => {
      if (
        !selectedUsers.length
      ) {
        return toast.error(
          "Select users first"
        );
      }

      try {
        await Promise.all(
          selectedUsers.map((u) =>
            API.post(
              `/group/${groupId}/members`,
              {
                memberId: u._id,
              }
            )
          )
        );

        toast.success(
          "Members added"
        );

        setShowAddMembers(false);

        setSelectedUsers([]);

        fetchGroup();

      } catch (err) {
        console.error(err);

        toast.error(
          "Failed to add members"
        );
      }
    };

  /* ================= FILTER USERS ================= */

  const availableUsers =
    useMemo(() => {
      if (!group) return [];

      return users.filter(
        (u) =>
          !group.members?.some(
            (m) =>
              m.user._id ===
              u._id
          )
      );
    }, [users, group]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">
          Loading group...
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div>
          Group not found
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* ================= HEADER ================= */}

      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">

        <div>
          <h1 className="font-semibold text-lg">
            {group.name}
          </h1>

          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Users size={14} />

            {
              group.members
                ?.length
            }{" "}
            members •{" "}
            {
              onlineMembers.length
            }{" "}
            online
          </p>
        </div>

        <button
          onClick={() =>
            setShowAddMembers(
              true
            )
          }
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          <UserPlus size={16} />
          Add Members
        </button>
      </header>

      {/* ================= MESSAGES ================= */}

      <main className="flex-1 overflow-y-auto p-4 space-y-3">

        {messages.map((msg) => {
          const isMe =
            msg.fromUser?._id ===
            user._id;

          return (
            <div
              key={msg._id}
              className={`flex ${
                isMe
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-md rounded-2xl px-4 py-2 shadow-sm ${
                  isMe
                    ? "bg-blue-600 text-white"
                    : "bg-white"
                }`}
              >
                {!isMe && (
                  <p className="text-xs font-semibold mb-1 text-blue-600">
                    {
                      msg
                        .fromUser
                        ?.name
                    }
                  </p>
                )}

                <p className="whitespace-pre-wrap break-words text-sm">
                  {msg.text}
                </p>

                {msg.pending && (
                  <p className="text-[10px] opacity-70 mt-1">
                    Sending...
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {typingUser && (
          <p className="text-xs text-gray-500 italic">
            {typingUser} is
            typing...
          </p>
        )}

        <div ref={bottomRef} />
      </main>

      {/* ================= INPUT ================= */}

      <footer className="bg-white border-t p-4 flex items-end gap-3">

        <textarea
          value={text}
          onChange={(e) =>
            setText(
              e.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
          rows={1}
          placeholder="Type a message..."
          className="flex-1 resize-none border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={sendMessage}
          disabled={
            sending ||
            !text.trim()
          }
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-xl transition"
        >
          <Send size={18} />
        </button>
      </footer>

      {/* ================= ADD MEMBERS MODAL ================= */}

      {showAddMembers && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Add Members
              </h2>

              <button
                onClick={() =>
                  setShowAddMembers(
                    false
                  )
                }
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border rounded-xl divide-y">

              {availableUsers.map(
                (u) => (
                  <div
                    key={u._id}
                    onClick={() =>
                      toggleUser(
                        u
                      )
                    }
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">
                        {u.name}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelectedUser(
                        u._id
                      )}
                      readOnly
                    />
                  </div>
                )
              )}

            </div>

            <div className="flex justify-end gap-3 mt-5">

              <button
                onClick={() =>
                  setShowAddMembers(
                    false
                  )
                }
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={
                  addMembers
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Add Members
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}