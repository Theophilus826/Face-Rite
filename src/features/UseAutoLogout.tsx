// useAutoLogout.ts
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./AuthSlice";
import type { RootState } from "../app/store";

const INACTIVITY_LIMIT = 3 * 60 * 60 * 1000; // 3 hours
const CHECK_INTERVAL = 60 * 1000; // check every 1 min

const useAutoLogout = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!user) return; // only run if user is logged in

    const updateLastActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
    };

    const checkInactivity = () => {
      const last = Number(localStorage.getItem("lastActivity"));
      if (!last) return;
      if (Date.now() - last > INACTIVITY_LIMIT) {
        dispatch(logout());
        localStorage.removeItem("lastActivity");
        alert("You have been logged out due to inactivity");
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, updateLastActivity));

    updateLastActivity();
    const interval = setInterval(checkInactivity, CHECK_INTERVAL);

    const syncLogout = (e: StorageEvent) => {
      if (e.key === "user" && e.newValue === null) dispatch(logout());
    };
    window.addEventListener("storage", syncLogout);

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateLastActivity));
      window.removeEventListener("storage", syncLogout);
      clearInterval(interval);
    };
  }, [dispatch, user]);
};

export default useAutoLogout;