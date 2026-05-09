import { API } from "../features/Api";

export default function GroupAdminPanel({ groupId, onRefresh }) {
  const token = localStorage.getItem("token");

  /* ================= KICK USER ================= */
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
      console.error("Kick failed:", err.response?.data || err.message);
    }
  };

  /* ================= ADD MEMBER ================= */
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
      console.error("Add member failed:", err.response?.data || err.message);
    }
  };

  /* ================= PROMOTE ADMIN ================= */
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
      console.error("Promote failed:", err.response?.data || err.message);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="bg-white border-b p-3 flex gap-3">
      <button
        onClick={() => {
          const id = prompt("Enter user ID to kick:");
          if (id) kickUser(id);
        }}
        className="px-3 py-1 bg-red-500 text-white rounded"
      >
        Kick User
      </button>

      <button
        onClick={() => {
          const id = prompt("Enter user ID to mute (not implemented yet):");
          console.log("Mute user:", id);
        }}
        className="px-3 py-1 bg-yellow-500 text-white rounded"
      >
        Mute User
      </button>

      <button
        onClick={() => {
          const id = prompt("Enter user ID to add:");
          if (id) addMember(id);
        }}
        className="px-3 py-1 bg-blue-500 text-white rounded"
      >
        Add Member
      </button>

      <button
        onClick={() => {
          const id = prompt("Enter user ID to promote:");
          if (id) promoteAdmin(id);
        }}
        className="px-3 py-1 bg-purple-500 text-white rounded"
      >
        Promote Admin
      </button>
    </div>
  );
}