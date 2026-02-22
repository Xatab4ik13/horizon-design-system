import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingCart, Menu, X, Home, LayoutGrid, Image, BookOpen, CreditCard, Wrench, PhoneCall, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";
import categoryCrafts from "@/assets/category-crafts.png";
import categoryDoors from "@/assets/category-doors.png";

const categories = [
  { name: "Мебель", slug: "furniture", image: categoryTable },
  { name: "Кухонные принадлежности", slug: "kitchen", image: categoryChairs },
  { name: "Системы хранения", slug: "storage", image: categoryDecor },
  { name: "Предметы интерьера", slug: "interior", image: categoryShelves },
  { name: "Заготовки для творчества", slug: "crafts", image: categoryCrafts },
  { name: "Двери", slug: "doors", image: categoryDoors },
];

const navItems = [
  { name: "Главная", url: "/", icon: Home },
  { name: "Каталог", url: "/catalog", icon: LayoutGrid },
  { name: "Услуги", url: "/services", icon: Wrench },
  { name: "Галерея", url: "/gallery", icon: Image },
  { name: "Блог", url: "/blog", icon: BookOpen },
  { name: "Доставка и оплата", url: "/delivery", icon: CreditCard },
  { name: "Контакты", url: "/contacts", icon: PhoneCall },
];

const Header = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { totalItems } = useCart();
  const [activeTab, setActiveTab] = useState(
    navItems.find((item) => item.url === location.pathname)?.name || navItems[0].name
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);

  useEffect(() => {
    const match = navItems.find((item) => item.url === location.pathname);
    if (match) setActiveTab(match.name);
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCatalogOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

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
                const isActive = activeTab === item.name;
                const isCatalog = item.name === "Каталог";

                const linkEl = (
                  <Link
                    key={item.name}
                    to={item.url}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      "relative cursor-pointer text-base font-medium px-6 py-2.5 rounded-full transition-colors",
                      "text-foreground/80 hover:text-primary",
                      isActive && "bg-muted text-primary"
                    )}
                  >
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="tubelight"
                        className="absolute -top-0.5 inset-x-0 mx-auto w-10 h-1"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <div className="w-full h-full bg-primary rounded-full" />
                        <div className="absolute inset-0 bg-primary/50 rounded-full blur-md" />
                        <div className="absolute top-0 inset-x-0 mx-auto w-6 h-6 bg-primary/20 rounded-full blur-xl" />
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
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="absolute top-full left-0 pt-2 z-50"
                          >
                            <div className="absolute -top-2 left-0 right-0 h-2" />
                            <div className="w-72 bg-card border border-border/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
                              <div className="absolute -top-0.5 left-8 w-10 h-1 z-10">
                                <div className="w-full h-full bg-primary rounded-full" />
                                <div className="absolute w-full h-full bg-primary/50 rounded-full blur-md" />
                              </div>
                              <div className="flex flex-col gap-1 p-3">
                                {categories.map((cat) => (
                                  <Link
                                    key={cat.slug}
                                    to={`/catalog?category=${cat.slug}`}
                                    onClick={() => {
                                      setActiveTab("Каталог");
                                      setCatalogOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
                                  >
                                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                      <img src={cat.image} alt={cat.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground/70 group-hover:text-primary transition-colors">
                                      {cat.name}
                                    </span>
                                  </Link>
                                ))}
                              </div>
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
              <Link to="/account" className="p-2.5 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Личный кабинет">
                <User className="h-5 w-5" />
              </Link>
              <Link to="/cart" className="relative p-2.5 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Корзина">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        ) : (
          /* Mobile / Tablet navbar */
          <div className="flex items-center justify-between w-full bg-background/5 border border-border/40 backdrop-blur-lg py-2.5 px-4 rounded-full shadow-lg shadow-black/20">
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-full text-foreground/80 hover:text-primary transition-colors" aria-label="Поиск">
                <Search className="h-5 w-5" />
              </button>
              <Link to="/account" className="p-2 rounded-full text-foreground/80 hover:text-primary transition-colors" aria-label="Личный кабинет">
                <User className="h-5 w-5" />
              </Link>
              <Link to="/cart" className="relative p-2 rounded-full text-foreground/80 hover:text-primary transition-colors" aria-label="Корзина">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-foreground/80 hover:text-primary transition-colors"
              aria-label="Меню"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}
      </div>

      {/* ═══ Mobile Full-screen Menu ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl"
          >
            {/* Decorative glow */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="pt-28 pb-8 px-6 h-full overflow-y-auto">
              <nav className="max-w-md mx-auto">
                <motion.div
                  initial="closed"
                  animate="open"
                  variants={{
                    open: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
                    closed: {},
                  }}
                  className="flex flex-col gap-1"
                >
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.url;
                    const isCatalog = item.name === "Каталог";

                    return (
                      <motion.div
                        key={item.name}
                        variants={{
                          open: { opacity: 1, y: 0 },
                          closed: { opacity: 0, y: 20 },
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {isCatalog ? (
                          <>
                            <button
                              onClick={() => setMobileCatalogOpen(!mobileCatalogOpen)}
                              className={cn(
                                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-medium transition-all duration-200",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                isActive ? "bg-primary/20" : "bg-muted/50"
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <span className="flex-1 text-left">{item.name}</span>
                              <motion.div
                                animate={{ rotate: mobileCatalogOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              </motion.div>
                            </button>

                            {/* Catalog dropdown */}
                            <AnimatePresence>
                              {mobileCatalogOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-2 py-3">
                                    {categories.map((cat, i) => (
                                      <motion.div
                                        key={cat.slug}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05, duration: 0.25 }}
                                      >
                                        <Link
                                          to={`/catalog?category=${cat.slug}`}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/60 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                                        >
                                          <div className="w-14 h-14 flex items-center justify-center">
                                            <img
                                              src={cat.image}
                                              alt={cat.name}
                                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                            />
                                          </div>
                                          <span className="text-xs font-medium text-foreground/70 group-hover:text-primary transition-colors text-center leading-tight">
                                            {cat.name}
                                          </span>
                                        </Link>
                                      </motion.div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <Link
                            to={item.url}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-medium transition-all duration-200",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              isActive ? "bg-primary/20" : "bg-muted/50"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span>{item.name}</span>
                            {isActive && (
                              <motion.div
                                layoutId="mobile-active"
                                className="ml-auto w-2 h-2 rounded-full bg-primary"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
