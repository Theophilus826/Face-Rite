import { useNavigate } from "react-router-dom";

export default function UserCardList() {
    const navigate = useNavigate();

    return (
        <div className="max-w-md mx-auto space-y-3">
            {users.map(user => (
                <div
                    key={user.id}
                    onClick={() => navigate(`/user/${user.id}`)}
                    className="flex items-center justify-between bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                  ${user.online ? "bg-green-500" : "bg-gray-400"}`}
                            />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-500">
                                {user.online ? "Online" : `Last seen ${user.lastSeen}`}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
