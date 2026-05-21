import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";

import { creditCoins } from "../features/coins/CoinSlice";

function GroupReward({
  messages = [],
  group,
  createdReward = false,
}) {
  const dispatch = useDispatch();

  /* ===============================
     MESSAGE PROGRESS
  =============================== */

  const messageCount = messages.length;

  const progress = useMemo(() => {
    return (messageCount % 10) * 10;
  }, [messageCount]);

  /* ===============================
     GROUP CREATE REWARD
  =============================== */

  useEffect(() => {
    if (!group) return;

    // avoid refresh farming
    if (!createdReward) return;

    dispatch(creditCoins({ coins: 50 }));
  }, [group, createdReward, dispatch]);

  /* ===============================
     EVERY 10 MESSAGES REWARD
  =============================== */

  useEffect(() => {
    if (!messageCount) return;

    if (messageCount % 10 === 0) {
      dispatch(creditCoins({ coins: 20 }));
    }
  }, [messageCount, dispatch]);

  /* ===============================
     UI
  =============================== */

  return (
    <div className="fixed right-3 top-28 z-40 flex flex-col items-center">
      {/* count */}
      <p className="text-xs text-gray-400 mb-2">
        {messageCount}/10
      </p>

      {/* vertical bar */}
      <div className="relative h-56 w-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className="absolute bottom-0 left-0 w-full bg-green-500 transition-all duration-500"
          style={{
            height: `${progress}%`,
          }}
        />
      </div>

      {/* reward text */}
      <p className="text-[10px] text-green-500 mt-2 font-semibold">
        +20 Coins
      </p>
    </div>
  );
}

export default GroupReward;