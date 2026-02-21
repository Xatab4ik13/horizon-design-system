import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, ShoppingCart, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const navLinks = [
  { label: "Каталог", href: "/catalog" },
  { label: "Галерея", href: "/gallery" },
  { label: "Блог", href: "/blog" },
  { label: "О компании", href: "/about" },
  { label: "Доставка", href: "/delivery" },
  { label: "Услуги", href: "/services" },
  { label: "Контакты", href: "/contacts" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerBg = scrolled
    ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
    : "bg-transparent";

  const textColor = scrolled ? "text-foreground" : "text-white";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className={`font-bold text-xl tracking-tight transition-colors ${textColor}`}>
          WoodCraft
        </Link>

        {/* Desktop Nav */}
        {!isMobile && (
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium hover:text-primary transition-colors ${textColor}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button className={`p-2 rounded-full hover:bg-primary/10 transition-colors ${textColor}`} aria-label="Поиск">
            <Search className="h-5 w-5" />
          </button>
          <button className={`p-2 rounded-full hover:bg-primary/10 transition-colors ${textColor}`} aria-label="Избранное">
            <Heart className="h-5 w-5" />
          </button>
          <button className={`relative p-2 rounded-full hover:bg-primary/10 transition-colors ${textColor}`} aria-label="Корзина">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center font-semibold">
              0
            </span>
          </button>

          {/* Mobile burger */}
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <button className={`p-2 rounded-full hover:bg-primary/10 transition-colors lg:hidden ${textColor}`}>
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link to={link.href} className="text-foreground text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border">
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
