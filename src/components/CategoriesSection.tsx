import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useHomepageContent } from "@/hooks/useSiteContent";
import { useProductCategories, resolveCategoryImage } from "@/hooks/useProductCategories";

const CategoriesSection = () => {
  const content = useHomepageContent();
  const allCategories = useProductCategories();
  const categories = allCategories.filter((c) => c.show_on_home);

  const title = content.categories?.title?.trim() || "Категории каталога";
  const bgImage = content.categories?.bgImage?.trim();
  const sectionStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "radial-gradient(ellipse at 50% 50%, hsl(25 40% 12%) 0%, hsl(20 20% 6%) 50%, hsl(0 0% 2%) 100%)" };

  return (
    <section
      className="py-16 relative"
      style={sectionStyle}
    >
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-t from-transparent to-[hsl(0_0%_2%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[hsl(0_0%_2%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl text-center mb-10 text-foreground">
          {title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
          {categories.map((cat, i) => {
            const image = resolveCategoryImage(cat);
            return (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.slug}`}
                className="group relative h-44 md:h-80 lg:h-96 overflow-visible"
              >
                {image ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src={image}
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
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
