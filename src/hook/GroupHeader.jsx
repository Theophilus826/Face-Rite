import { Users, Settings, UserPlus } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export default function GroupHeader({
  group,
  onlineMembers = [],
  onAddMembers,
  onOpenAdmin,
}) {
  const { user } = useSelector((state) => state.auth);

  const isAdmin = useMemo(() => {
    if (!group || !user) return false;
    return group?.admin?._id === user._id;
  }, [group, user]);

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
      {/* LEFT */}
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
          {group?.members?.length || 0} members • {onlineMembers.length} online
        </p>
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

        {/* ADD MEMBERS */}
        <button
          onClick={onAddMembers}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          <UserPlus size={16} />
          Add Members
        </button>
      </div>
    </header>
  );
}