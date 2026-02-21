import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, loginUser, reset } from "../features/AuthSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../component/Spinner";

export default function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) toast.error(message);

        // Automatically log in after successful registration
        if (isSuccess) {
            toast.success("Registration successful");
            dispatch(loginUser({ email: formData.email, password: formData.password }));
        }

        if (user) navigate("/welcome");

        dispatch(reset());
    }, [isError, isSuccess, message, dispatch, navigate, user, formData.email, formData.password]);

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        dispatch(registerUser(formData));
    };

    if (isLoading) return <Spinner />;

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
            <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <input
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={onChange}
                    className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={onChange}
                    className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={onChange}
                    className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={onChange}
                    className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {isLoading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
}
