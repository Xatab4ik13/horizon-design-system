import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { usePageHeader } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";

import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";

type GalleryItem = { src: string; title: string; span: string };

// Дефолтный набор — используется, если админ ещё не заполнил галерею в БД.
const defaultItems: GalleryItem[] = [
  { src: gallery1, title: "Гостиная с деревянными панелями", span: "tall" },
  { src: gallery2, title: "Столовая из массива дуба", span: "wide" },
  { src: gallery3, title: "Спальня с резным зеркалом", span: "normal" },
  { src: gallery4, title: "Прихожая с резной дверью", span: "normal" },
  { src: gallery5, title: "Кухня с деревянными аксессуарами", span: "tall" },
  { src: gallery6, title: "Гостиная с декоративным панно", span: "wide" },
  { src: gallery7, title: "Кабинет из натурального дерева", span: "normal" },
  { src: gallery8, title: "Ванная с деревянным зеркалом", span: "normal" },
];

const GalleryPage = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [items, setItems] = useState<GalleryItem[]>(defaultItems);
  const header = usePageHeader("gallery", { title: "Галерея", subtitle: "Наши изделия в интерьерах — вдохновляйтесь реальными примерами" });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("gallery_items")
      .select("image_url, title, span")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setItems(
            data.map((row) => ({
              src: row.image_url,
              title: row.title ?? "",
              span: row.span ?? "normal",
            })),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <SEO pageKey="gallery"
        title="Галерея работ"
        description="Галерея интерьеров с мебелью и декором FAKTURA. Реальные проекты наших мастеров — вдохновляйтесь примерами."
      />
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              {header.title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
              {header.subtitle}
            </p>
          </motion.div>

          {/* Uniform grid — выровненные ряды */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[4/3] bg-black/40"
                onClick={() => setLightbox(i)}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <span className="text-white text-sm font-medium tracking-wide">
                    {item.title}
                  </span>
                </div>
                {/* Border glow on hover */}
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/30 transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && items[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center cursor-pointer"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              key={lightbox}
              src={items[lightbox].src}
              alt={items[lightbox].title}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="max-w-[92vw] max-h-[88vh] rounded-2xl shadow-2xl object-contain"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-8 text-white/70 text-sm"
            >
              {items[lightbox].title}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default GalleryPage;
