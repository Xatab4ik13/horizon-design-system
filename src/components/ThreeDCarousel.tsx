import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useMediaQuery(
  query: string,
  { defaultValue = false }: { defaultValue?: boolean } = {}
): boolean {
  const getMatches = (q: string): boolean =>
    typeof window !== "undefined" ? window.matchMedia(q).matches : defaultValue;

  const [matches, setMatches] = useState(() => getMatches(query));

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

const duration = 0.4;
const transition = { duration, ease: [0.25, 0.1, 0.25, 1] as const };
const transitionOverlay = { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const };

const Cylinder = memo(
  ({
    handleClick,
    controls,
    cards,
    isActive,
  }: {
    handleClick: (url: string, i: number) => void;
    controls: ReturnType<typeof useAnimation>;
    cards: string[];
    isActive: boolean;
  }) => {
    const isSm = useMediaQuery("(max-width: 640px)");
    const cylinderWidth = isSm ? 2200 : 3600;
    const faceCount = cards.length;
    const faceWidth = cylinderWidth / faceCount;
    const radius = cylinderWidth / (2 * Math.PI);
    const rotation = useMotionValue(0);
    const transform = useTransform(rotation, (v) => `rotate3d(0,1,0,${v}deg)`);

    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          perspective: "1400px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDrag={(_, info) =>
            isActive && rotation.set(rotation.get() + info.offset.x * 0.02)
          }
          onDragEnd={(_, info) =>
            isActive &&
            controls.start({
              rotateY: rotation.get() + info.velocity.x * 0.01,
              transition: {
                type: "spring",
                stiffness: 40,
                damping: 25,
                mass: 0.8,
              },
            })
          }
          animate={controls}
        >
          {cards.map((url, i) => (
            <motion.div
              key={`card-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-2xl p-3"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
              }}
              onClick={() => handleClick(url, i)}
            >
              <motion.img
                src={url}
                alt={`Интерьер ${i + 1}`}
                layoutId={`img-${url}`}
                className="pointer-events-none w-full rounded-2xl object-cover aspect-[16/10] shadow-lg"
                initial={{ filter: "blur(4px)" }}
                layout="position"
                animate={{ filter: "blur(0px)" }}
                transition={transition}
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }
);

interface ThreeDCarouselProps {
  images: string[];
}

function ThreeDCarousel({ images }: ThreeDCarouselProps) {
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const controls = useAnimation();

  const handleClick = (url: string) => {
    setActiveImg(url);
    setIsActive(false);
    controls.stop();
  };

  const handleClose = () => {
    setActiveImg(null);
    setIsActive(true);
  };

  return (
    <motion.div layout className="relative">
      <AnimatePresence mode="sync">
        {activeImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layoutId={`img-container-${activeImg}`}
            layout="position"
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
            style={{ willChange: "opacity" }}
            transition={transitionOverlay}
          >
            <motion.img
              layoutId={`img-${activeImg}`}
              src={activeImg}
              alt="Просмотр"
              className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl"
               initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1] as const,
              }}
              style={{ willChange: "transform" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative h-[600px] md:h-[700px] lg:h-[800px] w-full overflow-hidden">
        <Cylinder
          handleClick={handleClick}
          controls={controls}
          cards={images}
          isActive={isActive}
        />
      </div>
    </motion.div>
  );
}

export default ThreeDCarousel;
