import {
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
} from "lucide-react";

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
      className="
        relative
        overflow-hidden
        w-full
        max-w-md
        rounded-3xl
        bg-gradient-to-br
        from-slate-900
        via-slate-800
        to-slate-900
        p-5
        shadow-xl
        border
        border-white/10
        cursor-pointer
        transition-all
        duration-300
        hover:scale-[1.01]
        hover:shadow-2xl
      "
    >
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/10 blur-2xl rounded-full" />

      <div className="relative z-10">
        {/* Top Section */}
        <div className="flex items-start justify-between">
          <div>
            {/* Wallet Label */}
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-300 font-medium tracking-wide">
                Available Coins
              </p>

              {/* Eye Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCoins(!showCoins);
                }}
                className="
                  flex items-center justify-center
                  w-7 h-7
                  rounded-full
                  bg-white/10
                  hover:bg-white/20
                  transition
                "
              >
                {showCoins ? (
                  <Eye
                    size={15}
                    className="text-white/80"
                  />
                ) : (
                  <EyeOff
                    size={15}
                    className="text-white/80"
                  />
                )}
              </button>
            </div>

            {/* Balance */}
            <h2 className="mt-3 text-4xl font-bold text-white tracking-tight">
              {showCoins
                ? coins?.toLocaleString()
                : "••••••"}
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Wallet Balance
            </p>
          </div>

          {/* Transaction Link */}
          <div
            className="
              flex items-center gap-1
              text-sm
              text-gray-300
              bg-white/10
              px-3
              py-2
              rounded-full
              backdrop-blur-sm
            "
          >
            <span>Transactions</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Latest Transaction */}
        {lastTransaction && (
          <div
            className="
              mt-5
              flex items-center justify-between
              bg-white/5
              border border-white/10
              rounded-2xl
              px-4
              py-3
              backdrop-blur-md
            "
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  flex items-center justify-center
                  w-10 h-10
                  rounded-full
                  ${
                    lastTransaction.amount > 0
                      ? "bg-green-500/20"
                      : "bg-red-500/20"
                  }
                `}
              >
                {lastTransaction.amount > 0 ? (
                  <ArrowDownLeft
                    size={18}
                    className="text-green-400"
                  />
                ) : (
                  <ArrowUpRight
                    size={18}
                    className="text-red-400"
                  />
                )}
              </div>

              <div>
                <p className="text-sm text-white font-medium">
                  {lastTransaction.description}
                </p>

                <p className="text-xs text-gray-400">
                  {new Date(
                    lastTransaction.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className={`text-sm font-bold ${
                lastTransaction.amount > 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {lastTransaction.amount > 0 ? "+" : ""}
              {lastTransaction.amount}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/deposit");
            }}
            className="
              flex-1
              bg-blue-600
              hover:bg-blue-500
              text-white
              py-3
              rounded-xl
              text-sm
              font-semibold
              transition
              shadow-lg shadow-blue-600/20
            "
          >
            Deposit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/withdraw");
            }}
            className="
              flex-1
              bg-white/10
              hover:bg-white/20
              text-white
              py-3
              rounded-xl
              text-sm
              font-semibold
              border border-white/10
              transition
            "
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}