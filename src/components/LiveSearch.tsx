import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Tag, FolderOpen } from "lucide-react";
import { products, categories } from "@/data/products";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "product" | "category";
  id: string;
  name: string;
  subtitle?: string;
  image?: string;
  url: string;
  sku?: string;
  price?: number;
}

const formatPrice = (n: number) => n.toLocaleString("ru-RU") + " ₽";

interface LiveSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveSearch = ({ isOpen, onClose }: LiveSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  const search = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const lower = q.toLowerCase();
    const found: SearchResult[] = [];

    // Search products by name, SKU, material
    products.forEach((p) => {
      const matchName = p.name.toLowerCase().includes(lower);
      const matchSku = p.sku.toLowerCase().includes(lower);
      const matchMaterial = p.material.toLowerCase().includes(lower);
      const matchDesc = p.description.toLowerCase().includes(lower);

      if (matchName || matchSku || matchMaterial || matchDesc) {
        found.push({
          type: "product",
          id: p.id,
          name: p.name,
          subtitle: `${p.sku} · ${p.material}`,
          image: p.images[0],
          url: `/product/${p.id}`,
          sku: p.sku,
          price: p.price,
        });
      }
    });

    // Search categories
    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(lower)) {
        found.push({
          type: "category",
          id: cat.slug,
          name: cat.name,
          subtitle: `${cat.subcategories.length} подкатегорий`,
          url: `/catalog?category=${cat.slug}`,
        });
      }
      // Search subcategories
      cat.subcategories.forEach((sub) => {
        if (sub.name.toLowerCase().includes(lower)) {
          found.push({
            type: "category",
            id: sub.slug,
            name: sub.name,
            subtitle: cat.name,
            url: `/catalog?category=${cat.slug}&subcategory=${sub.slug}`,
          });
        }
      });
    });

    setResults(found.slice(0, 8));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    search(v);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-[70] pt-8 px-4"
          >
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border/40 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                {/* Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={handleChange}
                    placeholder="Поиск по названию, артикулу, категории..."
                    className="flex-1 bg-transparent text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-lg px-2 py-1 transition-colors"
                  >
                    ESC
                  </button>
                </div>

                {/* Results */}
                {query.length >= 2 && (
                  <div className="max-h-[60vh] overflow-y-auto">
                    {results.length > 0 ? (
                      <div className="py-2">
                        {results.map((r, i) => (
                          <motion.div
                            key={`${r.type}-${r.id}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Link
                              to={r.url}
                              onClick={onClose}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-primary/5 transition-colors group"
                            >
                              {r.type === "product" && r.image ? (
                                <img
                                  src={r.image}
                                  alt={r.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-border/30 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {r.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  {r.sku && <Tag className="h-3 w-3 inline shrink-0" />}
                                  {r.subtitle}
                                </p>
                              </div>
                              {r.price && (
                                <span className="text-sm font-semibold text-primary shrink-0">
                                  {formatPrice(r.price)}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-muted-foreground text-sm">Ничего не найдено по запросу «{query}»</p>
                        <p className="text-muted-foreground/50 text-xs mt-1">Попробуйте изменить запрос или искать по артикулу</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Hints when empty */}
                {query.length < 2 && (
                  <div className="px-5 py-4">
                    <p className="text-xs text-muted-foreground/60 mb-3">Попробуйте:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Панно", "Зеркало", "DW-INT", "Дуб", "Мебель"].map((hint) => (
                        <button
                          key={hint}
                          onClick={() => { setQuery(hint); search(hint); }}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-full border border-border/30",
                            "text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                          )}
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LiveSearch;
