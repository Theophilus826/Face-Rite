import { useDispatch, useSelector } from "react-redux";
import { withdrawCoins } from "../features/coins/CoinSlice";
import { useState } from "react";

export default function Withdraw() {
  const dispatch = useDispatch();
  const { balance, status } = useSelector((state) => state.coins);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleWithdraw = () => {
    if (!amount || amount <= 0) return alert("Enter valid amount");

    if (amount > balance) return alert("Insufficient balance");

    dispatch(
      withdrawCoins({
        amount: Number(amount),
        accountNumber,
        bankName,
      }),
    );
  };

  return (
    <div className="max-w-md mx-auto p-5 bg-white shadow rounded-xl">
      <h2 className="text-xl font-bold mb-4">Withdraw</h2>

      <p className="text-sm mb-3">Balance: ₦{balance.toLocaleString()}</p>

      <input
        type="number"
        placeholder="Amount"
        className="border p-2 w-full mb-3 rounded"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Account Number"
        className="border p-2 w-full mb-3 rounded"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
      />

      <input
        type="text"
        placeholder="Bank Name"
        className="border p-2 w-full mb-3 rounded"
        value={bankName}
        onChange={(e) => setBankName(e.target.value)}
      />

      <button
        onClick={handleWithdraw}
        className="bg-red-600 text-white w-full py-2 rounded"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Processing..." : "Withdraw"}
      </button>
    </div>
  );
}
