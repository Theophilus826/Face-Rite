import { NavLink } from "react-router-dom";
import { FaHome, FaGamepad, FaWallet, FaEllipsisH } from "react-icons/fa";

export default function BottomNav() {
  const base =
    "flex flex-col items-center text-xs transition-colors duration-200";
  const active = "text-green-500";
  const inactive = "text-gray-400";

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500/80 border-t border-gray-700/40 z-50 backdrop-blur-md rounded-t-xl">
      <div className="flex justify-around py-3">
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
          to="/post"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <FaWallet className="text-xl mb-1" />
          Post
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
    </div>
  );
}