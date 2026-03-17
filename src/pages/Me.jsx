import { Eye, EyeOff } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { logout, reset } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";

function Me() {
  const coins = useSelector((state) => state.coins.value);
  const [showBalance, setShowBalance] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate("/");
  };

  return (
    <div className="p-4 space-y-4">
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

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default Me;