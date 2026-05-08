export default function GroupAdminPanel({ groupId }) {
  return (
    <div className="bg-white border-b p-3 flex gap-3">
      <button className="px-3 py-1 bg-red-500 text-white rounded">
        Kick User
      </button>

      <button className="px-3 py-1 bg-yellow-500 text-white rounded">
        Mute User
      </button>

      <button className="px-3 py-1 bg-blue-500 text-white rounded">
        Add Member
      </button>

      <button className="px-3 py-1 bg-purple-500 text-white rounded">
        Promote Admin
      </button>
    </div>
  );
}