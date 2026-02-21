import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ShoppingCart, Menu, Home, LayoutGrid, Image, BookOpen, Building2, CreditCard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";

const categories = [
  { name: "Столы", slug: "tables", image: categoryTable },
  { name: "Стулья", slug: "chairs", image: categoryChairs },
  { name: "Декор", slug: "decor", image: categoryDecor },
  { name: "Полки", slug: "shelves", image: categoryShelves },
];

const navItems = [
  { name: "Главная", url: "/", icon: Home },
  { name: "Каталог", url: "/catalog", icon: LayoutGrid },
  { name: "Галерея", url: "/gallery", icon: Image },
  { name: "Блог", url: "/blog", icon: BookOpen },
  { name: "О компании", url: "/about", icon: Building2 },
  { name: "Доставка и оплата", url: "/delivery", icon: CreditCard },
];

const Header = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(
    navItems.find((item) => item.url === location.pathname)?.name || navItems[0].name
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const match = navItems.find((item) => item.url === location.pathname);
    if (match) setActiveTab(match.name);
  }, [location.pathname]);

  const handleCatalogEnter = () => {
    if (catalogTimeout.current) clearTimeout(catalogTimeout.current);
    setCatalogOpen(true);
  };

  const handleCatalogLeave = () => {
    catalogTimeout.current = setTimeout(() => setCatalogOpen(false), 200);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-10">
      <div className="container mx-auto px-4 flex items-center justify-center">
        {/* Desktop tubelight navbar */}
        {!isMobile ? (
          <div className="flex items-center gap-4 bg-background/5 border border-border/40 backdrop-blur-lg py-3.5 px-3 rounded-full shadow-lg shadow-black/20 relative">
            <nav className="flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;
                const isCatalog = item.name === "Каталог";

                const linkEl = (
                  <Link
                    key={item.name}
                    to={item.url}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      "relative cursor-pointer text-base font-semibold px-6 py-2.5 rounded-full transition-colors",
                      "text-foreground/80 hover:text-primary",
                      isActive && "bg-muted text-primary"
                    )}
                  >
                    <span className="hidden xl:inline">{item.name}</span>
                    <span className="xl:hidden">
                      <Icon className="h-5 w-5" />
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="tubelight"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-10 h-1"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <div className="w-full h-full bg-primary rounded-full" />
                        <div className="absolute w-full h-full bg-primary/50 rounded-full blur-md" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary/20 rounded-full blur-xl" />
                      </motion.div>
                    )}
                  </Link>
                );

                if (isCatalog) {
                  return (
                    <div
                      key={item.name}
                      className="relative"
                      onMouseEnter={handleCatalogEnter}
                      onMouseLeave={handleCatalogLeave}
                    >
                      {linkEl}
                      <AnimatePresence>
                        {catalogOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 bg-card/95 border border-border/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/30 overflow-hidden"
                          >
                            {/* Glow indicator */}
                            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-10 h-1">
                              <div className="w-full h-full bg-primary rounded-full" />
                              <div className="absolute w-full h-full bg-primary/50 rounded-full blur-md" />
                            </div>
                            <div className="grid grid-cols-4 gap-2 p-4">
                              {categories.map((cat) => (
                                <Link
                                  key={cat.slug}
                                  to={`/catalog?category=${cat.slug}`}
                                  onClick={() => {
                                    setActiveTab("Каталог");
                                    setCatalogOpen(false);
                                  }}
                                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
                                >
                                  <div className="w-16 h-16 flex items-center justify-center">
                                    <img
                                      src={cat.image}
                                      alt={cat.name}
                                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-foreground/70 group-hover:text-primary transition-colors whitespace-nowrap">
                                    {cat.name}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return linkEl;
              })}
            </nav>

            {/* Action icons */}
            <div className="flex items-center gap-1.5 border-l border-border/40 pl-3 ml-2">
              <button className="p-2.5 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Поиск">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Избранное">
                <Heart className="h-5 w-5" />
              </button>
              <button className="relative p-2.5 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Корзина">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  0
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Mobile navbar */
          <div className="flex items-center justify-between w-full bg-background/5 border border-border/40 backdrop-blur-lg py-2 px-4 rounded-full shadow-lg shadow-black/20">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full text-foreground/80 hover:text-primary transition-colors" aria-label="Поиск">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full text-foreground/80 hover:text-primary transition-colors" aria-label="Избранное">
                <Heart className="h-5 w-5" />
              </button>
              <button className="relative p-2 rounded-full text-foreground/80 hover:text-primary transition-colors" aria-label="Корзина">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                  0
                </span>
              </button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-full text-foreground/80 hover:text-primary transition-colors">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SheetClose asChild key={item.name}>
                        <Link
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 text-lg font-medium py-2 border-b border-border transition-colors",
                            location.pathname === item.url
                              ? "text-primary"
                              : "text-foreground hover:text-primary"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
