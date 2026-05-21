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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">
            Group Admin Panel
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div className="max-h-[80vh] overflow-y-auto">
          <GroupAdminPanel
            groupId={group?._id}
            group={group}
            token={token}
            onRefresh={onUpdated}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}