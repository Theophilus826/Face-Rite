import { useEffect, useState } from "react";
import API from "../features/Api";
import { toast } from "react-toastify";

function AdminTaskSharePage() {
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);

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
      await API.post("/share-tasks/tasks", form);
      toast.success("Task created");
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
      <div className="create-task">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

        <input
          type="number"
          placeholder="Reward Coins"
          value={form.rewardCoins}
          onChange={(e) =>
            setForm({
              ...form,
              rewardCoins: Number(e.target.value),
            })
          }
        />

        <input
          type="number"
          placeholder="Required Messages"
          value={form.requiredMessages}
          onChange={(e) =>
            setForm({
              ...form,
              requiredMessages: Number(e.target.value),
            })
          }
        />

        <button onClick={createTask}>Create Task</button>
      </div>

      {tasks.map((task) => (
        <div key={task._id} className="task-card">
          <h3>{task.title}</h3>

          <p>{task.description}</p>

          <p>Reward: {task.rewardCoins} Coins</p>

          <button onClick={() => viewProgress(task._id)}>Progress</button>

          <button onClick={() => deleteTask(task._id)}>Delete</button>
        </div>
      ))}

      {selectedTask && (
        <>
          <h2>User Progress</h2>

          {progress.map((item) => (
            <div key={item._id} className="progress-card">
              <h4>{item.user.name}</h4>

              <p>
                {item.messageCount} / {item.task.requiredMessages}
              </p>

              <p>{item.completed ? "Completed" : "Pending"}</p>

              <p>{item.rewarded ? "Rewarded" : "Not Rewarded"}</p>

              <p>Recipients: {item.recipients.length}</p>

              {!item.rewarded && item.completed && (
                <button onClick={() => rewardUser(selectedTask, item.user._id)}>
                  Reward
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default AdminTaskSharePage;
