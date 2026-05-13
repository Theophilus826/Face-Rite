import { Eye, EyeOff } from "lucide-react";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CoinBalanceCard() {
  const { balance: coins, history } = useSelector(
    (state) => state.coins,
  );

  const [showCoins, setShowCoins] = useState(true);

  const navigate = useNavigate();

  // Latest transaction
  const lastTransaction =
    Array.isArray(history) && history.length > 0
      ? history[0]
      : null;

  return (
    <div
      onClick={() => navigate("/coin-history")}
      className="w-full max-w-sm bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500">
              Available Coins
            </p>

            {/* Eye Toggle */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowCoins(!showCoins);
              }}
              className="cursor-pointer"
            >
              {showCoins ? (
                <Eye
                  size={16}
                  className="text-gray-400"
                />
              ) : (
                <EyeOff
                  size={16}
                  className="text-gray-400"
                />
              )}
            </span>

            {/* Last Transaction */}
            {lastTransaction && (
              <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                <span
                  className={
                    lastTransaction.amount > 0
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {lastTransaction.amount > 0 ? "+" : ""}
                  {lastTransaction.amount}
                </span>

                <span className="text-gray-500 truncate max-w-[120px]">
                  {lastTransaction.description}
                </span>
              </div>
            )}
          </div>

          {/* Coin Balance */}
          <h2 className="text-2xl font-bold text-gray-900 mt-2">
            {showCoins
              ? `${coins?.toLocaleString()} Coins`
              : "••••••"}
          </h2>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/deposit");
              }}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            >
              Deposit
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/withdraw");
              }}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div className="text-gray-400 text-xl ml-2">
          {"transaction"}
        </div>
      </div>
    </div>
  );
}