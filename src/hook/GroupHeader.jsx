import { Users, Settings, UserPlus, ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function GroupHeader({
  group,
  onlineMembers = [],
  onAddMembers,
  onOpenAdmin,
}) {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  /* ================= ADMIN CHECK ================= */

  const isAdmin = useMemo(() => {
    if (!group || !user) return false;

    return group.members?.some(
      (m) => String(m.user?._id) === String(user._id) && m.role === "admin",
    );
  }, [group, user]);

  /* ================= ONLINE COUNT ================= */

  const onlineCount = useMemo(() => {
    if (!group?.members?.length) return 0;

    return group.members.filter((member) =>
      onlineMembers.some((id) => String(id) === String(member.user?._id)),
    ).length;
  }, [group, onlineMembers]);

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
      {/* LEFT */}
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/chat");
            }
          }}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="font-semibold text-lg flex items-center gap-2">
            {group?.name}

            {isAdmin && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </h1>

          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Users size={14} />
            {group?.members?.length || 0} members • {onlineCount} online
          </p>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-2">
        {/* ADMIN BUTTON */}
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm transition"
          >
            <Settings size={16} />
            Admin
          </button>
        )}

        {/* GROUP CONTROL */}
        <button
          onClick={onAddMembers}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          <UserPlus size={16} />
          Group Control
        </button>
      </div>
    </header>
  );
}
