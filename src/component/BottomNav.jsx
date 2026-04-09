import { NavLink } from "react-router-dom";
import { FaHome, FaGamepad, FaComments, FaEllipsisH } from "react-icons/fa";

export default function BottomNav() {
  const base =
    "flex flex-col items-center text-xs transition-colors duration-200 flex-1";
  const active = "text-green-500";
  const inactive = "text-gray-400";

  return (
    <div className="fixed bottom-4 left-4 right-4 flex justify-between px-2 py-2 rounded-2xl bg-gradient-to-br from-black/60 via-gray-900/50 to-black/70 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-50">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `${base} ${isActive ? active : inactive}`
        }
      >
        <FaHome className="text-xl mb-1" />
        Home
      </NavLink>

      <NavLink
        to="/Gemes"
        className={({ isActive }) =>
          `${base} ${isActive ? active : inactive}`
        }
      >
        <FaGamepad className="text-xl mb-1" />
        Game
      </NavLink>

      <NavLink
        to="/chat"
        className={({ isActive }) =>
          `${base} ${isActive ? active : inactive}`
        }
      >
        <FaComments className="text-xl mb-1" />
        Chat
      </NavLink>

      <NavLink
        to="/Me"
        className={({ isActive }) =>
          `${base} ${isActive ? active : inactive}`
        }
      >
        <FaEllipsisH className="text-xl mb-1" />
        Me
      </NavLink>
    </div>
  );
}