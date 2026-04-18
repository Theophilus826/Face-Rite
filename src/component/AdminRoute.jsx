import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Spinner from "./Spinner";

export default function AdminRoute() {
  const { user, isLoading } = useSelector((state) => state.auth);

  if (isLoading) return <Spinner />;

  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
