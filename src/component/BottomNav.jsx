import { NavLink } from "react-router-dom";
import { FaHome, FaHeadset, FaWallet, FaEllipsisH } from "react-icons/fa";
// import Offcanvas from "./Offcanvas";
import HostGame from '../component/HostGame';


export default function BottomNav() {

    const base =
        "flex flex-col items-center text-xs";
    const active =
        "text-green-500";
    const inactive =
        "text-gray-400";

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t">
            <div className="flex justify-around py-2">

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
                    to="/Games"
                    className={({ isActive }) =>
                        `${base} ${isActive ? active : inactive}`
                    }
                >
                    <FaHeadset className="text-xl mb-1" />
                    Support
                </NavLink>

                <NavLink
                    to="/savings"
                    className={({ isActive }) =>
                        `${base} ${isActive ? active : inactive}`
                    }
                >
                    <FaWallet className="text-xl mb-1" />
                    Savings
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
