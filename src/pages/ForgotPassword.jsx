// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, reset } from "../features/AuthSlice";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const dispatch = useDispatch();

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) toast.error(message);
        if (isSuccess) toast.success(message);
        dispatch(reset());
    }, [isError, isSuccess, message, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }
        dispatch(forgotPassword(email));
    };

    if (isLoading) return <Spinner />;

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
            <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
            </form>
        </div>
    );
}
