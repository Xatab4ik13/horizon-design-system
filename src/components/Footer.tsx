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

const socials = [
  {
    name: "VK",
    url: "https://vk.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12.785 16.241s.288-.032.435-.193c.135-.148.131-.425.131-.425s-.018-1.305.583-1.501c.593-.193 1.355 1.288 2.163 1.857.611.43 1.075.336 1.075.336l2.16-.031s1.13-.071.595-.974c-.044-.074-.312-.661-1.605-1.872-1.354-1.268-1.172-1.063.459-3.252.993-1.332 1.39-2.146 1.266-2.495-.118-.331-.85-.244-.85-.244l-2.435.015s-.181-.025-.315.056c-.13.079-.214.262-.214.262s-.385 1.029-.899 1.904c-1.083 1.847-1.518 1.945-1.696 1.829-.413-.27-.31-1.078-.31-1.652 0-1.793.272-2.541-.527-2.736-.265-.064-.46-.107-1.137-.114-.87-.009-1.605.003-2.022.208-.277.136-.491.439-.361.457.16.022.522.099.715.362.247.339.237 1.1.237 1.1s.142 2.092-.336 2.352c-.327.179-.776-.187-1.74-1.86-.494-.857-.867-1.804-.867-1.804s-.072-.176-.2-.27c-.156-.114-.374-.151-.374-.151l-2.314.015s-.348.01-.476.162c-.114.135-.009.413-.009.413s1.812 4.241 3.864 6.378c1.881 1.959 4.018 1.83 4.018 1.83h.967z"/>
      </svg>
    ),
  },
  {
    name: "Telegram",
    url: "https://t.me",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
      </svg>
    ),
  },
  {
    name: "Instagram",
    url: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
];

const Footer = () => {
  const content = useHomepageContent();
  const fTagline = content.footer?.tagline?.trim() || "Мастерская изделий из натурального дерева";
  const fPhone = content.footer?.phone?.trim() || "+7 (999) 123-45-67";
  const fEmail = content.footer?.email?.trim() || "info@faktura.ru";
  const fCopyright = content.footer?.copyright?.trim() || `© ${new Date().getFullYear()} FAKTURA. Все права защищены.`;

  return (
    <footer className="bg-card border-t border-border/30 py-5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Logo & socials */}
          <div>
            <Logo size="sm" className="mb-2" />
            <p className="text-[11px] text-muted-foreground leading-snug font-light mb-3">
              {fTagline}
            </p>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                Мы в соцсетях
              </p>
              <div className="flex items-center gap-1.5">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="w-7 h-7 rounded-full border border-primary/30 text-primary/80 hover:text-primary hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Site map columns */}
          {siteMap.map((section) => (
            <div key={section.title}>
              <h4 className="text-foreground text-[12px] mb-1.5 uppercase tracking-wider">{section.title}</h4>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.url} className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1">
          <p className="text-[10px] text-muted-foreground/50">
            {fCopyright}
          </p>
          <p className="text-[10px] text-muted-foreground/40">
            {fPhone} • {fEmail}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
