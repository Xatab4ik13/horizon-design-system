import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight, Phone, Mail, MapPin, Clock, Send,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ContactForm from "@/components/ContactForm";
import { supabase } from "@/integrations/supabase/client";
import { usePageHeader, useContactsContent } from "@/hooks/useSiteContent";

interface Vacancy {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  salary: string | null;
}

const defaultContacts = [
  { type: "phone" as const, title: "Телефон", value: "+7 (900) 123-45-67", href: "tel:+79001234567", note: "Пн–Пт: 10:00 — 19:00" },
  { type: "email" as const, title: "Email", value: "info@derevo-master.ru", href: "mailto:info@derevo-master.ru", note: "Ответим в течение 2 часов" },
  { type: "messenger" as const, title: "WhatsApp / Telegram", value: "+7 (900) 123-45-67", href: "https://wa.me/79001234567", note: "Быстрые ответы и фото" },
  { type: "address" as const, title: "Адрес мастерской", value: "г. Москва, ул. Примерная, д. 1", href: "https://yandex.ru/maps", note: "Бесплатная парковка" },
];

const iconByType = {
  phone: Phone,
  email: Mail,
  messenger: MessageCircle,
  address: MapPin,
} as const;

const defaultHours = [
  { day: "Понедельник — Пятница", time: "10:00 — 19:00" },
  { day: "Суббота", time: "11:00 — 16:00" },
  { day: "Воскресенье", time: "Выходной" },
];

const defaultHoursNote =
  "Для визита в мастерскую рекомендуем предварительно позвонить или написать — мы подготовим ваш заказ.";

const defaultCareers = {
  title: "Работа в компании",
  intro: "Мы расширяем команду и ищем увлечённых людей, готовых создавать уникальные изделия из дерева.",
  ctaTitle: "Хотите присоединиться?",
  ctaText: "Отправьте резюме на",
  email: "hr@derevo-master.ru",
  phone: "+7 (900) 123-45-67",
};

const ContactsPage = () => {
  const header = usePageHeader("contacts", { title: "Контакты", subtitle: "Свяжитесь с нами любым удобным способом — мы всегда на связи" });
  const cms = useContactsContent();
  const contactInfo = (cms.contacts?.length ? cms.contacts : defaultContacts).map((c) => ({
    ...c,
    icon: iconByType[(c.type as keyof typeof iconByType) ?? "phone"] ?? Phone,
  }));
  const hours = cms.hours?.length ? cms.hours : defaultHours;
  const hoursNote = cms.hoursNote?.trim() || defaultHoursNote;
  const careers = { ...defaultCareers, ...(cms.careers ?? {}) };
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("vacancies")
      .select("id, title, description, requirements, salary")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setVacancies((data as Vacancy[]) ?? []);
        setVacanciesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <SEO
        title="Контакты"
        description="Свяжитесь с мастерской FAKTURA: телефон, email, адрес в Москве. Оставьте заявку на изготовление изделия из дерева."
      />
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{header.title}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {header.subtitle}
            </p>
          </motion.div>

          {/* Contact cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((item, i) => (
              <motion.a
                key={`${item.title}-${i}`}
                href={item.href || "#"}
                target={item.href?.startsWith("http") ? "_blank" : undefined}
                rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
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

        {/* Careers section */}
        <div className="container mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Работа в компании</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Мы расширяем команду и ищем увлечённых людей, готовых создавать уникальные изделия из дерева.
            </p>

            {vacanciesLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : vacancies.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm mb-8">
                Открытых вакансий пока нет — но мы всегда рады талантливым кандидатам.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {vacancies.map((job) => (
                  <div key={job.id} className="p-5 rounded-xl border border-border hover:border-primary/30 transition-colors flex flex-col">
                    <h3 className="text-foreground font-semibold mb-2">{job.title}</h3>
                    {job.salary && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full self-start mb-3">
                        {job.salary}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
                    {job.requirements && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground/80 font-medium mb-1">Требования:</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-line">{job.requirements}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-foreground text-sm mb-1 font-medium">Хотите присоединиться?</p>
              <p className="text-muted-foreground text-sm">
                Отправьте резюме на <a href="mailto:hr@derevo-master.ru" className="text-primary hover:underline">hr@derevo-master.ru</a> или позвоните по телефону{" "}
                <a href="tel:+79001234567" className="text-primary hover:underline">+7 (900) 123-45-67</a>
              </p>
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
