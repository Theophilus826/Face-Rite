import { useState, useEffect, useRef } from "react";

// Slides using public folder
const slides = [
    { src: "/pa1.jpg" },
    { src: "/pa2.jpg" },
    { src: "/pa3.jpg" },
];

export default function Carousel() {
    const [current, setCurrent] = useState(0);
    const touchStart = useRef(0);
    const touchEnd = useRef(0);

    // Auto slide every 4s
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    // Swipe handling
    const handleTouchStart = (e) =>
        (touchStart.current = e.changedTouches[0].clientX);
    const handleTouchEnd = (e) => {
        touchEnd.current = e.changedTouches[0].clientX;
        const delta = touchStart.current - touchEnd.current;
        if (delta > 50) nextSlide();
        if (delta < -50) prevSlide();
    };

    const prevSlide = () =>
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);

    return (
        <div
            className="relative w-full overflow-hidden rounded-lg h-[400px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Only render the current slide */}
            <img
                src={slides[current].src}
                alt={`Slide ${current + 1}`}
                className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
            />

            {/* Prev/Next Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
            >
                ❮
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
            >
                ❯
            </button>

            {/* Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`h-2 w-2 rounded-full transition-colors ${current === index ? "bg-white" : "bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
