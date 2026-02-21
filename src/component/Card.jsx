import React from "react";

function Card() {
    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <img
                src="/football.jpg"
                alt="Football"
                className="w-full rounded-lg"
            />

            <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-6 text-white rounded-lg">
                <h5 className="text-2xl font-bold mb-2">Card Title</h5>

                <p className="mb-4">
                    This is a wider card with supporting text.
                </p>

                <p className="text-sm text-gray-300">
                    Last updated 3 mins ago
                </p>
            </div>
        </div>
    );
}

export default Card;
