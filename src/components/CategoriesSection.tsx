import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";

const categories = [
  { name: "Столы", slug: "tables", image: categoryTable },
  { name: "Стулья", slug: "chairs", image: categoryChairs },
  { name: "Декор", slug: "decor", image: categoryDecor },
  { name: "Полки", slug: "shelves", image: categoryShelves },
];

const CategoriesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          Категории каталога
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="group relative h-80 overflow-visible"
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
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                  />
                </motion.div>
              ) : (
                <div className="absolute inset-0 bg-muted/30" />
              )}
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2">
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
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
