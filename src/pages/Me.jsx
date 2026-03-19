import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { logout, reset } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";

export default function Me() {
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
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 p-6">
      
      {/* Top Section - Wallet Card */}
      <div className="space-y-6">
        <div className="bg-white/30 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Wallet Balance</p>
            <p className="text-2xl font-semibold text-gray-900">
              {showBalance ? `₦${coins ?? 0}` : "••••••"}
            </p>
          </div>

          {/* Toggle Eye */}
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-gray-600 hover:text-gray-800 transition"
          >
            {showBalance ? <Eye size={24} /> : <EyeOff size={24} />}
          </button>
        </div>
      </div>

      {/* Bottom Section - Logo + Logout */}
      <div className="flex flex-col items-center mt-10 space-y-4">

        {/* React Icon Logo */}
        <div className="flex items-center gap-2 text-purple-600">
          <Sparkles size={28} />
          <span className="text-lg font-bold">AI Hub</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full max-w-xs bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold shadow-md transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}