import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import showcaseMirror from "@/assets/showcase-mirror.png";
import productPano1 from "@/assets/product-pano-1.jpeg";
import subEntranceDoors from "@/assets/sub-entrance-doors.jpg";

const showcaseItems = [
  {
    title: "Зеркала",
    subtitle: "Уникальные рамы ручной работы",
    image: showcaseMirror,
    link: "/catalog?category=interior&subcategory=mirrors",
    transparent: true,
  },
  {
    title: "Панно",
    subtitle: "Резные декоративные панно из массива",
    image: productPano1,
    link: "/catalog?category=interior&subcategory=pano",
    transparent: false,
  },
  {
    title: "Двери",
    subtitle: "Межкомнатные и входные из натурального дерева",
    image: subEntranceDoors,
    link: "/catalog?category=doors",
    transparent: false,
  },
];

const PopularProducts = () => {
  return (
    <section
      className="py-24 md:py-32 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-20 md:gap-28">
          {showcaseItems.map((item, i) => {
            const isEven = i % 2 === 0;

            return (
              <Link
                key={item.title}
                to={item.link}
                className="group block"
              >
                <div
                  className={`flex flex-col ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  } items-center gap-8 md:gap-16`}
                >
                  {/* Image */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -80 : 80 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full md:w-1/2 flex justify-center"
                  >
                    <div
                      className={`relative ${
                        item.transparent ? "w-[320px] h-[400px] md:w-[420px] md:h-[520px]" : "w-full max-w-lg h-[320px] md:h-[440px] rounded-2xl overflow-hidden"
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className={`w-full h-full ${
                          item.transparent ? "object-contain" : "object-cover rounded-2xl"
                        } transition-transform duration-700 group-hover:scale-105`}
                      />
                      {!item.transparent && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl" />
                      )}
                    </div>
                  </motion.div>

                  {/* Text */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 80 : -80 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                    className={`w-full md:w-1/2 ${
                      isEven ? "md:text-left" : "md:text-right"
                    } text-center`}
                  >
                    <h3 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 tracking-tight group-hover:text-primary transition-colors duration-500">
                      {item.title}
                    </h3>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto md:mx-0 leading-relaxed">
                      {item.subtitle}
                    </p>
                    <div
                      className={`mt-6 inline-flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                        isEven ? "" : "md:justify-end"
                      }`}
                    >
                      <span className="text-sm uppercase tracking-widest">Перейти в каталог</span>
                      <span className="text-lg">→</span>
                    </div>
                  </motion.div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
