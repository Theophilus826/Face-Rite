import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useEffect,
  useState,
  useCallback,
} from "react";

import GroupAdminModal from "../hook/GroupAdminModal";
import MessageList from "../hook/MessageList";
import ChatInput from "../hook/ChatInput";
import GroupHeader from "../hook/GroupHeader";
import GroupReward from "../hook/GroupReward";

import useGroupSocket from "../hook/useGroupSocket";

import { API } from "../features/Api";

export default function GroupChatPage() {
  const { groupId } = useParams();

  const navigate = useNavigate();

  const { user } = useSelector(
    (s) => s.auth
  );

  const token =
    localStorage.getItem("token");

  /* ================= STATE ================= */

  const [group, setGroup] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [adminOpen, setAdminOpen] =
    useState(false);

  /* ================= LOAD GROUP ================= */

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const res = await API.get(
        `/group/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setGroup(res.data.group);
    } catch (err) {
      console.error(
        "GROUP LOAD ERROR:",
        err.response?.data ||
          err.message
      );

      const msg =
        err.response?.data?.error ||
        "Failed to load group";

      setError(msg);

      if (
        err.response?.status === 403
      ) {
        setError(
          "You are not a member of this group"
        );
      }

      if (
        err.response?.status === 401
      ) {
        setError(
          "Session expired. Please login again."
        );

        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, token, navigate]);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (!groupId || !token) return;

    loadGroup();
  }, [groupId, token, loadGroup]);

  /* ================= SOCKET ================= */

  const {
    messages,
    setMessages,
    typingUser,
    onlineMembers,
  } = useGroupSocket({
    groupId,
    user,
    token,
  });

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async (
    payload
  ) => {
    if (!payload || !user) return;

    /* ================= TEXT ================= */

    if (payload.type === "text") {
      const messageText =
        payload.content?.trim();

      if (!messageText) return;

      const tempId =
        `temp-${Date.now()}`;

      const tempMessage = {
        _id: tempId,

        type: "text",

        text: messageText,

        fromUser: {
          _id: user._id,
          name: user.name,
        },

        pending: true,

        createdAt:
          new Date().toISOString(),
      };

      /* ================= OPTIMISTIC ================= */

      setMessages((prev) => [
        ...prev,
        tempMessage,
      ]);

      try {
        const res = await API.post(
          "/group/send-message",
          {
            groupId,
            text: messageText,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const realMessage =
          res.data.message;

        /* ================= REPLACE TEMP ================= */

        setMessages((prev) => {
          const filtered =
            prev.filter(
              (m) =>
                m._id !== tempId
            );

          const exists =
            filtered.some(
              (m) =>
                m._id ===
                realMessage._id
            );

          if (exists)
            return filtered;

          return [
            ...filtered,
            realMessage,
          ];
        });
      } catch (err) {
        console.error(
          "TEXT SEND FAILED:",
          err.response?.data ||
            err.message
        );

        /* ================= REMOVE FAILED TEMP ================= */

        setMessages((prev) =>
          prev.filter(
            (m) =>
              m._id !== tempId
          )
        );
      }

      return;
    }

    /* ================= IMAGE ================= */

    if (payload.type === "image") {
      const formData =
        new FormData();

      formData.append(
        "groupId",
        groupId
      );

      formData.append(
        "image",
        payload.file
      );

      try {
        await API.post(
          "/group/send-message",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        // SSE handles realtime updates
      } catch (err) {
        console.error(
          "IMAGE SEND FAILED:",
          err.response?.data ||
            err.message
        );
      }

      return;
    }

    /* ================= AUDIO ================= */

    if (payload.type === "audio") {
      const formData =
        new FormData();

      formData.append(
        "groupId",
        groupId
      );

      formData.append(
        "audio",
        payload.file
      );

      try {
        await API.post(
          "/group/send-message",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        // SSE handles realtime updates
      } catch (err) {
        console.error(
          "AUDIO SEND FAILED:",
          err.response?.data ||
            err.message
        );
      }

      return;
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Loading group...
        </p>
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-3">
        <p className="text-red-500">
          {error}
        </p>

        <button
          onClick={() =>
            navigate("/groups")
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  /* ================= NO GROUP ================= */

  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Group not found
        </p>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* ================= HEADER ================= */}

      <GroupHeader
        group={group}
        onlineMembers={
          onlineMembers
        }
        onAddMembers={() =>
          setAdminOpen(true)
        }
        onOpenAdmin={() =>
          setAdminOpen(true)
        }
      />

      {/* ================= REWARDS ================= */}

      {group?.rewards?.enabled && (
        <GroupReward
          messages={messages}
          group={group}
        />
      )}

      {/* ================= ADMIN ================= */}

      <GroupAdminModal
        open={adminOpen}
        onClose={() =>
          setAdminOpen(false)
        }
        group={group}
        token={token}
        currentUser={user}
        onUpdated={loadGroup}
      />

      {/* ================= MESSAGES ================= */}

      <div className="flex-1 overflow-y-auto bg-transparent pb-2">
        <MessageList
          messages={messages}
          userId={user?._id}
          onDelete={async (messageId) => {
            try {
              await API.delete(
                `/group/${groupId}/messages/${messageId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              setMessages((prev) =>
                prev.filter((m) => m._id !== messageId),
              );
            } catch (err) {
              console.error(
                "Group delete failed:",
                err.response?.data || err.message,
              );
            }
          }}
        />
      </div>

      {/* ================= INPUT ================= */}

      <div className="sticky bottom-0 z-30 bg-transparent pb-[30px]">
        <ChatInput
          onSend={sendMessage}
          typingUser={typingUser}
        />
      </div>
    </div>
  );
}