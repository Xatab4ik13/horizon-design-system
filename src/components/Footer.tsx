import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & description */}
          <div>
            <Logo size="md" className="mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              Мастерская уникальных изделий из натурального дерева. Качество, проверенное временем.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-foreground mb-3">Навигация</h4>
            <ul className="space-y-2 text-sm">
              {["Каталог", "Галерея", "Блог", "О компании", "Доставка", "Контакты"].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-foreground mb-3">Контакты</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>+7 (999) 123-45-67</li>
              <li>info@woodcraft.ru</li>
              <li>г. Москва, ул. Мастеровая, 12</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} WoodCraft. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
