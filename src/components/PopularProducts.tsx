import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

const products = [
  { id: 1, name: "Обеденный стол «Дуб»", price: 45000 },
  { id: 2, name: "Стул «Скандинавия»", price: 12000 },
  { id: 3, name: "Полка настенная", price: 8500 },
  { id: 4, name: "Разделочная доска", price: 3200 },
  { id: 5, name: "Ваза из ореха", price: 6800 },
  { id: 6, name: "Подставка для книг", price: 4500 },
];

const PopularProducts = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl text-center mb-12 text-foreground">
          Популярные товары
        </h2>

        <div className="relative">
          <button onClick={() => scroll("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur rounded-full p-2 shadow-md hover:bg-background hidden md:block">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button onClick={() => scroll("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur rounded-full p-2 shadow-md hover:bg-background hidden md:block">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>

          <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {products.map((p) => (
              <div key={p.id} className="min-w-[260px] snap-start bg-card rounded-xl border border-border overflow-hidden group flex-shrink-0">
                <div className="relative h-52 bg-gradient-to-br from-muted to-accent">
                  <button className="absolute top-3 right-3 p-2 rounded-full bg-background/70 hover:bg-background transition-colors">
                    <Heart className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-card-foreground mb-1">{p.name}</h3>
                  <p className="text-primary font-bold text-lg mb-3">
                    {p.price.toLocaleString("ru-RU")} ₽
                  </p>
                  <Button size="sm" className="w-full gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    В корзину
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" asChild size="lg">
            <Link to="/catalog">Все товары</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
