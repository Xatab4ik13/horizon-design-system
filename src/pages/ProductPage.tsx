import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, ArrowLeft, Smartphone, Ruler, Weight, TreePine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductById, categories } from "@/data/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || "");
  const [activeImage, setActiveImage] = useState(0);
  const [showAR, setShowAR] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)" }}>
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Товар не найден</h1>
            <Button asChild variant="outline">
              <Link to="/catalog">Вернуться в каталог</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryData = categories.find((c) => c.slug === product.category);
  const categoryName = categoryData?.name;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)" }}>
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-primary transition-colors">Каталог</Link>
            <span>/</span>
            <Link to={`/catalog?category=${product.category}`} className="hover:text-primary transition-colors">
              {categoryName}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border mb-4">
                {showAR ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                    <Smartphone className="h-16 w-16 text-primary mb-4 animate-pulse" />
                    <p className="text-foreground font-semibold text-lg mb-2">AR-просмотр</p>
                    <p className="text-muted-foreground text-sm text-center max-w-xs mb-4">
                      Наведите камеру на ровную поверхность, чтобы разместить {product.name.toLowerCase()} в вашем интерьере
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowAR(false)}>
                      Закрыть AR
                    </Button>
                  </div>
                ) : (
                  <img
                    src={product.images[activeImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {product.isNew && !showAR && (
                  <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
                    Новинка
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveImage(i); setShowAR(false); }}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                        activeImage === i && !showAR ? "border-primary" : "border-border"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                {categoryName} · {product.material}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {product.price.toLocaleString("ru-RU")} ₽
                </span>
                {product.oldPrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {product.oldPrice.toLocaleString("ru-RU")} ₽
                    </span>
                    <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full">
                      -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-foreground/80 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <Ruler className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Размеры</p>
                    <p className="text-sm font-medium text-foreground">{product.dimensions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <Weight className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Вес</p>
                    <p className="text-sm font-medium text-foreground">{product.weight}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <TreePine className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Материал</p>
                    <p className="text-sm font-medium text-foreground">{product.material}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <Check className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Наличие</p>
                    <p className="text-sm font-medium text-foreground">
                      {product.inStock ? "В наличии" : "Под заказ"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <Button size="lg" className="flex-1 gap-2" onClick={() => toast.success("Товар добавлен в корзину")}>
                  <ShoppingCart className="h-5 w-5" />
                  В корзину
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={() => toast.success("Добавлено в избранное")}>
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {/* AR button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setShowAR(true)}
              >
                <Smartphone className="h-5 w-5" />
                Посмотреть в AR
              </Button>

              {/* Details */}
              <div className="mt-10 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">Подробности</h3>
                <p className="text-foreground/70 leading-relaxed">{product.details}</p>
              </div>
            </motion.div>
          </div>

          {/* Back link */}
          <div className="mt-16">
            <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-primary">
              <Link to="/catalog">
                <ArrowLeft className="h-4 w-4" />
                Назад в каталог
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;
