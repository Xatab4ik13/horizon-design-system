import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRight, Minus, Plus, Trash2, ShoppingBag, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useCart } from "@/contexts/CartContext";

const CartPage = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();

  const formatPrice = (n: number) =>
    n.toLocaleString("ru-RU") + " ₽";

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <SEO title="Корзина" description="Ваша корзина покупок в FAKTURA." noindex />
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Корзина</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-8"
          >
            Корзина {totalItems > 0 && <span className="text-muted-foreground text-2xl font-normal">({totalItems})</span>}
          </motion.h1>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-xl text-foreground mb-2">Корзина пуста</p>
              <p className="text-muted-foreground mb-6">Добавьте товары из каталога</p>
              <Link to="/catalog">
                <Button size="lg" className="rounded-full px-8">
                  Перейти в каталог
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item, i) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-4 md:p-6 flex gap-4 md:gap-6"
                  >
                    <Link to={`/product/${item.productId}`} className="shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.productId}`} className="text-foreground font-semibold hover:text-primary transition-colors line-clamp-2">
                        {item.name}
                      </Link>

                      {/* Variation labels */}
                      {item.variationLabels && Object.keys(item.variationLabels).length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {Object.entries(item.variationLabels).map(([key, val]) => (
                            <p key={key} className="text-xs text-muted-foreground">
                              {key}: <span className="text-foreground/70">{val}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      <p className="text-primary font-bold text-lg mt-2">
                        {formatPrice(item.price)}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-background/60 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-foreground font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-background/60 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div>
                <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 sticky top-36">
                  <h3 className="text-lg font-bold text-foreground mb-4">Итого</h3>

                  {(() => {
                    const totalWeight = items.reduce((sum, i) => {
                      const m = (i.weight || "").match(/[\d.,]+/);
                      const v = m ? parseFloat(m[0].replace(",", ".")) : 0;
                      return sum + v * i.quantity;
                    }, 0);
                    return (
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Товары ({totalItems})</span>
                          <span className="text-foreground">{formatPrice(totalPrice)}</span>
                        </div>
                        {totalWeight > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Общий вес</span>
                            <span className="text-foreground">{totalWeight.toFixed(1).replace(/\.0$/, "")} кг</span>
                          </div>
                        )}

                        {/* Dimensions per item */}
                        {items.some((i) => i.dimensions) && (
                          <div className="border-t border-border/30 pt-2 space-y-1.5">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Габариты</p>
                            {items.map((item) => item.dimensions && (
                              <div key={item.productId} className="text-xs text-muted-foreground">
                                <span className="text-foreground/70">{item.name}:</span> {item.dimensions}
                                {item.quantity > 1 && <span className="text-foreground/50"> × {item.quantity}</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between text-sm border-t border-border/30 pt-3">
                          <span className="text-muted-foreground">Доставка</span>
                          <span className="text-foreground/60">При оформлении</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Promo code */}
                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      placeholder="Промокод"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors text-sm"
                    />
                    <Button variant="outline" className="rounded-xl px-4">
                      Применить
                    </Button>
                  </div>

                  <div className="flex justify-between items-baseline mb-6 pt-4 border-t border-border/50">
                    <span className="text-foreground font-semibold">К оплате</span>
                    <span className="text-primary font-bold text-2xl">{formatPrice(totalPrice)}</span>
                  </div>

                  <Link to="/checkout">
                    <Button size="lg" className="w-full rounded-xl">
                      Оформить заказ <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>

                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Или <Link to="/checkout" className="text-primary hover:underline">оформить как гость</Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
