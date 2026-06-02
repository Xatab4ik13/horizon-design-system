import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ChevronRight, Hammer, Ruler, PaintBucket, Wrench,
  FileDown, ArrowRight, CheckCircle2, Clock, Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { usePageHeader, useServicesContent } from "@/hooks/useSiteContent";

type ServiceDoc = { name: string; desc: string; url?: string; format?: string };

const defaultIcons = [Hammer, Ruler, PaintBucket, Wrench];

const defaultServices = [
  {
    title: "Изготовление мебели на заказ",
    description:
      "Создаём мебель по индивидуальным размерам и эскизам из массива дерева. Столы, стеллажи, кровати, тумбы — любая сложность.",
    features: ["Любые размеры", "Выбор породы дерева", "3D-визуализация", "Гарантия 5 лет"],
    timing: "от 14 дней",
    price: "от 15 000 ₽",
  },
  {
    title: "Замер и проектирование",
    description:
      "Бесплатный выезд замерщика в пределах города. Создание чертежей и 3D-модели будущего изделия для согласования.",
    features: ["Бесплатный замер", "3D-моделирование", "Чертежи в подарок", "Консультация дизайнера"],
    timing: "1–3 дня",
    price: "Бесплатно",
  },
  {
    title: "Реставрация и покраска",
    description:
      "Восстанавливаем старую мебель: шлифовка, ремонт, покрытие маслом, воском или лаком. Даём вторую жизнь любимым вещам.",
    features: ["Шлифовка", "Замена фурнитуры", "Покрытие на выбор", "Антикварная мебель"],
    timing: "от 5 дней",
    price: "от 5 000 ₽",
  },
  {
    title: "Монтаж и сборка",
    description:
      "Профессиональная сборка и установка мебели. Крепление стеллажей, зеркал, полок. Работаем аккуратно и убираем за собой.",
    features: ["Доставка + сборка", "Крепёж в комплекте", "Уборка после монтажа", "Гарантия на работы"],
    timing: "1 день",
    price: "от 3 000 ₽",
  },
];

const defaultCta = {
  title: "Нужна консультация?",
  text: "Позвоните или оставьте заявку — мы поможем подобрать услугу и рассчитаем стоимость вашего проекта.",
  primary: "Оставить заявку",
  secondary: "Позвонить",
  phone: "+7 (900) 123-45-67",
};

const defaultDownloadFiles: ServiceDoc[] = [
  { name: "Прайс-лист 2026", desc: "Актуальные цены на все виды работ", format: "PDF, 1.2 МБ" },
  { name: "Каталог материалов", desc: "Породы дерева, покрытия, фурнитура", format: "PDF, 3.8 МБ" },
  { name: "Бриф на заказ мебели", desc: "Заполните и отправьте нам для быстрого расчёта", format: "PDF, 0.5 МБ" },
];

const ServicesPage = () => {
  const header = usePageHeader("services", { title: "Наши услуги", subtitle: "Полный цикл работ — от замера и проектирования до изготовления, доставки и монтажа" });
  const cms = useServicesContent();
  const [downloadFiles, setDownloadFiles] = useState<ServiceDoc[]>(defaultDownloadFiles);

  const services = (cms.items?.length ? cms.items : defaultServices)
    .filter((s) => (s as { enabled?: boolean }).enabled !== false)
    .map((s, i) => ({
      ...defaultServices[i],
      ...s,
      features: s.features?.length ? s.features : defaultServices[i]?.features ?? [],
      icon: defaultIcons[i] ?? Hammer,
    }));
  const downloadsTitle = cms.downloadsTitle?.trim() || "Скачать документы";
  const cta = { ...defaultCta, ...(cms.cta ?? {}) };

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "services_docs")
      .maybeSingle()
      .then(({ data }) => {
        const items = (data?.value as { items?: ServiceDoc[] } | null)?.items;
        if (Array.isArray(items) && items.length > 0) setDownloadFiles(items);
      });
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
        title="Услуги мастерской"
        description="Изготовление мебели на заказ, реставрация, покрытие, проектирование. Индивидуальный подход, гарантия качества."
      />
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Услуги</span>
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

          {/* Services grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-foreground font-bold text-xl mb-1 group-hover:text-primary transition-colors">
                      {service.title}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {service.timing}
                      </span>
                      <span className="text-primary font-semibold">{service.price}</span>
                    </div>
                  </div>
                </div>

                <p className="text-foreground/70 text-sm leading-relaxed mb-5">
                  {service.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {service.features.map((f) => (
                    <span key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </span>
                  ))}
                </div>

                <Link
                  to="/contacts"
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Заказать услугу <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Downloads section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Скачать документы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {downloadFiles.map((file, idx) => (
                <div
                  key={file.url || file.name || idx}
                  className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <FileDown className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-foreground font-semibold mb-1">{file.name}</h3>
                  <p className="text-foreground/60 text-sm mb-3">{file.desc}</p>
                  {file.format && <p className="text-xs text-muted-foreground mb-4">{file.format}</p>}
                  {file.url ? (
                    <Button asChild variant="outline" size="sm" className="rounded-full w-full">
                      <a href={file.url} target="_blank" rel="noreferrer" download>Скачать</a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-full w-full" disabled>
                      Скоро
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Нужна консультация?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Позвоните или оставьте заявку — мы поможем подобрать услугу и рассчитаем стоимость вашего проекта.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contacts">
                <Button size="lg" className="rounded-full px-8">
                  Оставить заявку
                </Button>
              </Link>
              <a href="tel:+79001234567">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  <Phone className="h-4 w-4 mr-2" /> Позвонить
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;
