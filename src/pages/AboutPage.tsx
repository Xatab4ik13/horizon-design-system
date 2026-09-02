import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAboutContent } from "@/hooks/useSiteContent";
import workshopBg from "@/assets/workshop-bg.jpg";

const defaults = {
  title: "О нас",
  subtitle: "Мастерская FAKTURA — изделия из массива дерева с 2015 года",
  intro:
    "FAKTURA — небольшая столярная мастерская. Мы делаем мебель, панно, зеркала и предметы интерьера из массива дерева: дуб, ясень, бук, сосна, орех.\n\nКаждое изделие проходит через руки мастера: от отбора доски до финишного покрытия маслом или воском. Мы не работаем с ЛДСП и шпоном — только настоящее дерево, которое живёт десятилетиями.\n\nРаботаем и по своим моделям из каталога, и полностью на заказ — по вашим размерам, эскизам и интерьеру.",
  stats: [
    { value: "10+", label: "лет в дереве" },
    { value: "1200+", label: "изделий сделано" },
    { value: "5 лет", label: "гарантия на мебель" },
    { value: "100%", label: "массив дерева" },
  ],
  values: [
    { title: "Только массив", desc: "Никакого ЛДСП и пластика. Сушёная доска камерной сушки, отобранная вручную." },
    { title: "Ручная работа", desc: "Шлифовка, сборка и покрытие делаются вручную, без конвейера." },
    { title: "Свои размеры", desc: "Любое изделие из каталога можем изготовить в ваших габаритах." },
    { title: "Честные сроки", desc: "Говорим реальный срок изготовления и держим его." },
  ],
  cta: {
    title: "Хотите изделие под свой интерьер?",
    text: "Расскажите, что нужно — посчитаем стоимость и сроки. Замер и консультация бесплатно.",
    primary: "Обсудить проект",
    phone: "+7 (900) 123-45-67",
  },
};

const AboutPage = () => {
  const cms = useAboutContent();

  const title = cms.title?.trim() || defaults.title;
  const subtitle = cms.subtitle?.trim() || defaults.subtitle;
  const intro = (cms.intro?.trim() || defaults.intro).split(/\n{2,}/).filter(Boolean);
  const image = cms.image?.trim() || workshopBg;
  const stats = cms.stats?.length ? cms.stats : defaults.stats;
  const values = cms.values?.length ? cms.values : defaults.values;
  const cta = { ...defaults.cta, ...(cms.cta ?? {}) };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <SEO
        title={`${title} — мастерская FAKTURA`}
        description={subtitle}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: title,
            description: subtitle,
          },
        ]}
      />
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Заголовок */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mb-14"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
          </motion.header>

          {/* Текст + фото */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              {intro.map((p, i) => (
                <p key={i} className="text-foreground/80 leading-relaxed">
                  {p}
                </p>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl overflow-hidden border border-border/50"
            >
              <img
                src={image}
                alt="Столярная мастерская FAKTURA"
                loading="lazy"
                className="w-full h-full object-cover aspect-[4/3]"
              />
            </motion.div>
          </div>

          {/* Цифры */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20"
          >
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/40 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.section>

          {/* Принципы */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Как мы работаем</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {values.map((v, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-card/40 p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border/50 bg-card/40 p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{cta.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">{cta.text}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full gap-2">
                <Link to="/contacts">
                  {cta.primary}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              {cta.phone && (
                <Button asChild size="lg" variant="outline" className="rounded-full gap-2">
                  <a href={`tel:${cta.phone.replace(/[^+\d]/g, "")}`}>
                    <Phone className="h-5 w-5" />
                    {cta.phone}
                  </a>
                </Button>
              )}
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
