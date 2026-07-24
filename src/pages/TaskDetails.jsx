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

  const {
    tasks = [],
    myTasks = [],
    isLoading,
  } = useSelector((state) => state.shareTasks || {});

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchMyTasks());
  }, [dispatch, id]);

  const task = tasks.find((t) => t._id === id);

  const progress = myTasks.find(
    (p) => p.task?._id === id
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Task not found.</p>
      </div>
    );
  }

  const messageCount = progress?.messageCount || 0;

  const percentage = Math.min(
    (messageCount / task.requiredMessages) * 100,
    100
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Image */}
      {task.image && (
        <img
          src={task.image}
          alt={task.title}
          className="w-full h-72 object-cover rounded-xl mb-6"
        />
      )}

      {/* Header */}
      <h1 className="text-3xl font-bold">
        {task.title}
      </h1>

      <p className="text-gray-600 mt-3">
        {task.description}
      </p>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="font-semibold mb-2">
            Reward
          </h3>

          <p className="text-lg">
            🪙 {task.rewardCoins} Coins
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="font-semibold mb-2">
            Required Users
          </h3>

          <p className="text-lg">
            {task.requiredMessages}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="font-semibold mb-2">
            Allowed Message Types
          </h3>

          <p>
            {task.allowedTypes?.join(", ") ||
              "All"}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="font-semibold mb-2">
            Required Keyword
          </h3>

          <p>
            {task.requiredKeyword || "None"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">
            Progress
          </h3>

          <span className="text-sm text-gray-500">
            {messageCount}/
            {task.requiredMessages}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-600 h-4 transition-all duration-300"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        <p className="mt-3 text-gray-600">
          {percentage.toFixed(0)}% Complete
        </p>

        {progress?.completed && (
          <p className="mt-2 text-green-600 font-semibold">
            ✅ Task Completed
          </p>
        )}

        {progress?.rewarded && (
          <p className="mt-2 text-yellow-600 font-semibold">
            🪙 Reward Received
          </p>
        )}

        {!progress && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700">
              You haven't started this task
              yet. Start messaging users to
              begin earning progress.
            </p>
          </div>
        )}
      </div>

      {/* Recipients */}
      <div className="mt-10">
        <h3 className="font-bold text-lg mb-4">
          People Messaged
        </h3>

        {progress?.recipients?.length ? (
          <div className="space-y-3">
            {progress.recipients.map((r) => (
              <div
                key={
                  r.user?._id ||
                  r._id ||
                  Math.random()
                }
                className="flex items-center justify-between border rounded-lg p-4 bg-white shadow-sm"
              >
                <div>
                  <p className="font-medium">
                    {r.user?.name ||
                      "Unknown User"}
                  </p>

                  <p className="text-xs text-gray-500">
                    {r.sentAt
                      ? new Date(
                          r.sentAt
                        ).toLocaleString()
                      : ""}
                  </p>
                </div>

                <span className="text-green-600 font-semibold">
                  ✓ Sent
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-5 border">
            <p className="text-gray-500">
              No users have been messaged yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}