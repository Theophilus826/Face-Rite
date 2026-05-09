import { useEffect, useState } from "react";
import { API } from "../features/Api";

export default function GroupAdminModal({
  open,
  onClose,
  group,
  token,
  onUpdated,
}) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setMembers(group?.members || []);
    }
  }, [open, group]);

  if (!open) return null;

  const promote = async (memberId) => {
    await API.patch(
      `/group/${group._id}/members/${memberId}/role`,
      { role: "admin" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    onUpdated();
  };

  const remove = async (memberId) => {
    await API.delete(
      `/group/${group._id}/members/${memberId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    onUpdated();
  };

  const filtered = members.filter((m) =>
    m.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

      <div className="bg-white w-[400px] rounded p-4">

        <h2 className="text-lg font-bold mb-3">
          Group Admin Panel
        </h2>

        {/* SEARCH */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full border p-2 rounded mb-3"
        />

        {/* MEMBER LIST */}
        <div className="max-h-60 overflow-y-auto space-y-2">

          {filtered.map((m) => (
            <div
              key={m.user._id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <div>
                <p className="font-medium">
                  {m.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {m.role}
                </p>
              </div>

              <div className="flex gap-2">

                {m.role !== "admin" && (
                  <button
                    onClick={() => promote(m.user._id)}
                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
                  >
                    Promote
                  </button>
                )}

                <button
                  onClick={() => remove(m.user._id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                >
                  Kick
                </button>

              </div>
            </div>
          ))}

        </div>

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="mt-3 w-full bg-gray-200 py-2 rounded"
        >
          Close
        </button>

      </div>
    </div>
  );
}