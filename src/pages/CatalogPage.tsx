import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, SlidersHorizontal, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products, categories, materials, type Category } from "@/data/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";
import categoryCrafts from "@/assets/category-crafts.png";
import categoryDoors from "@/assets/category-doors.png";

// Subcategory images
import subTables from "@/assets/sub-tables.jpg";
import subBeds from "@/assets/sub-beds.jpg";
import subNightstands from "@/assets/sub-nightstands.jpg";
import subRacks from "@/assets/sub-racks.jpg";
import subShelves from "@/assets/sub-shelves.jpg";
import subCuttingBoards from "@/assets/sub-cutting-boards.jpg";
import subServingBoards from "@/assets/sub-serving-boards.jpg";
import subDishes from "@/assets/sub-dishes.jpg";
import subCompartmentDishes from "@/assets/sub-compartment-dishes.jpg";
import subSaladBowls from "@/assets/sub-salad-bowls.jpg";
import subTrays from "@/assets/sub-trays.jpg";
import subHangers from "@/assets/sub-hangers.jpg";
import subPano from "@/assets/sub-pano.jpg";
import subMirrors from "@/assets/sub-mirrors.jpg";
import subDecoupageBases from "@/assets/sub-decoupage-bases.jpg";
import subFigures from "@/assets/sub-figures.jpg";
import subInteriorDoors from "@/assets/sub-interior-doors.jpg";
import subEntranceDoors from "@/assets/sub-entrance-doors.jpg";

const subcategoryImages: Record<string, string> = {
  tables: subTables,
  beds: subBeds,
  nightstands: subNightstands,
  racks: subRacks,
  shelves: subShelves,
  "cutting-boards": subCuttingBoards,
  "serving-boards": subServingBoards,
  dishes: subDishes,
  "compartment-dishes": subCompartmentDishes,
  "salad-bowls": subSaladBowls,
  trays: subTrays,
  hangers: subHangers,
  pano: subPano,
  mirrors: subMirrors,
  "decoupage-bases": subDecoupageBases,
  figures: subFigures,
  "interior-doors": subInteriorDoors,
  "entrance-doors": subEntranceDoors,
};

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
  const activeSubcategory = searchParams.get("sub") || null;
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  const activeCategoryData = categories.find((c) => c.slug === activeCategory);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (activeSubcategory) {
      result = result.filter((p) => p.subcategory === activeSubcategory);
    }
    if (selectedMaterials.length > 0) {
      result = result.filter((p) => selectedMaterials.includes(p.material));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [activeCategory, activeSubcategory, selectedMaterials, priceRange, sortBy]);

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const setCategory = (slug: string | null) => {
    if (!slug) {
      searchParams.delete("category");
      searchParams.delete("sub");
    } else {
      searchParams.set("category", slug);
      searchParams.delete("sub");
    }
    setSearchParams(searchParams);
    setSelectedMaterials([]);
    setShowFilters(false);
  };

  const setSubcategory = (slug: string | null) => {
    if (!slug) {
      searchParams.delete("sub");
    } else {
      searchParams.set("sub", slug);
    }
    setSearchParams(searchParams);
  };

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
                className="text-4xl md:text-5xl text-center text-foreground mb-16"
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
                      <h3 className="text-lg md:text-xl text-foreground group-hover:text-primary transition-colors">
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
              className="text-4xl md:text-5xl text-foreground"
            >
              {activeCategoryData?.name || "Каталог"}
            </motion.h1>
          </div>

          {/* Subcategory cards */}
          {activeCategoryData && activeCategoryData.subcategories.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mb-10">
              {activeCategoryData.subcategories.map((sub, i) => (
                <motion.button
                  key={sub.slug}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  onClick={() => setSubcategory(activeSubcategory === sub.slug ? null : sub.slug)}
                  className={cn(
                    "relative h-[4.5rem] rounded-xl overflow-hidden border-2 transition-all duration-300 group",
                    activeSubcategory === sub.slug
                      ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  {subcategoryImages[sub.slug] && (
                    <img
                      src={subcategoryImages[sub.slug]}
                      alt={sub.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="relative z-10 h-full flex items-end justify-center pb-3 px-2">
                    <span className={cn(
                      "text-xs font-semibold text-center leading-tight transition-colors",
                      activeSubcategory === sub.slug ? "text-primary" : "text-foreground/90 group-hover:text-primary"
                    )}>
                      {sub.name}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

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
                    <h3 className="text-card-foreground mb-2 group-hover:text-primary transition-colors">
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
              <Button variant="outline" className="mt-4" onClick={() => { setSubcategory(null); setSelectedMaterials([]); }}>
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
