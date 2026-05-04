import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";
import categoryCrafts from "@/assets/category-crafts.png";
import categoryDoors from "@/assets/category-doors.png";
import { useHomepageContent } from "@/hooks/useSiteContent";

const defaultCategories = [
  { name: "Мебель", slug: "furniture", image: categoryTable },
  { name: "Кухонные принадлежности", slug: "kitchen", image: categoryChairs },
  { name: "Системы хранения", slug: "storage", image: categoryDecor },
  { name: "Предметы интерьера", slug: "interior", image: categoryShelves },
  { name: "Заготовки для творчества", slug: "crafts", image: categoryCrafts },
  { name: "Двери", slug: "doors", image: categoryDoors },
];

const CategoriesSection = () => {
  return (
    <section
      className="py-16 relative"
      style={{
        background: "radial-gradient(ellipse at 50% 50%, hsl(25 30% 10%) 0%, hsl(20 15% 6%) 50%, hsl(0 0% 2%) 100%)"
      }}
    >
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-t from-transparent to-[hsl(0_0%_2%)] pointer-events-none" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[hsl(0_0%_2%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl text-center mb-10 text-foreground">
          Категории каталога
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="group relative h-52 md:h-80 lg:h-96 overflow-visible"
            >
              {cat.image ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                  />
                </motion.div>
              ) : (
                <div className="absolute inset-0 bg-muted/30" />
              )}
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2">
                <h3 className="text-base md:text-xl text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
