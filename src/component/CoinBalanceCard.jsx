import { Eye, EyeOff } from "lucide-react";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CoinBalanceCard() {
    const { balance: coins, history } = useSelector((state) => state.coins);
    const [showCoins, setShowCoins] = useState(true);
    const navigate = useNavigate();

    // Get last transaction for tooltip or small info
    const lastTransaction = history?.[0];

    return (
        <div
            onClick={() => navigate("/coin-history")}
            className="w-full max-w-sm bg-white rounded-xl shadow-md p-4 flex flex-col cursor-pointer hover:shadow-lg transition"
        >
            {/* Top: Coin Info */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                        Available Coins
                        {/* Eye Toggle */}
                        <span
                            onClick={(e) => {
                                e.stopPropagation(); // prevent navigation
                                setShowCoins(!showCoins);
                            }}
                            className="cursor-pointer"
                        >
                            {showCoins ? (
                                <Eye size={16} className="text-gray-400" />
                            ) : (
                                <EyeOff size={16} className="text-gray-400" />
                            )}
                        </span>
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-1">
                        {showCoins
                            ? coins?.toLocaleString("en-NG", {
                                style: "currency",
                                currency: "NGN",
                            })
                            : "₦••••••"}
                    </h2>
                </div>

                {/* Right arrow */}
                <div className="text-gray-400 text-xl">{">"}</div>
            </div>

            {/* Bottom: Last Transaction Preview */}
            {lastTransaction && (
                <div className="mt-3 text-sm">
                    <p className="text-gray-500">{lastTransaction.description}</p>
                    <p
                        className={
                            lastTransaction.amount > 0
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                        }
                    >
                        {lastTransaction.amount > 0 ? "+" : ""}
                        {lastTransaction.amount} coins
                    </p>
                    <small className="text-gray-400">
                        {new Date(lastTransaction.createdAt).toLocaleString()}
                    </small>
                </div>
            )}
        </div>
    );
}
