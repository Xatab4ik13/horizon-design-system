import { Link } from "react-router-dom";

const categories = [
  { name: "Столы", slug: "tables", gradient: "from-[hsl(35,38%,40%)] to-[hsl(35,38%,25%)]" },
  { name: "Стулья", slug: "chairs", gradient: "from-[hsl(34,24%,44%)] to-[hsl(34,24%,28%)]" },
  { name: "Декор", slug: "decor", gradient: "from-[hsl(219,55%,20%)] to-[hsl(216,57%,14%)]" },
  { name: "Кухня", slug: "kitchen", gradient: "from-[hsl(37,19%,30%)] to-[hsl(37,19%,15%)]" },
];

const CategoriesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          Категории каталога
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="group relative h-64 rounded-xl overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} transition-transform duration-500 group-hover:scale-110`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
              <div className="relative z-10 h-full flex items-end p-6">
                <h3 className="text-xl font-semibold text-white group-hover:text-primary-foreground transition-colors">
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
