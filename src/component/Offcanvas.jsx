import { useState } from "react";

export default function Offcanvas() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Hamburger */}
            <button
                onClick={() => setOpen(true)}
                className="p-2 bg-gray-800 text-white rounded md:hidden"
            >
                ☰
            </button>

            {/* Overlay */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/60 z-40"
                />
            )}

            {/* Menu */}
            <div
                className={`bottom-0 top-0 right-0 h-full w-64 bg-white z-50
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h1 className="text-xl font-bold">MyApp</h1>
                    <button onClick={() => setOpen(false)}>✕</button>
                </div>

                {/* Links */}
                <nav className="p-4 space-y-4 text-lg">
                    <a href="#" className="block">Home</a>
                    <a href="#" className="block">Wallet</a>
                    <a href="#" className="block">Shop</a>
                    <a href="#" className="block">Logout</a>
                </nav>
            </div>
        </>
    );
}
