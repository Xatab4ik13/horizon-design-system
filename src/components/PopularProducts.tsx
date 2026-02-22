import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import showcaseMirror from "@/assets/showcase-mirror.png";
import showcasePano from "@/assets/showcase-pano.png";
import subEntranceDoors from "@/assets/sub-entrance-doors.jpg";

const showcaseItems = [
  {
    title: "Панно",
    tagline: "Искусство в дереве",
    description: "Резные декоративные панно из массива — центр притяжения любого интерьера",
    image: showcasePano,
    link: "/catalog?category=interior&subcategory=pano",
    transparent: true,
    cta: "Смотреть коллекцию",
  },
  {
    title: "Зеркала",
    tagline: "Рамы ручной работы",
    description: "Уникальные зеркала в резных деревянных рамах с авторским дизайном",
    image: showcaseMirror,
    link: "/catalog?category=interior&subcategory=mirrors",
    transparent: true,
    cta: "Выбрать зеркало",
  },
  {
    title: "Двери",
    tagline: "Массив натурального дерева",
    description: "Межкомнатные и входные двери — надёжность и эстетика на десятилетия",
    image: subEntranceDoors,
    link: "/catalog?category=doors",
    transparent: false,
    cta: "Открыть каталог",
  },
];

const Tilt3D = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ rotateX: 0, rotateY: 0 });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({ rotateX: -y * 18, rotateY: x * 22 });
  }, []);

  const handleLeave = useCallback(() => {
    setStyle({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ perspective: "1200px" }}>
      <div
        style={{
          transform: `rotateX(${style.rotateX}deg) rotateY(${style.rotateY}deg)`,
          transition: "transform 0.15s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const PopularProducts = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % showcaseItems.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + showcaseItems.length) % showcaseItems.length);
  }, []);

  const item = showcaseItems[current];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <div className="min-h-[85vh] md:min-h-[90vh] flex items-center relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
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
                <Tilt3D>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                  >
                    {item.transparent ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-[340px] h-[340px] md:w-[500px] md:h-[500px] lg:w-[580px] lg:h-[580px] object-contain drop-shadow-2xl"
                      />
                    ) : (
                      <div className="w-[340px] h-[340px] md:w-[500px] md:h-[500px] lg:w-[580px] lg:h-[580px] rounded-3xl overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </motion.div>
                </Tilt3D>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
          aria-label="Предыдущий"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
          aria-label="Следующий"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {showcaseItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
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
