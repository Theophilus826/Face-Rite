import {
  Sparkles,
  LogOut,
  UserCircle2,
  ShieldCheck,
} from "lucide-react";

import { useDispatch } from "react-redux";
import { logout, reset } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";

import CoinBalanceCard from "../component/CoinBalanceCard";
import AboutPage from "./AboutPage";

export default function Me() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 blur-3xl rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 pb-32">
        {/* PROFILE CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />

          <div className="relative flex items-center gap-4">
            {/* AVATAR */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              <UserCircle2 size={42} className="text-white" />
            </div>

            {/* TEXT */}
            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  size={18}
                  className="text-yellow-400"
                />

                <h1 className="text-2xl font-bold">
                  AI Hub
                </h1>
              </div>

              <p className="text-gray-400 mt-1">
                Your gaming & AI universe
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <ShieldCheck size={14} />
                Verified Account
              </div>
            </div>
          </div>
        </div>

        {/* COIN CARD */}
        <div className="rounded-3xl overflow-hidden">
          <CoinBalanceCard />
        </div>

        {/* ABOUT */}
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
          <AboutPage />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLogout}
            className="
              group
              flex items-center gap-3
              px-8 py-4
              rounded-2xl
              bg-red-500/90
              hover:bg-red-600
              transition-all duration-300
              shadow-xl
              hover:scale-105
              active:scale-95
            "
          >
            <LogOut
              size={20}
              className="group-hover:rotate-12 transition"
            />

            <span className="font-semibold text-lg">
              Logout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}