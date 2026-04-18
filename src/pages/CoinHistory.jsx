import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCoinHistory } from "../features/coins/CoinSlice";

export default function CoinHistory() {
    const dispatch = useDispatch();

    const {
        history = [],
        isLoading,
    } = useSelector((state) => state.coins || {});

    useEffect(() => {
        dispatch(fetchCoinHistory());
    }, [dispatch]);

    // ✅ GROUP BY DATE
    const groupedHistory = useMemo(() => {
        return history.reduce((groups, item) => {
            const date = new Date(item.createdAt).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
            return groups;
        }, {});
    }, [history]);

    if (isLoading) return <p>Loading...</p>;

    if (!history.length) return <p>No coin history yet.</p>;

    return (
        <div>
            <h2>Coin History</h2>

            {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date} className="mb-4">
                    <h3 className="font-bold mb-2">{date}</h3>

                    {items.map((item) => (
                        <div
                            key={item._id}
                            className="border p-2 mb-2 flex justify-between"
                        >
                            <span>{item.description}</span>

                            <span
                                className={
                                    item.amount > 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }
                            >
                                {item.amount > 0 ? "+" : ""}
                                {item.amount}
                            </span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
