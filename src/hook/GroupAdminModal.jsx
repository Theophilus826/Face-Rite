import GroupAdminPanel from "./ChatAdmin";

export default function GroupAdminModal({
  open,
  onClose,
  group,
  token,
  currentUser,
  onUpdated,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-bold">
              Group Admin Panel
            </h2>

            <p className="text-sm text-gray-500">
              Manage members, roles, and rewards
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-gray-500 transition hover:text-black"
          >
            ×
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="max-h-[80vh] overflow-y-auto">
          <GroupAdminPanel
            groupId={group?._id}
            group={group}
            token={token}
            currentUser={currentUser}
            onRefresh={onUpdated}
          />
        </div>
      </div>
    </div>
  );
}