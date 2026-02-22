import { motion } from "framer-motion";
import {
  ChevronRight, Phone, Mail, MapPin, Clock, Send,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

const contactInfo = [
  {
    icon: Phone,
    title: "Телефон",
    value: "+7 (900) 123-45-67",
    href: "tel:+79001234567",
    note: "Пн–Пт: 10:00 — 19:00",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@derevo-master.ru",
    href: "mailto:info@derevo-master.ru",
    note: "Ответим в течение 2 часов",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp / Telegram",
    value: "+7 (900) 123-45-67",
    href: "https://wa.me/79001234567",
    note: "Быстрые ответы и фото",
  },
  {
    icon: MapPin,
    title: "Адрес мастерской",
    value: "г. Москва, ул. Примерная, д. 1",
    href: "https://yandex.ru/maps",
    note: "Бесплатная парковка",
  },
];

const ContactsPage = () => {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Контакты</span>
          </nav>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Контакты</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Свяжитесь с нами любым удобным способом — мы всегда на связи
            </p>
          </motion.div>

          {/* Contact cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((item, i) => (
              <motion.a
                key={item.title}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group block"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{item.title}</p>
                <p className="text-foreground font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {item.note}
                </p>
              </motion.a>
            ))}
          </div>

          {/* Map placeholder + working hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16"
          >
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl overflow-hidden h-80 lg:h-auto flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-primary/40" />
                <p className="text-sm">Карта появится здесь</p>
                <p className="text-xs mt-1">Яндекс Карты / Google Maps</p>
              </div>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Время работы</h3>
              <div className="space-y-3">
                {[
                  { day: "Понедельник — Пятница", time: "10:00 — 19:00" },
                  { day: "Суббота", time: "11:00 — 16:00" },
                  { day: "Воскресенье", time: "Выходной" },
                ].map((row) => (
                  <div key={row.day} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <span className="text-foreground/80 text-sm">{row.day}</span>
                    <span className="text-foreground font-medium text-sm">{row.time}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <Send className="h-4 w-4 text-primary inline mr-2" />
                  Для визита в мастерскую рекомендуем предварительно позвонить или написать — мы подготовим ваш заказ.
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Contact form — full width like on main page */}
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default ContactsPage;
