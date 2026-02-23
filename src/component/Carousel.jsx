import { useState, useEffect, useRef } from "react";

// Slides using public folder
const slides = [
    { src: "/multA.jpg" },
    { src: "/multCA.jpg" },
    { src: "/multCall.jpg" },
    { src: "/multGra.jpg" },
    { src: "/multpunch.jpg" },
    { src: "/multRball.jpg" },];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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

  const nextSlide = () =>
    setCurrent((prev) => (prev + 1) % slides.length);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl
                 aspect-[16/9] h-48 sm:h-64 md:h-[400px]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={slides[current].src}
        alt={`Slide ${current + 1}`}
        className="w-full h-full object-cover transition duration-700"
      />

      {/* Prev */}
      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2
                   bg-black/40 backdrop-blur-sm text-white
                   w-8 h-8 rounded-full flex items-center justify-center
                   hover:bg-black/60 transition"
      >
        ❮
      </button>

      {/* Next */}
      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2
                   bg-black/40 backdrop-blur-sm text-white
                   w-8 h-8 rounded-full flex items-center justify-center
                   hover:bg-black/60 transition"
      >
        ❯
      </button>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 w-2.5 rounded-full transition
              ${current === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
