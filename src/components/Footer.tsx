import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { useHomepageContent } from "@/hooks/useSiteContent";

const siteMap = [
  {
    title: "Каталог",
    links: [
      { name: "Мебель", url: "/catalog?category=furniture" },
      { name: "Кухонные принадлежности", url: "/catalog?category=kitchen" },
      { name: "Системы хранения", url: "/catalog?category=storage" },
      { name: "Предметы интерьера", url: "/catalog?category=interior" },
      { name: "Заготовки для творчества", url: "/catalog?category=crafts" },
      { name: "Двери", url: "/catalog?category=doors" },
    ],
  },
  {
    title: "Информация",
    links: [
      { name: "О компании", url: "/about" },
      { name: "Доставка и оплата", url: "/delivery" },
      { name: "Услуги", url: "/services" },
      { name: "Блог", url: "/blog" },
      { name: "Галерея", url: "/gallery" },
      { name: "Контакты", url: "/contacts" },
    ],
  },
  {
    title: "Покупателю",
    links: [
      { name: "Корзина", url: "/cart" },
      { name: "Личный кабинет", url: "/account" },
      { name: "Оформление заказа", url: "/checkout" },
    ],
  },
];

const Footer = () => {
  const content = useHomepageContent();
  const fTagline = content.footer?.tagline?.trim() || "Мастерская изделий из натурального дерева";
  const fPhone = content.footer?.phone?.trim() || "+7 (999) 123-45-67";
  const fEmail = content.footer?.email?.trim() || "info@faktura.ru";
  const fCopyright = content.footer?.copyright?.trim() || `© ${new Date().getFullYear()} FAKTURA. Все права защищены.`;
  return (
    <footer className="bg-card border-t border-border/30 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Logo & socials */}
          <div>
            <Logo size="md" className="mb-3" />
            <p className="text-xs text-muted-foreground leading-relaxed font-light mb-4">
              {fTagline}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://vk.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-xs">VK</a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-xs">Telegram</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-xs">Instagram</a>
            </div>
          </div>

          {/* Site map columns */}
          {siteMap.map((section) => (
            <div key={section.title}>
              <h4 className="text-foreground text-sm mb-2">{section.title}</h4>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.url} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground/50">
            © {new Date().getFullYear()} FAKTURA. Все права защищены.
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            +7 (999) 123-45-67 • info@faktura.ru
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
