import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { creditCoins } from "../features/coins/CoinSlice";

function GroupReward({
  messages = [],
  group,
  createdReward = false,
}) {
  const dispatch = useDispatch();

  /* ===============================
     SETTINGS (TOGGLE SYSTEM)
  =============================== */
  const rewardsEnabled =
    group?.settings?.allowRewards ?? true;

  /* ===============================
     MILESTONE CONFIG
  =============================== */
  const milestone =
    group?.rewards?.messageMilestone || 10;

  const rewardCoins =
    group?.rewards?.messageRewardCoins || 20;

  /* ===============================
     MESSAGE COUNT
  =============================== */
  const messageCount = messages.length;

  /* ===============================
     PROGRESS
  =============================== */
  const progress = useMemo(() => {
    if (!milestone) return 0;
    return ((messageCount % milestone) * 100) / milestone;
  }, [messageCount, milestone]);

  /* ===============================
     PREVENT DUPLICATE REWARDS
  =============================== */
  const lastRewardRef = useRef(0);

  /* ===============================
     GROUP CREATE REWARD
  =============================== */
  useEffect(() => {
    if (!group || !createdReward) return;
    if (!rewardsEnabled) return;

    dispatch(creditCoins({ coins: 50 }));
  }, [group, createdReward, rewardsEnabled, dispatch]);

  /* ===============================
     MESSAGE MILESTONE REWARD
  =============================== */
  useEffect(() => {
    if (!rewardsEnabled) return;
    if (!messageCount) return;

    const reachedMilestone =
      messageCount % milestone === 0;

    if (!reachedMilestone) return;

    // prevent duplicate trigger on re-render
    if (lastRewardRef.current === messageCount) return;

    lastRewardRef.current = messageCount;

    dispatch(
      creditCoins({
        coins: rewardCoins,
      })
    );
  }, [
    messageCount,
    milestone,
    rewardCoins,
    rewardsEnabled,
    dispatch,
  ]);

  /* ===============================
     UI
  =============================== */
  return (
    <div className="fixed right-3 top-28 z-40 flex flex-col items-center opacity-90">

      {/* COUNT */}
      <p className="text-xs text-gray-400 mb-2">
        {messageCount}/{milestone}
      </p>

      {/* PROGRESS BAR */}
      <div className="relative h-56 w-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${
            rewardsEnabled ? "bg-green-500" : "bg-gray-400"
          }`}
          style={{ height: `${progress}%` }}
        />
      </div>

      {/* LABEL */}
      <p
        className={`text-[10px] mt-2 font-semibold ${
          rewardsEnabled ? "text-green-500" : "text-gray-400"
        }`}
      >
        {rewardsEnabled ? `+${rewardCoins} Coins` : "Rewards Off"}
      </p>
    </div>
  );
}

export default GroupReward;