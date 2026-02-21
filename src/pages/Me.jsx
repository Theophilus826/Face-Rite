import { Eye, EyeOff } from "lucide-react";
import { useSelector } from "react-redux";
import { useState } from "react";

function Me() {
    const coins = useSelector((state) => state.coins.value);
    const [showBalance, setShowBalance] = useState(true);

    return (
        <div className="p-4">
            <div className="bg-white shadow-md rounded-xl p-4 flex items-center justify-between">

                {/* Balance Info */}
                <div>
                    <p className="text-sm text-gray-500">Wallet Balance</p>
                    <p className="text-xl font-semibold">
                        {showBalance ? `₦${coins ?? 0}` : "••••••"}
                    </p>
                </div>

                {/* Eye Toggle */}
                <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-gray-600"
                >
                    {showBalance ? <Eye size={22} /> : <EyeOff size={22} />}
                </button>
            </div>
        </div>
    );
}

export default Me;
