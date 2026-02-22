import { useRef } from "react";
import heroVideo from "@/assets/hero-video.mp4";
import Logo from "@/components/Logo";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        src={heroVideo}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Logo size="xl" linkTo="/" className="text-white/90 drop-shadow-lg" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black pointer-events-none" />
    </section>
  );
};

export default HeroSection;
