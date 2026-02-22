import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, SlidersHorizontal, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products, categories, materials } from "@/data/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";
import categoryCrafts from "@/assets/category-crafts.png";
import categoryDoors from "@/assets/category-doors.png";

const categoryImages: Record<string, string> = {
  furniture: categoryTable,
  kitchen: categoryChairs,
  storage: categoryDecor,
  interior: categoryShelves,
  crafts: categoryCrafts,
  doors: categoryDoors,
};

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || null;
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (selectedMaterials.length > 0) {
      result = result.filter((p) => selectedMaterials.includes(p.material));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [activeCategory, selectedMaterials, priceRange, sortBy]);

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const setCategory = (slug: string | null) => {
    if (!slug) {
      searchParams.delete("category");
    } else {
      searchParams.set("category", slug);
    }
    setSearchParams(searchParams);
    setSelectedMaterials([]);
    setShowFilters(false);
  };

  const activeCategoryData = categories.find((c) => c.slug === activeCategory);

  // --- Category selection view ---
  if (!activeCategory) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <section
            className="py-16"
            style={{
              background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)"
            }}
          >
            <div className="container mx-auto px-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16"
              >
                Категории каталога
              </motion.h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.slug}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <button
                      onClick={() => setCategory(cat.slug)}
                      className="group w-full text-center focus:outline-none"
                    >
                      <div className="relative h-64 md:h-80 flex items-center justify-center mb-4">
                        {categoryImages[cat.slug] ? (
                          <img
                            src={categoryImages[cat.slug]}
                            alt={cat.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground text-4xl">✦</div>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // --- Products view with filters ---
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Back + Title */}
          <div className="flex items-center gap-4 mb-10">
            <button
              onClick={() => setCategory(null)}
              className="p-2.5 rounded-full bg-card border border-border hover:border-primary/40 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground/70" />
            </button>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-foreground"
            >
              {activeCategoryData?.name || "Каталог"}
            </motion.h1>
          </div>

          {/* Subcategory tabs (other categories as quick switch) */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategory(cat.slug)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                  activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground/70 hover:text-primary hover:border-primary/40"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "товар" : filteredProducts.length < 5 ? "товара" : "товаров"}
            </p>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="default">По умолчанию</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Фильтры
              </Button>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 p-6 bg-card rounded-2xl border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Фильтры</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Материал</p>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((mat) => (
                      <button
                        key={mat}
                        onClick={() => toggleMaterial(mat)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium transition-all",
                          selectedMaterials.includes(mat)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Цена</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-28 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      placeholder="От"
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-28 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      placeholder="До"
                    />
                    <span className="text-xs text-muted-foreground">₽</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  to={`/product/${product.id}`}
                  className="group block bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {product.isNew && (
                      <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        Новинка
                      </span>
                    )}
                    {product.oldPrice && (
                      <span className="absolute top-3 right-12 bg-destructive text-destructive-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/70 hover:bg-background transition-colors"
                    >
                      <Heart className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {categories.find((c) => c.slug === product.category)?.name} · {product.material}
                    </p>
                    <h3 className="font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-primary font-bold text-lg">
                        {product.price.toLocaleString("ru-RU")} ₽
                      </span>
                      {product.oldPrice && (
                        <span className="text-muted-foreground line-through text-sm">
                          {product.oldPrice.toLocaleString("ru-RU")} ₽
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      В корзину
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Товары не найдены</p>
              <Button variant="outline" className="mt-4" onClick={() => { setCategory(activeCategory); setSelectedMaterials([]); }}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CatalogPage;
