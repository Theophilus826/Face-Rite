import React from "react";
import Card from "./Card";

const cards = [
    {
        id: 1,
        title: "Football Match",
        description: "Live stadium action tonight",
        image: "/football.jpg",
    },
    {
        id: 2,
        title: "Training Session",
        description: "Professional team practice",
        image: "/football.jpg",
    },
    {
        id: 3,
        title: "Championship Final",
        description: "The biggest game of the year",
        image: "/football.jpg",
    },
];

function CardGrid() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-3xl font-bold mb-8">
                Featured Events
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.id} {...card} />
                ))}
            </div>
        </div>
    );
}

export default CardGrid;
