import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Heart, ShoppingCart, Menu, Home, LayoutGrid, Image, BookOpen, Truck, Wrench, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Главная", url: "/", icon: Home },
  { name: "Каталог", url: "/catalog", icon: LayoutGrid },
  { name: "Галерея", url: "/gallery", icon: Image },
  { name: "Блог", url: "/blog", icon: BookOpen },
  { name: "Доставка", url: "/delivery", icon: Truck },
  { name: "Услуги", url: "/services", icon: Wrench },
  { name: "Контакты", url: "/contacts", icon: Phone },
];

const Header = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(
    navItems.find((item) => item.url === location.pathname)?.name || navItems[0].name
  );

  useEffect(() => {
    const match = navItems.find((item) => item.url === location.pathname);
    if (match) setActiveTab(match.name);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4">
      <div className="container mx-auto px-4 flex items-center justify-center">
        {/* Desktop tubelight navbar */}
        {!isMobile ? (
          <div className="flex items-center gap-3 bg-background/5 border border-border/40 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg shadow-black/20">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;

                return (
                  <Link
                    key={item.name}
                    to={item.url}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors",
                      "text-foreground/80 hover:text-primary",
                      isActive && "bg-muted text-primary"
                    )}
                  >
                    <span className="hidden xl:inline">{item.name}</span>
                    <span className="xl:hidden">
                      <Icon className="h-4 w-4" />
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="tubelight"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <div className="w-full h-full bg-primary rounded-full" />
                        <div className="absolute w-full h-full bg-primary/50 rounded-full blur-md" />
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary/30 rounded-full blur-lg" />
                      </motion.div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Action icons */}
            <div className="flex items-center gap-1 border-l border-border/40 pl-2 ml-1">
              <button className="p-2 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Поиск">
                <Search className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Избранное">
                <Heart className="h-4 w-4" />
              </button>
              <button className="relative p-2 rounded-full text-foreground/80 hover:text-primary hover:bg-muted transition-colors" aria-label="Корзина">
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
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
