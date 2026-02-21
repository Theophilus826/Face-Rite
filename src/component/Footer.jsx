import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Footer() {
    const [open, setOpen] = useState(false);

    // Example Redux usage (optional)
    const { user } = useSelector((state) => state.auth);

    return (
        <>
            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-300">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <p className="text-sm">
                        © {new Date().getFullYear()} Telecom. All rights reserved.
                    </p>

                    {/* Mobile button */}
                    <button
                        onClick={() => setOpen(true)}
                        className="md:hidden px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
                    >
                        Menu
                    </button>

                    {/* Desktop links */}
                    <div className="hidden md:flex gap-6 text-sm">
                        <Link to="/" className="hover:text-white">Home</Link>
                        <Link to="/about" className="hover:text-white">About</Link>
                        <Link to="/contact" className="hover:text-white">Contact</Link>

                        {user && (
                            <Link to="/dashboard" className="hover:text-white">
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </footer>

            {/* BOTTOM OFFCANVAS */}
            <Transition show={open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setOpen}>
                    {/* Overlay */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    {/* Panel */}
                    <div className="fixed inset-0 flex items-end">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="translate-y-full"
                            enterTo="translate-y-0"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="translate-y-0"
                            leaveTo="translate-y-full"
                        >
                            <Dialog.Panel className="w-full rounded-t-2xl bg-gray-900 text-gray-200 p-6">
                                {/* Header */}
                                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                                    <Dialog.Title className="text-lg font-semibold">
                                        Menu
                                    </Dialog.Title>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="text-2xl"
                                    >
                                        &times;
                                    </button>
                                </div>

                                {/* Links */}
                                <nav className="mt-6 flex flex-col gap-4 text-sm">
                                    <Link onClick={() => setOpen(false)} to="/" className="hover:text-white">
                                        Home
                                    </Link>
                                    <Link onClick={() => setOpen(false)} to="/about" className="hover:text-white">
                                        About
                                    </Link>
                                    <Link onClick={() => setOpen(false)} to="/contact" className="hover:text-white">
                                        Contact
                                    </Link>

                                    {user ? (
                                        <Link
                                            onClick={() => setOpen(false)}
                                            to="/dashboard"
                                            className="hover:text-white"
                                        >
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            onClick={() => setOpen(false)}
                                            to="/login"
                                            className="hover:text-white"
                                        >
                                            Login
                                        </Link>
                                    )}
                                </nav>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
