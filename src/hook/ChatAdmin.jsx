import { useEffect, useState, useMemo } from "react";
import { API } from "../features/Api";

export default function GroupAdminPanel({
  groupId,
  group,
  onRefresh,
}) {
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await API.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data.users || []);
    } catch (err) {
      console.error(
        "Load users failed:",
        err.response?.data || err.message
      );
    }
  };

  /* ================= FILTER USERS ================= */

  const groupMembers = useMemo(() => {
    return group?.members || [];
  }, [group]);

  const availableUsers = useMemo(() => {
    return users.filter(
      (u) =>
        !groupMembers.some(
          (m) => m.user?._id === u._id
        )
    );
  }, [users, groupMembers]);

  /* ================= ACTIONS ================= */

  const kickUser = async (memberId) => {
    try {
      await API.delete(
        `/group/${groupId}/members/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onRefresh?.();
    } catch (err) {
      console.error(
        "Kick failed:",
        err.response?.data || err.message
      );
    }
  };

  const addMember = async (memberId) => {
    try {
      await API.post(
        `/group/${groupId}/members`,
        { memberId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onRefresh?.();
    } catch (err) {
      console.error(
        "Add member failed:",
        err.response?.data || err.message
      );
    }
  };

  const promoteAdmin = async (memberId) => {
    try {
      await API.patch(
        `/group/${groupId}/members/${memberId}/role`,
        { role: "admin" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onRefresh?.();
    } catch (err) {
      console.error(
        "Promote failed:",
        err.response?.data || err.message
      );
    }
  };

  /* ================= UI ================= */

  return (
    <div className="bg-white border-b p-4 space-y-5">
      {/* ================= MEMBERS ================= */}

      <div>
        <h2 className="font-semibold mb-2">
          Group Members
        </h2>

        <div className="space-y-2">
          {groupMembers.map((member) => (
            <div
              key={member.user?._id}
              className="flex items-center justify-between border rounded-lg p-2"
            >
              <div>
                <p className="font-medium">
                  {member.user?.name}
                </p>

                <p className="text-xs text-gray-500">
                  {member.role}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    promoteAdmin(member.user._id)
                  }
                  className="px-2 py-1 bg-purple-500 text-white rounded text-sm"
                >
                  Promote
                </button>

                <button
                  onClick={() =>
                    kickUser(member.user._id)
                  }
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Kick
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ADD USERS ================= */}

      <div>
        <h2 className="font-semibold mb-2">
          Add Members
        </h2>

        <div className="space-y-2">
          {availableUsers.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between border rounded-lg p-2"
            >
              <p>{u.name}</p>

              <button
                onClick={() => addMember(u._id)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Add
              </button>
            </div>
          ))}

          {availableUsers.length === 0 && (
            <p className="text-sm text-gray-500">
              No users available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}