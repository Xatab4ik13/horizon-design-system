import { useRef } from "react";
import { motion } from "framer-motion";
import heroVideo from "@/assets/hero-video.mp4";
import Logo from "@/components/Logo";
import { useHomepageContent } from "@/hooks/useSiteContent";

const DEFAULT_MARQUEE = "FAKTURA — изделия из натурального дерева ручной работы • панно • зеркала • мебель • двери • ";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const content = useHomepageContent();
  const marqueeText = content.hero?.marqueeText || DEFAULT_MARQUEE;
  const videoSrc = content.hero?.videoUrl || heroVideo;

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
        src={videoSrc}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Logo size="xl" linkTo="/" className="text-white/90 drop-shadow-lg" />
        </motion.div>
      </div>

      {/* Marquee / бегущая строка */}
      <div className="absolute bottom-12 left-0 right-0 z-10 overflow-hidden pointer-events-none">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              className="text-white/40 text-sm md:text-base font-light tracking-[0.15em] uppercase mx-4"
            >
              {marqueeText}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black pointer-events-none" />
    </section>
  );
};

export default HeroSection;
