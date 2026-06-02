import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import LiveSearch from "@/components/LiveSearch";
import Logo from "@/components/Logo";
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";
import categoryCrafts from "@/assets/category-crafts.png";
import categoryDoors from "@/assets/category-doors.png";
import { useNavMenu } from "@/hooks/useSiteContent";

const categories = [
  { name: "Мебель", slug: "furniture", image: categoryTable },
  { name: "Кухонные принадлежности", slug: "kitchen", image: categoryChairs },
  { name: "Системы хранения", slug: "storage", image: categoryDecor },
  { name: "Предметы интерьера", slug: "interior", image: categoryShelves },
  { name: "Заготовки для творчества", slug: "crafts", image: categoryCrafts },
  { name: "Двери", slug: "doors", image: categoryDoors },
];

const defaultNavItems = [
  { name: "Главная", url: "/" },
  { name: "Каталог", url: "/catalog" },
  { name: "Услуги", url: "/services" },
  { name: "Галерея", url: "/gallery" },
  { name: "Блог", url: "/blog" },
  { name: "Доставка и оплата", url: "/delivery" },
  { name: "Контакты", url: "/contacts" },
];

const Header = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { totalItems } = useCart();
  const navItems = useNavMenu(defaultNavItems);
  const [activeTab, setActiveTab] = useState(
    navItems.find((item) => item.url === location.pathname)?.name || navItems[0].name
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const match = navItems.find((item) => item.url === location.pathname);
    if (match) setActiveTab(match.name);
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCatalogOpen(false);
  }, [location.pathname]);

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
    <header className="fixed top-0 left-0 right-0 z-50 pt-6">
      <div
        className={cn(
          "absolute inset-0 -z-10 transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/40 border-b border-white/10"
            : "bg-transparent"
        )}
      />
      <div className="container mx-auto px-4 flex items-center justify-center">
        {/* Desktop navbar */}
        {!isMobile ? (
          <div className="flex items-center gap-4 bg-black/95 border border-white/15 backdrop-blur-2xl py-3.5 px-3 rounded-full shadow-xl shadow-black/60 relative">
            <div className="pl-3 pr-2 border-r border-border/40 mr-1">
              <Logo size="sm" />
            </div>
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
                      "text-white/90 hover:text-primary",
                      isActive && "bg-white/5 text-primary"
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
                                      <img src={cat.image} alt={cat.name} loading="lazy" decoding="async" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
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
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-3 ml-2">
              <button onClick={() => setSearchOpen(true)} className="p-2.5 rounded-full text-white/90 hover:text-primary hover:bg-white/5 transition-colors" aria-label="Поиск">
                <Search className="h-5 w-5" />
              </button>
              <Link to="/account" className="p-2.5 rounded-full text-white/90 hover:text-primary hover:bg-white/5 transition-colors" aria-label="Личный кабинет">
                <User className="h-5 w-5" />
              </Link>
              <Link to="/cart" className="relative p-2.5 rounded-full text-white/90 hover:text-primary hover:bg-white/5 transition-colors" aria-label="Корзина">
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
          <div className="flex items-center justify-between w-full bg-black/95 border border-white/15 backdrop-blur-2xl py-2.5 px-4 rounded-full shadow-xl shadow-black/60">
            <Logo size="sm" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-white/90 hover:text-primary transition-colors"
              aria-label="Меню"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* ═══ Mobile Slide-in Panel ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in panel from right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-card border-l border-border/40 shadow-2xl shadow-black/40 overflow-y-auto"
            >
              {/* Header with close */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
                <Logo size="sm" linkTo="" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full text-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label="Закрыть меню"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav items */}
              <nav className="px-4 py-4">
                <motion.div
                  initial="closed"
                  animate="open"
                  variants={{
                    open: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
                    closed: {},
                  }}
                  className="flex flex-col gap-0.5"
                >
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    const isCatalog = item.name === "Каталог";

                    return (
                      <motion.div
                        key={item.name}
                        variants={{
                          open: { opacity: 1, x: 0 },
                          closed: { opacity: 0, x: 20 },
                        }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        {isCatalog ? (
                          <>
                            <button
                              onClick={() => setMobileCatalogOpen(!mobileCatalogOpen)}
                              className={cn(
                                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
                              )}
                            >
                              <span>{item.name}</span>
                              <motion.div
                                animate={{ rotate: mobileCatalogOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </motion.div>
                            </button>

                            <AnimatePresence>
                              {mobileCatalogOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 gap-2 px-2 py-2">
                                    {categories.map((cat, i) => (
                                      <motion.div
                                        key={cat.slug}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.04, duration: 0.2 }}
                                      >
                                        <Link
                                          to={`/catalog?category=${cat.slug}`}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-background/40 border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                                        >
                                          <div className="w-10 h-10 flex items-center justify-center">
                                            <img
                                              src={cat.image}
                                              alt={cat.name}
                                              loading="lazy"
                                              decoding="async"
                                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                            />
                                          </div>
                                          <span className="text-[11px] font-medium text-foreground/60 group-hover:text-primary transition-colors text-center leading-tight">
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
                              "flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
                            )}
                          >
                            <span>{item.name}</span>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </nav>

              {/* Action icons */}
              <div className="flex items-center justify-around px-6 py-4 border-t border-border/30">
                <button onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }} className="flex flex-col items-center gap-1 p-2 text-foreground/70 hover:text-primary transition-colors">
                  <Search className="h-5 w-5" />
                  <span className="text-[10px]">Поиск</span>
                </button>
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-center gap-1 p-2 text-foreground/70 hover:text-primary transition-colors">
                  <User className="h-5 w-5" />
                  <span className="text-[10px]">Кабинет</span>
                </Link>
                <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="relative flex flex-col items-center gap-1 p-2 text-foreground/70 hover:text-primary transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                      {totalItems}
                    </span>
                  )}
                  <span className="text-[10px]">Корзина</span>
                </Link>
              </div>

              {/* Bottom section */}
              <div className="px-6 py-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground/50 text-center">
                  © 2026 FAKTURA
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Live Search */}
      <LiveSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default Header;
