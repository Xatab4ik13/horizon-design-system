import { Link } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useState, useEffect, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import showcaseMirror from "@/assets/showcase-mirror.png";
import showcasePano from "@/assets/showcase-pano.png";
import { useHomepageContent } from "@/hooks/useSiteContent";

const defaultShowcaseItems = [
  {
    title: "Панно",
    tagline: "Искусство в дереве",
    description: "Резные декоративные панно из массива — центр притяжения любого интерьера",
    image: showcasePano,
    link: "/catalog?category=interior&sub=pano",
    cta: "Выбрать",
    bg: "radial-gradient(ellipse at 30% 50%, hsl(25 40% 12%) 0%, hsl(20 20% 6%) 50%, hsl(0 0% 2%) 100%)",
  },
  {
    title: "Зеркала",
    tagline: "Рамы ручной работы",
    description: "Уникальные зеркала в резных деревянных рамах с авторским дизайном",
    image: showcaseMirror,
    link: "/catalog?category=interior&sub=mirrors",
    cta: "Выбрать",
    bg: "radial-gradient(ellipse at 70% 40%, hsl(210 20% 14%) 0%, hsl(220 15% 7%) 50%, hsl(0 0% 2%) 100%)",
  },
];

const AutoTilt3D = memo(({ children }: { children: React.ReactNode }) => (
  <div style={{ perspective: "1200px" }}>
    <div
      className="auto-tilt-3d"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </div>
  </div>
));
AutoTilt3D.displayName = "AutoTilt3D";

const slideVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    rotateY: dir > 0 ? 25 : -25,
    scale: 0.92,
    x: dir > 0 ? 120 : -120,
  }),
  center: { opacity: 1, rotateY: 0, scale: 1, x: 0 },
  exit: (dir: number) => ({
    opacity: 0,
    rotateY: dir > 0 ? -20 : 20,
    scale: 0.94,
    x: dir > 0 ? -100 : 100,
  }),
};

const PopularProducts = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const content = useHomepageContent();
  const overrides = content.popular?.items ?? [];
  const sectionBgImage = content.popular?.bgImage?.trim();
  const total = Math.max(defaultShowcaseItems.length, overrides.length);
  const showcaseItems = Array.from({ length: total }, (_, i) => {
    const def = defaultShowcaseItems[i];
    const ov = overrides[i];
    const base = def ?? {
      title: "", tagline: "", description: "", cta: "Выбрать", image: "",
      link: "/catalog", bg: "radial-gradient(ellipse at 50% 50%, hsl(25 40% 12%) 0%, hsl(20 20% 6%) 50%, hsl(0 0% 2%) 100%)",
    };
    return {
      ...base,
      title: ov?.title?.trim() || base.title,
      tagline: ov?.tagline?.trim() || base.tagline,
      description: ov?.description?.trim() || base.description,
      cta: ov?.cta?.trim() || base.cta,
      image: ov?.image?.trim() || base.image,
      enabled: ov?.enabled !== false,
    };
  }).filter((it) => it.enabled && it.title);

  const paginate = useCallback((dir: number) => {
    setDirection(dir);
    setCurrent((c) => (c + dir + showcaseItems.length) % showcaseItems.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  }, [current]);

  useEffect(() => {
    if (current >= showcaseItems.length) setCurrent(0);
  }, [showcaseItems.length, current]);

  useEffect(() => {
    if (paused || showcaseItems.length < 2) return;
    const timer = setInterval(() => paginate(1), 3000);
    return () => clearInterval(timer);
  }, [paused, paginate, current, showcaseItems.length]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 40;
    const velocity = info.velocity.x;
    if (info.offset.x < -threshold || velocity < -300) paginate(1);
    else if (info.offset.x > threshold || velocity > 300) paginate(-1);
  };

  if (showcaseItems.length === 0) return null;
  const item = showcaseItems[current] ?? showcaseItems[0];

  return (
    <section
      className="relative overflow-hidden transition-[background] duration-1000 bg-cover bg-center"
      style={sectionBgImage ? { backgroundImage: `url(${sectionBgImage})` } : { background: item.bg }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-t from-transparent to-[hsl(0_0%_2%)] z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[hsl(0_0%_2%)] z-10 pointer-events-none" />
      <div className="min-h-[80vh] md:min-h-[90vh] flex items-center relative" style={{ perspective: "1400px" }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          className="container mx-auto px-4 py-12 md:py-16 cursor-grab active:cursor-grabbing touch-pan-y"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 md:gap-4 w-full pointer-events-none"
            >
              {/* Text */}
              <div className="w-full md:w-1/2 text-center md:text-left pointer-events-auto md:pl-12 lg:pl-20 xl:pl-28 md:pr-4">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-block text-primary text-sm uppercase tracking-[0.25em] font-medium mb-3"
                >
                  {item.tagline}
                </motion.span>

                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-none mb-4"
                >
                  {item.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto md:mx-0"
                >
                  {item.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-base font-medium uppercase tracking-wider hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
                  >
                    {item.cta}
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>

              {/* Image */}
              <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                <AutoTilt3D>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-[280px] h-[280px] md:w-[400px] md:h-[400px] lg:w-[480px] lg:h-[480px] object-contain drop-shadow-2xl pointer-events-none ml-auto"
                    />
                  </motion.div>
                </AutoTilt3D>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation arrows */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/0 flex items-center justify-center text-transparent hover:text-white hover:border-white/40 hover:backdrop-blur-sm transition-all duration-300"
          aria-label="Предыдущий"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/0 flex items-center justify-center text-transparent hover:text-white hover:border-white/40 hover:backdrop-blur-sm transition-all duration-300"
          aria-label="Следующий"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {showcaseItems.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === current
                  ? "w-10 bg-primary"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
