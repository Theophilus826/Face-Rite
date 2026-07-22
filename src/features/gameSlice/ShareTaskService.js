import API from "../Api";

/* ================= USER ================= */

const getTasks = async () => {
  const { data } = await API.get("/share-tasks/tasks");
  return data;
};

const getMyTasks = async () => {
  const { data } = await API.get("/share-tasks/tasks/my");
  return data;
};

/* ================= ADMIN ================= */

const createTask = async (taskData) => {
  const { data } = await API.post(
    "/share-tasks/tasks",
    taskData
  );

  return data;
};

const updateTask = async (id, taskData) => {
  const { data } = await API.put(
    `/share-tasks/tasks/${id}`,
    taskData
  );

  return data;
};

const deleteTask = async (id) => {
  const { data } = await API.delete(
    `/share-tasks/tasks/${id}`
  );

  return data;
};

const rewardUser = async (taskId, userId) => {
  const { data } = await API.post(
    `/share-tasks/tasks/${taskId}/reward`,
    {
      userId,
    }
  );

  return data;
};

const getTaskProgress = async (taskId) => {
  const { data } = await API.get(
    `/share-tasks/tasks/${taskId}/progress`
  );

  return data;
};

const ShareTaskService = {
  getTasks,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  rewardUser,
  getTaskProgress,
};

export default ShareTaskService;