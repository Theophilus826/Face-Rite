import { useState, useEffect, useRef } from "react";

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);

  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  // Fetch slides from backend
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const res = await fetch("/api/slides");
        const data = await res.json();

        // supports both: [] or { slides: [] }
        setSlides(data?.slides || data || []);
      } catch (err) {
        console.error("Error loading slides:", err);
        setSlides([]);
      }
    };

    loadSlides();
  }, []);

  // Reset index when slides change
  useEffect(() => {
    setCurrent(0);
  }, [slides]);

  // Auto slide
  useEffect(() => {
    if (slides.length < 2) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    if (!slides.length) return;
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (!slides.length) return;
    setCurrent((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const handleTouchStart = (e) => {
    touchStart.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEnd.current = e.changedTouches[0].clientX;

    const diff = touchStart.current - touchEnd.current;

    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
  };

  if (!slides.length) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl aspect-[16/9] h-48 sm:h-64 md:h-[400px]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image */}
      <img
        src={slides[current]?.src}
        alt={`Slide ${current + 1}`}
        className="w-full h-full object-cover transition duration-700"
      />

      {/* Prev Button */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2
                   bg-black/40 text-white w-8 h-8 rounded-full"
      >
        ❮
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2
                   bg-black/40 text-white w-8 h-8 rounded-full"
      >
        ❯
      </button>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              current === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}