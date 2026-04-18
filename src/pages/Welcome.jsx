import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import API from "../features/Api";

export default function Welcome() {
    const { user } = useSelector((state) => state.auth);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWelcomeMessage = async () => {
            try {
                const res = await API.get("/users/welcome");
                setMessage(res.data.message);
            } catch (error) {
                console.error("Welcome fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWelcomeMessage();
    }, []);

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <h2>{message}</h2>
            )}
        </div>
    );
}
