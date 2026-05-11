import { useState, useMemo } from "react";
import { API } from "../features/Api";

export default function GroupAdminPanel({
  groupId,
  group,
  token,
  onRefresh,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);

  /* ================= MEMBERS ================= */

  const groupMembers = useMemo(() => {
    return group?.members || [];
  }, [group]);

  /* ================= LOAD USERS ================= */

  const loadUsers = async () => {
    // prevent reloading every click
    if (users.length > 0) {
      setShowAddMembers(true);
      return;
    }

    try {
      setLoadingUsers(true);

      const res = await API.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data.users || []);
      setShowAddMembers(true);

    } catch (err) {
      console.error(
        "Load users failed:",
        err.response?.data || err.message
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ================= FILTER USERS ================= */

  const availableUsers = useMemo(() => {
    return users.filter(
      (u) =>
        !groupMembers.some(
          (m) => String(m.user?._id) === String(u._id)
        ) &&
        u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, groupMembers, search]);

  /* ================= ACTION WRAPPER ================= */

  const runAction = async (cb) => {
    try {
      setLoading(true);

      await cb();

      await onRefresh?.();

    } catch (err) {
      console.error(
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */

  const addMember = async (memberId) => {
    runAction(async () => {
      await API.post(
        `/group/${groupId}/members`,
        { memberId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // remove added user instantly
      setUsers((prev) =>
        prev.filter((u) => u._id !== memberId)
      );
    });
  };

  const kickUser = async (memberId) => {
    runAction(async () => {
      await API.delete(
        `/group/${groupId}/members/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    });
  };

  const promoteAdmin = async (memberId) => {
    runAction(async () => {
      await API.patch(
        `/group/${groupId}/members/${memberId}/role`,
        { role: "admin" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    });
  };

  /* ================= UI ================= */

  return (
    <div className="p-4 space-y-6">

      {/* MEMBERS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">
            Group Members
          </h2>

          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
          >
            {loadingUsers
              ? "Loading..."
              : showAddMembers
              ? "Refresh Users"
              : "Add Members"}
          </button>
        </div>

        <div className="space-y-2">
          {groupMembers.map((member) => (
            <div
              key={member.user?._id}
              className="flex items-center justify-between border rounded-xl p-3"
            >
              <div>
                <p className="font-medium">
                  {member.user?.name}
                </p>

                <p className="text-sm text-gray-500 capitalize">
                  {member.role}
                </p>
              </div>

              <div className="flex gap-2">

                {member.role !== "admin" && (
                  <button
                    disabled={loading}
                    onClick={() =>
                      promoteAdmin(member.user._id)
                    }
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm"
                  >
                    Promote
                  </button>
                )}

                <button
                  disabled={loading}
                  onClick={() =>
                    kickUser(member.user._id)
                  }
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
                >
                  Kick
                </button>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD MEMBERS */}
      {showAddMembers && (
        <div>
          <h2 className="font-bold text-lg mb-3">
            Add Members
          </h2>

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg p-2 mb-3"
          />

          <div className="space-y-2">
            {availableUsers.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between border rounded-xl p-3"
              >
                <p>{u.name}</p>

                <button
                  disabled={loading}
                  onClick={() => addMember(u._id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
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
      )}
    </div>
  );
}