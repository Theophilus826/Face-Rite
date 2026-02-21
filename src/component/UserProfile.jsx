import { useParams, Link } from "react-router-dom";

export default function UserProfile() {
    const { id } = useParams();

    const user = users.find(u => u.id === parseInt(id));

    if (!user) return <p>User not found</p>;

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-xl">
            <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
                ← Back
            </Link>
            <div className="flex flex-col items-center gap-4">
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover"
                />
                <h1 className="text-xl font-bold">{user.name}</h1>
                <p className="text-gray-500">
                    {user.online ? "Online" : `Last seen ${user.lastSeen}`}
                </p>
            </div>
        </div>
    );
}
