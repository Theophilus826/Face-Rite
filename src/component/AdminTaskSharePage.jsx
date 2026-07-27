import { useEffect, useState } from "react";
import API from "../features/Api";
import { toast } from "react-toastify";

function AdminTaskSharePage() {
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    rewardCoins: 100,
    requiredMessages: 10,
    allowedTypes: ["text"],
    requiredKeyword: "",
    expiresAt: "",
    assignedUsers: [],
  });

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await API.get("/users");

      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTasks = async () => {
    try {
      const { data } = await API.get("/share-tasks/tasks");
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load tasks");
    }
  };

  const createTask = async () => {
    try {
      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("rewardCoins", form.rewardCoins);
      formData.append("requiredMessages", form.requiredMessages);
      formData.append("requiredKeyword", form.requiredKeyword);
      formData.append("expiresAt", form.expiresAt);

      // arrays
      form.allowedTypes.forEach((type) =>
        formData.append("allowedTypes[]", type),
      );

      form.assignedUsers.forEach((id) =>
        formData.append("assignedUsers[]", id),
      );

      // image
      if (image) {
        formData.append("image", image);
      }

      await API.post("/share-tasks/tasks", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Task created");

      // reset form
      setForm({
        title: "",
        description: "",
        rewardCoins: 100,
        requiredMessages: 10,
        allowedTypes: ["text"],
        requiredKeyword: "",
        expiresAt: "",
        assignedUsers: [],
      });

      setImage(null);
      setPreview("");

      loadTasks();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error creating task");
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete task?")) return;

    try {
      await API.delete(`/share-tasks/tasks/${id}`);
      toast.success("Deleted");
      loadTasks();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const viewProgress = async (id) => {
    try {
      const { data } = await API.get(`/share-tasks/tasks/${id}/progress`);

      setSelectedTask(id);
      setProgress(data.progress || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load progress");
    }
  };

  const rewardUser = async (taskId, userId) => {
    try {
      await API.post(`/share-tasks/tasks/${taskId}/reward`, { userId });

      toast.success("Reward sent");
      viewProgress(taskId);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Reward failed");
    }
  };

  return (
    <div className="admin-share">
      <h2>Share Tasks</h2>

      <div className="mt-4">
        <label>Assign Users</label>

        <select
          multiple
          value={form.assignedUsers}
          onChange={(e) => {
            const values = Array.from(
              e.target.selectedOptions,
              (option) => option.value,
            );

            setForm({
              ...form,
              assignedUsers: values,
            });
          }}
          className="border rounded p-2 w-full h-48"
        >
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>

        <small>
          Hold Ctrl (Windows) or Cmd (Mac) to select multiple users.
        </small>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Create Share Task</h2>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Image */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Task Image
            </label>

            <input
              type="file"
              accept="image/*"
              className="w-full border rounded-lg p-2"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                setImage(file);
                setPreview(URL.createObjectURL(file));
              }}
            />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-4 h-56 w-full object-cover rounded-xl border"
              />
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">Title</label>

            <input
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Task title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
            />
          </div>

          {/* Reward */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Reward Coins
            </label>

            <input
              type="number"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.rewardCoins}
              onChange={(e) =>
                setForm({
                  ...form,
                  rewardCoins: Number(e.target.value),
                })
              }
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>

            <textarea
              rows={4}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Task description..."
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </div>

          {/* Required Messages */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Required Messages
            </label>

            <input
              type="number"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.requiredMessages}
              onChange={(e) =>
                setForm({
                  ...form,
                  requiredMessages: Number(e.target.value),
                })
              }
            />
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Required Keyword
            </label>

            <input
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Optional keyword"
              value={form.requiredKeyword}
              onChange={(e) =>
                setForm({
                  ...form,
                  requiredKeyword: e.target.value,
                })
              }
            />
          </div>

          {/* Allowed Types */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Allowed Types
            </label>

            <div className="flex gap-5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.allowedTypes.includes("text")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm({
                        ...form,
                        allowedTypes: [...form.allowedTypes, "text"],
                      });
                    } else {
                      setForm({
                        ...form,
                        allowedTypes: form.allowedTypes.filter(
                          (t) => t !== "text",
                        ),
                      });
                    }
                  }}
                />
                Text
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.allowedTypes.includes("image")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm({
                        ...form,
                        allowedTypes: [...form.allowedTypes, "image"],
                      });
                    } else {
                      setForm({
                        ...form,
                        allowedTypes: form.allowedTypes.filter(
                          (t) => t !== "image",
                        ),
                      });
                    }
                  }}
                />
                Image
              </label>
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Expiration
            </label>

            <input
              type="datetime-local"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.expiresAt}
              onChange={(e) =>
                setForm({
                  ...form,
                  expiresAt: e.target.value,
                })
              }
            />
          </div>

          {/* Button */}
          <div className="md:col-span-2">
            <button
              onClick={createTask}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 transition"
            >
              Create Share Task
            </button>
          </div>
        </div>
      </div>

      {/* Existing Tasks */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {task.image && (
              <img
                src={task.image}
                alt={task.title}
                className="w-full h-52 object-cover"
              />
            )}

            <div className="p-5">
              <h3 className="text-xl font-bold">{task.title}</h3>

              <p className="text-gray-600 mt-2 line-clamp-3">
                {task.description}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  💰 <strong>{task.rewardCoins}</strong> Coins
                </p>

                <p>
                  💬 <strong>{task.requiredMessages}</strong> Messages
                </p>

                <p>📩 {task.allowedTypes?.join(", ")}</p>

                {task.requiredKeyword && <p>🔑 {task.requiredKeyword}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => viewProgress(task._id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                >
                  Progress
                </button>

                <button
                  onClick={() => deleteTask(task._id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <div className="mt-10 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">User Progress</h2>

            <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              {progress.length} Users
            </span>
          </div>

          {progress.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No progress available for this task.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4">User</th>
                    <th className="text-center p-4">Progress</th>
                    <th className="text-center p-4">Recipients</th>
                    <th className="text-center p-4">Status</th>
                    <th className="text-center p-4">Reward</th>
                    <th className="text-center p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {progress.map((item) => {
                    const percent = Math.min(
                      (item.messageCount / item.task.requiredMessages) * 100,
                      100,
                    );

                    return (
                      <tr key={item._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold">{item.user.name}</p>

                            <p className="text-sm text-gray-500">
                              {item.user.email}
                            </p>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>
                                {item.messageCount} /{" "}
                                {item.task.requiredMessages}
                              </span>

                              <span>{Math.round(percent)}%</span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-blue-600 transition-all"
                                style={{
                                  width: `${percent}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="text-center p-4">
                          <span className="font-semibold">
                            {item.recipients.length}
                          </span>
                        </td>

                        <td className="text-center p-4">
                          {item.completed ? (
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              Completed
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="text-center p-4">
                          {item.rewarded ? (
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              Rewarded
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                              Not Rewarded
                            </span>
                          )}
                        </td>

                        <td className="text-center p-4">
                          {!item.rewarded && item.completed ? (
                            <button
                              onClick={() =>
                                rewardUser(selectedTask, item.user._id)
                              }
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                            >
                              Reward User
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminTaskSharePage;
