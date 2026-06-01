import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingCart, ArrowLeft, Smartphone, Ruler, Weight,
  TreePine, Check, Star, ChevronLeft, ChevronRight,
  X, Droplets, MessageCircle, ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/products";
import { useDbProduct } from "@/lib/dbProducts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import SEO, { buildProductJsonLd, buildBreadcrumbJsonLd, buildFAQJsonLd } from "@/components/SEO";

// ─── Stars ───
const Stars = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={cn("transition-colors", s <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/30")}
        style={{ width: size, height: size }}
      />
    ))}
  </div>
);

// ─── Gallery ───
const ProductGallery = ({
  images,
  name,
  isNew,
  oldPrice,
  price,
  onARClick,
  hasAR,
}: {
  images: string[];
  name: string;
  isNew?: boolean;
  oldPrice?: number;
  price: number;
  onARClick: () => void;
  hasAR: boolean;
}) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (dir: number) => setActive((a) => (a + dir + images.length) % images.length),
    [images.length]
  );

  return (
    <>
      <div>
        {/* Main image */}
        <div
          className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border mb-3 cursor-pointer group"
          onClick={() => setLightbox(true)}
        >
          <img
            src={images[active]}
            alt={name}
            decoding="async"
            className="w-full h-full object-cover"
          />
          {isNew && (
            <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full z-10">
              Новинка
            </span>
          )}
          {oldPrice && (
            <span className="absolute top-4 left-24 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1.5 rounded-full z-10">
              -{Math.round((1 - price / oldPrice) * 100)}%
            </span>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}
          {/* Dot indicators for mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 md:hidden">
              {images.map((_, i) => (
                <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === active ? "w-4 bg-primary" : "bg-white/40")} />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails — scrollable */}
        <div ref={thumbRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "w-14 h-14 md:w-18 md:h-18 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0",
                active === i ? "border-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]" : "border-border hover:border-primary/40"
              )}
            >
              <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          ))}
          {hasAR && (
            <button
              onClick={onARClick}
              className="w-14 h-14 md:w-18 md:h-18 rounded-xl border-2 border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1 transition-colors shrink-0"
            >
              <Smartphone className="h-5 w-5 text-primary" />
              <span className="text-[10px] text-muted-foreground">AR</span>
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}
            <motion.img
              key={active}
              src={images[active]}
              alt={name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl"
            />
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === active ? "w-8 bg-primary" : "bg-white/30 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Product Card (for cross-sells) ───
const MiniProductCard = ({ productId }: { productId: string }) => {
  // Связанные товары пока не реализованы для БД-каталога
  return null;
};

// ─── Main page ───
const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { product, loading: productLoading } = useDbProduct(id);
  const { addItem } = useCart();
  const [showAR, setShowAR] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"reviews" | "qa">("reviews");
  const [isFavorite, setIsFavorite] = useState(false);

  const categoryData = useMemo(() => categories.find((c) => c.slug === product?.category), [product]);

  const computedPrice = useMemo(() => {
    if (!product) return 0;
    let p = product.price;
    (product.variations || []).forEach((v) => {
      const sel = selectedVariations[v.type];
      if (sel) {
        const opt = v.options.find((o) => o.value === sel);
        if (opt?.priceModifier) p += opt.priceModifier;
      }
    });
    return p;
  }, [product, selectedVariations]);

  // Compute dynamic specs based on variations
  const currentMaterial = useMemo(() => {
    if (!product) return "";
    const woodVar = product.variations?.find(v => v.type === "wood");
    const sel = selectedVariations["wood"];
    if (woodVar && sel) {
      const opt = woodVar.options.find(o => o.value === sel);
      return opt?.label || product.material;
    }
    return product.material;
  }, [product, selectedVariations]);

  const currentCoating = useMemo(() => {
    if (!product) return "";
    const coatVar = product.variations?.find(v => v.type === "coating");
    const sel = selectedVariations["coating"];
    if (coatVar && sel) {
      const opt = coatVar.options.find(o => o.value === sel);
      return opt?.label || product.coating;
    }
    return product.coating;
  }, [product, selectedVariations]);

  const currentDimensions = useMemo(() => {
    if (!product) return "";
    const sizeVar = product.variations?.find(v => v.type === "size");
    const sel = selectedVariations["size"];
    if (sizeVar && sel) {
      const opt = sizeVar.options.find(o => o.value === sel);
      return opt?.label || product.dimensions;
    }
    return product.dimensions;
  }, [product, selectedVariations]);

  // Подмена основного фото при выборе варианта (например, по породе)
  const displayImages = useMemo(() => {
    if (!product) return [];
    const map = product.imagesByVariation;
    if (!map) return product.images;
    for (const [type, val] of Object.entries(selectedVariations)) {
      if (!val) continue;
      const key = `${type}:${val}`;
      const url = map[key];
      if (url) {
        const rest = product.images.filter((i) => i !== url);
        return [url, ...rest];
      }
    }
    return product.images;
  }, [product, selectedVariations]);

  // Build variation labels for cart
  const variationLabels = useMemo(() => {
    if (!product) return {};
    const labels: Record<string, string> = {};
    (product.variations || []).forEach(v => {
      const sel = selectedVariations[v.type];
      if (sel) {
        const opt = v.options.find(o => o.value === sel);
        if (opt) labels[v.label] = opt.label;
      }
    });
    return labels;
  }, [product, selectedVariations]);

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 flex justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)" }}>
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Товар не найден</h1>
            <Button asChild variant="outline"><Link to="/catalog">Вернуться в каталог</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedProducts: string[] = [];
  const crossSellProducts: string[] = [];

  const productJsonLd = buildProductJsonLd(product);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Каталог", url: "/catalog" },
    { name: categoryData?.name || "", url: `/catalog?category=${product.category}` },
    { name: product.name, url: `/product/${product.id}` },
  ]);
  const faqJsonLd = product.qa.length > 0
    ? buildFAQJsonLd(product.qa.map((q) => ({ question: q.question, answer: q.answer })))
    : null;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)" }}>
      <SEO
        title={`${product.name} — ${product.material}`}
        description={product.description}
        image={product.images[0]}
        type="product"
        jsonLd={[productJsonLd, breadcrumbJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])]}
      />
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-primary transition-colors">Каталог</Link>
            <span>/</span>
            <Link to={`/catalog?category=${product.category}`} className="hover:text-primary transition-colors">{categoryData?.name}</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          {/* ═══ Top: Gallery + Info ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              {showAR && product.arModel ? (
                <div className="aspect-square rounded-2xl bg-card border border-border overflow-hidden relative">
                  <model-viewer
                    src={product.arModel.glb}
                    ios-src={product.arModel.usdz}
                    alt={product.name}
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    style={{ width: "100%", height: "100%", background: "transparent" }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAR(false)}
                    className="absolute top-3 right-3 z-10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Закрыть
                  </Button>
                </div>
              ) : (
                <ProductGallery
                  images={displayImages}
                  name={product.name}
                  isNew={product.isNew}
                  oldPrice={product.oldPrice}
                  price={product.price}
                  onARClick={() => setShowAR(true)}
                  hasAR={!!product.arModel}
                />
              )}
            </motion.div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                {categoryData?.name} · {currentMaterial}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Stars rating={product.rating} />
                  <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">· {product.reviews.length} отзывов</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">{computedPrice.toLocaleString("ru-RU")} ₽</span>
                {product.oldPrice && computedPrice <= product.price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{product.oldPrice.toLocaleString("ru-RU")} ₽</span>
                    <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full">
                      -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-foreground/80 leading-relaxed mb-6">{product.description}</p>

              {/* ─── Variations (dropdowns) ─── */}
              {product.variations && product.variations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {product.variations.map((v) => {
                    const selected = selectedVariations[v.type] ?? "";
                    return (
                      <div key={v.type}>
                        <label className="text-sm font-medium text-foreground mb-2 block">{v.label}</label>
                        <select
                          value={selected}
                          onChange={(e) =>
                            setSelectedVariations((prev) => ({ ...prev, [v.type]: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors text-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23999%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27><polyline%20points=%276%209%2012%2015%2018%209%27/></svg>')] bg-no-repeat bg-[right_14px_center] pr-10"
                        >
                          <option value="">— выберите —</option>
                          {v.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                              {opt.priceModifier ? ` (${opt.priceModifier > 0 ? "+" : ""}${opt.priceModifier.toLocaleString("ru-RU")} ₽)` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── Specs grid (dynamic) ─── */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: TreePine, label: "Порода", value: currentMaterial },
                  { icon: Ruler, label: "Размеры", value: currentDimensions },
                  { icon: Droplets, label: "Покрытие", value: currentCoating },
                  { icon: Weight, label: "Вес", value: product.weight },
                  { icon: Check, label: "Наличие", value: product.inStock ? "В наличии" : "Под заказ (2–3 нед.)" },
                ].map((spec) => {
                  const isWood = spec.label === "Порода";
                  return (
                    <div
                      key={spec.label}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isWood
                          ? "border-amber-900/40"
                          : "bg-card/50 border-border/50"
                      }`}
                      style={
                        isWood
                          ? {
                              background:
                                "linear-gradient(135deg, hsl(28 45% 22%) 0%, hsl(25 35% 14%) 40%, hsl(22 28% 10%) 100%)",
                              boxShadow: "inset 0 0 30px hsl(20 30% 5% / 0.6)",
                            }
                          : undefined
                      }
                    >
                      <spec.icon className={`h-4 w-4 shrink-0 ${isWood ? "text-amber-200" : "text-primary"}`} />
                      <div className="min-w-0">
                        <p className={`text-[11px] ${isWood ? "text-amber-100/70" : "text-muted-foreground"}`}>{spec.label}</p>
                        <p className={`text-sm font-medium truncate ${isWood ? "text-amber-50" : "text-foreground"}`}>{spec.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── Actions ─── */}
              <div className="flex gap-3 mb-4 mt-auto">
                <Button size="lg" className="flex-1 gap-2 rounded-full" onClick={() => {
                  addItem({
                    productId: product.id,
                    name: product.name,
                    price: computedPrice,
                    image: displayImages[0] ?? product.images[0],
                    variations: Object.keys(selectedVariations).length > 0 ? selectedVariations : undefined,
                    variationLabels: Object.keys(variationLabels).length > 0 ? variationLabels : undefined,
                    dimensions: currentDimensions,
                    weight: product.weight,
                  });
                  toast.success("Товар добавлен в корзину");
                }}>
                  <ShoppingCart className="h-5 w-5" />
                  В корзину
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={cn("gap-2 rounded-full", isFavorite && "border-primary")}
                  onClick={() => {
                    setIsFavorite(!isFavorite);
                    toast.success(isFavorite ? "Удалено из избранного" : "Добавлено в избранное");
                  }}
                >
                  <Heart className={cn("h-5 w-5 transition-colors", isFavorite ? "fill-white text-white" : "")} />
                </Button>
              </div>

              {product.arModel && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 rounded-full"
                  onClick={() => setShowAR(true)}
                >
                  <Smartphone className="h-5 w-5" />
                  Посмотреть в AR
                </Button>
              )}

              {/* Details — показываем только если отличается от описания */}
              {product.details && product.details.trim() !== product.description.trim() && (
                <div className="mt-8 pt-6 border-t border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">Подробности</h3>
                  <p className="text-foreground/70 leading-relaxed text-sm">{product.details}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* ═══ Reviews & Q&A ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <div className="flex gap-1 bg-card/50 rounded-xl p-1 border border-border/50 w-fit mb-8">
              {[
                { key: "reviews" as const, label: "Отзывы", count: product.reviews.length },
                { key: "qa" as const, label: "Вопросы", count: product.qa.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {activeTab === "reviews" && (
              <div className="space-y-4">
                {product.reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Отзывов пока нет. Будьте первым!</p>
                ) : (
                  product.reviews.map((r) => (
                    <div key={r.id} className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">{r.author}</span>
                            {r.verified && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Покупатель</span>
                            )}
                          </div>
                          <Stars rating={r.rating} size={14} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-sm leading-relaxed">{r.text}</p>
                      <button className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Полезно
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "qa" && (
              <div className="space-y-4">
                {product.qa.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Вопросов пока нет. Задайте первый!</p>
                ) : (
                  product.qa.map((q) => (
                    <div key={q.id} className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <MessageCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-foreground text-sm font-medium mb-1">{q.question}</p>
                          <span className="text-xs text-muted-foreground">{q.questionAuthor} · {new Date(q.questionDate).toLocaleDateString("ru-RU")}</span>
                        </div>
                      </div>
                      <div className="ml-7 pl-4 border-l-2 border-primary/20">
                        <p className="text-foreground/80 text-sm leading-relaxed mb-1">{q.answer}</p>
                        <span className="text-xs text-muted-foreground">Ответ мастерской · {new Date(q.answerDate).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.section>

          {/* ═══ Cross-sells ═══ */}
          {crossSellProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-foreground mb-8">С этим покупают</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {crossSellProducts.map((pid) => (
                  <MiniProductCard key={pid} productId={pid} />
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══ Related ═══ */}
          {relatedProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-foreground mb-8">Похожие товары</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedProducts.map((pid) => (
                  <MiniProductCard key={pid} productId={pid} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Back */}
          <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-primary">
            <Link to="/catalog"><ArrowLeft className="h-4 w-4" />Назад в каталог</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;
