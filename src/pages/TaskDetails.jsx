import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTasks,
  fetchMyTasks,
} from "../features/gameSlice/ShareTaskSlice";

export default function TaskDetails() {
  const { id } = useParams();

  const dispatch = useDispatch();

  const { tasks, myTasks } = useSelector(
    (state) => state.shareTask
  );

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const task = tasks.find((t) => t._id === id);

  const progress = myTasks.find(
    (p) => p.task._id === id
  );

  if (!task) return <p>Task not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">

      {task.image && (
        <img
          src={task.image}
          alt={task.title}
          className="rounded-xl w-full h-72 object-cover mb-6"
        />
      )}

      <h1 className="text-3xl font-bold">
        {task.title}
      </h1>

      <p className="mt-3 text-gray-600">
        {task.description}
      </p>

      <div className="grid grid-cols-2 gap-5 mt-8">

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold">
            Reward
          </h3>

          <p>
            🪙 {task.rewardCoins} Coins
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold">
            Required Users
          </h3>

          <p>
            {task.requiredMessages}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold">
            Allowed
          </h3>

          <p>
            {task.allowedTypes.join(", ")}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold">
            Keyword
          </h3>

          <p>
            {task.requiredKeyword || "None"}
          </p>
        </div>

      </div>

      <div className="mt-8">

        <h3 className="font-bold mb-3">
          Progress
        </h3>

        <progress
          max={task.requiredMessages}
          value={progress?.messageCount || 0}
          className="w-full"
        />

        <p className="mt-2">
          {progress?.messageCount || 0}/
          {task.requiredMessages}
        </p>

      </div>

      <div className="mt-8">

        <h3 className="font-bold mb-4">
          People Messaged
        </h3>

        {progress?.recipients?.length ? (

          progress.recipients.map((r) => (

            <div
              key={r.user._id}
              className="border rounded p-3 mb-2"
            >
              {r.user.name}
            </div>

          ))

        ) : (

          <p>No recipients yet.</p>

        )}

      </div>

    </div>
  );
}