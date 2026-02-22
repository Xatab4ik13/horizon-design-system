import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { woodTypes, coatings } from "@/data/products";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface CatalogFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWoods: string[];
  onToggleWood: (wood: string) => void;
  selectedCoatings: string[];
  onToggleCoating: (coating: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  sizeRange: { length: [number, number]; width: [number, number]; height: [number, number] };
  onSizeChange: (dim: "length" | "width" | "height", range: [number, number]) => void;
  inStockOnly: boolean;
  onInStockChange: (val: boolean) => void;
}

const CatalogFilters = ({
  isOpen,
  onClose,
  selectedWoods,
  onToggleWood,
  selectedCoatings,
  onToggleCoating,
  priceRange,
  onPriceChange,
  sizeRange,
  onSizeChange,
  inStockOnly,
  onInStockChange,
}: CatalogFiltersProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
          className="overflow-hidden mb-8"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            exit={{ y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
            className="p-6 md:p-8 bg-card/80 backdrop-blur-sm rounded-2xl border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Фильтры</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Wood type */}
              <div>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Порода дерева</p>
                <div className="flex flex-wrap gap-2">
                  {woodTypes.map((wood, i) => (
                    <motion.button
                      key={wood.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => onToggleWood(wood.name)}
                      className={cn(
                        "relative overflow-hidden rounded-xl h-10 px-4 text-xs font-semibold transition-all duration-200",
                        selectedWoods.includes(wood.name)
                          ? "ring-2 ring-primary shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
                          : "ring-1 ring-border hover:ring-primary/40"
                      )}
                    >
                      <img
                        src={wood.image}
                        alt={wood.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-background/40" />
                      <span className="relative z-10 text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {wood.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Coating / Color */}
              <div>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Покрытие / Цвет</p>
                <div className="flex flex-wrap gap-2">
                  {coatings.map((coat, i) => (
                    <motion.button
                      key={coat.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => onToggleCoating(coat.name)}
                      className={cn(
                        "relative overflow-hidden rounded-xl h-10 px-4 text-xs font-semibold transition-all duration-200",
                        selectedCoatings.includes(coat.name)
                          ? "ring-2 ring-primary shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
                          : "ring-1 ring-border hover:ring-primary/40"
                      )}
                    >
                      <img
                        src={coat.image}
                        alt={coat.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-background/40" />
                      <span className="relative z-10 text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {coat.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Размеры (см)</p>
                <div className="space-y-3">
                  {([
                    { key: "length" as const, label: "Длина" },
                    { key: "width" as const, label: "Ширина" },
                    { key: "height" as const, label: "Высота" },
                  ]).map((dim) => (
                    <div key={dim.key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-14">{dim.label}</span>
                      <input
                        type="number"
                        value={sizeRange[dim.key][0]}
                        onChange={(e) =>
                          onSizeChange(dim.key, [Number(e.target.value), sizeRange[dim.key][1]])
                        }
                        className="w-20 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder="от"
                      />
                      <span className="text-muted-foreground text-xs">—</span>
                      <input
                        type="number"
                        value={sizeRange[dim.key][1]}
                        onChange={(e) =>
                          onSizeChange(dim.key, [sizeRange[dim.key][0], Number(e.target.value)])
                        }
                        className="w-20 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder="до"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Availability */}
              <div>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Цена и наличие</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => onPriceChange([Number(e.target.value), priceRange[1]])}
                      className="w-28 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="От"
                    />
                    <span className="text-muted-foreground text-xs">—</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
                      className="w-28 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="До"
                    />
                    <span className="text-xs text-muted-foreground">₽</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={inStockOnly}
                      onCheckedChange={onInStockChange}
                    />
                    <span className="text-xs text-foreground/80">Только в наличии</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CatalogFilters;
