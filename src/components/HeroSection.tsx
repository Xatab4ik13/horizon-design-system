import { useState, useRef, useCallback } from "react";
import heroVideo1 from "@/assets/hero-video.mp4";
import heroVideo2 from "@/assets/hero-video-2.mp4";

const videos = [heroVideo1, heroVideo2];

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [opacity, setOpacity] = useState([1, 0]);
  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];

  const handleVideoEnd = useCallback(() => {
    const next = activeIndex === 0 ? 1 : 0;
    // Start playing next video
    videoRefs[next].current?.play();
    // Crossfade
    setOpacity(prev => prev.map((_, i) => (i === next ? 1 : 0)));
    setActiveIndex(next);
  }, [activeIndex]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {videos.map((src, i) => (
        <video
          key={i}
          ref={videoRefs[i]}
          autoPlay={i === 0}
          muted
          playsInline
          onEnded={i === activeIndex ? handleVideoEnd : undefined}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: opacity[i] }}
          src={src}
        />
      ))}
      <div className="absolute inset-0 bg-black/30" />
      {/* Fade to categories */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black pointer-events-none" />
    </section>
  );
};

export default HeroSection;
