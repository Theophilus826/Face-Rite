import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../features/Api";
import { toast } from "react-toastify";

export default function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const createGroup = async () => {
    if (!name.trim()) return toast.error("Group name required");

    try {
      const { data } = await API.post("/group/create", {
        name,
      });

      toast.success("Group created");
      navigate(`/group/${data.group._id}`);
    } catch {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create Group</h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name"
        className="w-full border p-2 rounded mb-3"
      />

      <button
        onClick={createGroup}
        className="w-full bg-green-500 text-white p-2 rounded"
      >
        Create
      </button>
    </div>
  );
}