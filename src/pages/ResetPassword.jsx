// src/pages/ResetPassword.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword, reset } from "../features/AuthSlice";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";

export default function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) toast.error(message);
        if (isSuccess) {
            toast.success(message);
            navigate("/login");
        }
        dispatch(reset());
    }, [isError, isSuccess, message, dispatch, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!password) {
            toast.error("Please enter a new password");
            return;
        }

        dispatch(resetPassword({ token, password }));
    };

    if (isLoading) return <Spinner />;

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
            <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {isLoading ? "Resetting..." : "Reset Password"}
                </button>
            </form>
        </div>
    );
}
