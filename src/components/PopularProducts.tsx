import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import showcaseMirror from "@/assets/showcase-mirror.png";
import showcasePano from "@/assets/showcase-pano.png";
import showcaseDoors from "@/assets/showcase-doors.png";

const showcaseItems = [
  {
    title: "Панно",
    tagline: "Искусство в дереве",
    description: "Резные декоративные панно из массива — центр притяжения любого интерьера",
    image: showcasePano,
    link: "/catalog?category=interior&subcategory=pano",
    transparent: true,
    cta: "Смотреть коллекцию",
    bg: "radial-gradient(ellipse at 30% 50%, hsl(25 40% 12%) 0%, hsl(20 20% 6%) 50%, hsl(0 0% 2%) 100%)",
  },
  {
    title: "Зеркала",
    tagline: "Рамы ручной работы",
    description: "Уникальные зеркала в резных деревянных рамах с авторским дизайном",
    image: showcaseMirror,
    link: "/catalog?category=interior&subcategory=mirrors",
    transparent: true,
    cta: "Выбрать зеркало",
    bg: "radial-gradient(ellipse at 70% 40%, hsl(210 20% 14%) 0%, hsl(220 15% 7%) 50%, hsl(0 0% 2%) 100%)",
  },
  {
    title: "Двери",
    tagline: "Массив натурального дерева",
    description: "Межкомнатные и входные двери — надёжность и эстетика на десятилетия",
    image: showcaseDoors,
    link: "/catalog?category=doors",
    transparent: true,
    no3d: true,
    cta: "Открыть каталог",
    bg: "radial-gradient(ellipse at 50% 60%, hsl(15 30% 14%) 0%, hsl(10 20% 7%) 50%, hsl(0 0% 2%) 100%)",
  },
];

/** Autonomous 3D tilt — animates on its own, ignores mouse */
const AutoTilt3D = ({ children }: { children: React.ReactNode }) => {
  const [style, setStyle] = useState({ rotateX: 0, rotateY: 0 });
  const raf = useRef<number>(0);
  const t = useRef(Math.random() * 1000);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      t.current += 0.008;
      const rx = Math.sin(t.current * 1.3) * 8 + Math.sin(t.current * 2.7) * 4;
      const ry = Math.cos(t.current * 0.9) * 10 + Math.cos(t.current * 2.1) * 5;
      setStyle({ rotateX: rx, rotateY: ry });
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div style={{ perspective: "1200px" }}>
      <div
        style={{
          transform: `rotateX(${style.rotateX}deg) rotateY(${style.rotateY}deg)`,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const slideVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    rotateY: dir > 0 ? 25 : -25,
    scale: 0.92,
    x: dir > 0 ? 120 : -120,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    x: 0,
  },
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

  const paginate = useCallback((dir: number) => {
    setDirection(dir);
    setCurrent((c) => (c + dir + showcaseItems.length) % showcaseItems.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  }, [current]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => paginate(1), 7000);
    return () => clearInterval(timer);
  }, [paused, paginate, current]);

  const item = showcaseItems[current];

  return (
    <section
      className="relative overflow-hidden transition-[background] duration-1000"
      style={{ background: item.bg }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="min-h-[85vh] md:min-h-[90vh] flex items-center relative" style={{ perspective: "1400px" }}>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16 lg:gap-24"
            >
              {/* Text */}
              <div className="w-full md:w-5/12 text-center md:text-left">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-block text-primary text-sm uppercase tracking-[0.25em] font-medium mb-4"
                >
                  {item.tagline}
                </motion.span>

                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-none mb-6"
                >
                  {item.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto md:mx-0"
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
              <div className="w-full md:w-7/12 flex justify-center">
                {item.no3d ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-[306px] h-[306px] md:w-[450px] md:h-[450px] lg:w-[522px] lg:h-[522px] object-contain drop-shadow-2xl"
                    />
                  </motion.div>
                ) : (
                <AutoTilt3D>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-[306px] h-[306px] md:w-[450px] md:h-[450px] lg:w-[522px] lg:h-[522px] object-contain drop-shadow-2xl"
                    />
                  </motion.div>
                </AutoTilt3D>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation arrows — visible only on self-hover */}
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
