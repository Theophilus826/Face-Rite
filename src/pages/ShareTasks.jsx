import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchTasks,
  fetchMyTasks,
} from "../features/gameSlice/ShareTaskSlice";

export default function ShareTasks() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    tasks = [],
    myTasks = [],
    isLoading,
  } = useSelector((state) => state.shareTasks);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const getProgress = (taskId) =>
    myTasks.find((item) => item.task?._id === taskId);

  const handleShare = (task, type) => {
    navigate("/chat", {
      state: {
        sharedTask: {
          taskId: task._id,
          title: task.title,
          type,
          text: task.description,
          image: task.image || null,
          rewardCoins: task.rewardCoins,
          requiredKeyword: task.requiredKeyword,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold mb-2">
        Share Tasks
      </h1>

      <p className="text-gray-500 mb-8">
        Complete messaging tasks to earn coins.
      </p>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-xl font-semibold">
            No Active Tasks
          </h2>

          <p className="text-gray-500 mt-2">
            Check back later for new rewards.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {tasks.map((task) => {
            const progress = getProgress(task._id);

            const current =
              progress?.messageCount || 0;

            const total =
              task.requiredMessages || 1;

            const percent = Math.min(
              (current / total) * 100,
              100
            );

            return (
              <div
                key={task._id}
                className="bg-white rounded-xl shadow overflow-hidden"
              >
                {task.image && (
                  <img
                    src={task.image}
                    alt={task.title}
                    className="w-full h-52 object-cover"
                  />
                )}

                <div className="p-5">
                  <h2 className="text-xl font-bold">
                    {task.title}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    {task.description}
                  </p>

                  <div className="mt-5 space-y-2 text-sm">
                    <div>
                      💰 Reward:
                      <strong>
                        {" "}
                        {task.rewardCoins} Coins
                      </strong>
                    </div>

                    <div>
                      👥 Required Users:
                      <strong>
                        {" "}
                        {task.requiredMessages}
                      </strong>
                    </div>

                    {task.allowedTypes?.length >
                      0 && (
                      <div>
                        📩 Allowed:
                        <strong>
                          {" "}
                          {task.allowedTypes.join(
                            ", "
                          )}
                        </strong>
                      </div>
                    )}

                    {task.requiredKeyword && (
                      <div>
                        🔑 Keyword:
                        <strong>
                          {" "}
                          {task.requiredKeyword}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progress</span>

                      <span>
                        {current}/{total}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div
                        className="h-3 bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    {progress?.rewarded ? (
                      <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                        ✅ Rewarded
                      </span>
                    ) : progress?.completed ? (
                      <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                        ⏳ Awaiting Reward
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        🚀 In Progress
                      </span>
                    )}
                  </div>

                  {/* Share Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() =>
                        handleShare(task, "text")
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
                    >
                      Share Text
                    </button>

                    {task.image && (
                      <button
                        onClick={() =>
                          handleShare(task, "image")
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
                      >
                        Share Image
                      </button>
                    )}
                  </div>

                  {task.expiresAt && (
                    <p className="mt-5 text-xs text-gray-500">
                      Expires:{" "}
                      {new Date(
                        task.expiresAt
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}