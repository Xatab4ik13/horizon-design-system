import { motion } from "framer-motion";
import {
  Truck, MapPin, Calculator, Clock, Package, CreditCard,
  ShieldCheck, Receipt, Tag, ChevronRight, Phone, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState } from "react";

// ─── Delivery companies ───
const deliveryCompanies = [
  {
    name: "СДЭК",
    description: "Доставка по всей России и СНГ. Более 3 000 пунктов выдачи.",
    timing: "2–7 дней",
    color: "hsl(120 60% 40%)",
    features: ["Пункты выдачи", "Курьерская доставка", "Примерка при получении"],
  },
  {
    name: "Boxberry",
    description: "Сеть из 4 500+ пунктов выдачи по всей стране.",
    timing: "3–10 дней",
    color: "hsl(350 70% 50%)",
    features: ["Пункты выдачи", "Постаматы", "Частичный выкуп"],
  },
  {
    name: "ПЭК",
    description: "Перевозка крупногабаритных грузов и мебели по России.",
    timing: "3–14 дней",
    color: "hsl(210 70% 50%)",
    features: ["Крупногабарит", "Страхование", "До терминала / до двери"],
  },
  {
    name: "Деловые Линии",
    description: "Транспортная компания для крупных и тяжёлых отправлений.",
    timing: "2–10 дней",
    color: "hsl(30 80% 50%)",
    features: ["Сборный груз", "Доставка до двери", "Жёсткая упаковка"],
  },
  {
    name: "Почта России",
    description: "Доставка в любой населённый пункт страны, включая отдалённые.",
    timing: "5–21 день",
    color: "hsl(220 60% 45%)",
    features: ["Любой адрес РФ", "Наложенный платёж", "Трекинг"],
  },
  {
    name: "Яндекс Доставка",
    description: "Быстрая курьерская доставка в крупных городах за 1–2 дня.",
    timing: "1–2 дня",
    color: "hsl(45 100% 50%)",
    features: ["Экспресс-доставка", "Курьер до двери", "Отслеживание в реальном времени"],
  },
];

// ─── Payment methods ───
const paymentMethods = [
  {
    name: "Банковские карты",
    description: "Visa, Mastercard, МИР — оплата на сайте через защищённый платёжный шлюз.",
    icon: CreditCard,
  },
  {
    name: "YooKassa",
    description: "Приём платежей через YooKassa — один из крупнейших агрегаторов в России.",
    icon: ShieldCheck,
  },
  {
    name: "CloudPayments",
    description: "Мгновенная оплата с поддержкой рекуррентных платежей и Apple Pay / Google Pay.",
    icon: ShieldCheck,
  },
  {
    name: "Онлайн-чеки (54-ФЗ)",
    description: "Все чеки формируются автоматически и отправляются в ФНС в соответствии с 54-ФЗ.",
    icon: Receipt,
  },
  {
    name: "Промокоды и купоны",
    description: "Введите промокод при оформлении заказа и получите скидку. Следите за акциями!",
    icon: Tag,
  },
];

// ─── Delivery Calculator (placeholder) ───
const DeliveryCalculator = () => {
  const [city, setCity] = useState("");
  const [calculated, setCalculated] = useState(false);

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Калькулятор доставки</h3>
          <p className="text-sm text-muted-foreground">Рассчитайте стоимость и сроки</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Город</label>
          <input
            type="text"
            value={city}
            onChange={(e) => { setCity(e.target.value); setCalculated(false); }}
            placeholder="Например, Москва"
            className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Вес (кг)</label>
          <input
            type="number"
            placeholder="5"
            className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-end">
          <Button
            className="w-full rounded-xl"
            size="lg"
            onClick={() => city && setCalculated(true)}
          >
            Рассчитать
          </Button>
        </div>
      </div>

      {calculated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { company: "СДЭК", price: "от 450 ₽", days: "3–5 дней" },
            { company: "Boxberry", price: "от 390 ₽", days: "4–7 дней" },
            { company: "Яндекс Доставка", price: "от 350 ₽", days: "1–2 дня" },
          ].map((r) => (
            <div key={r.company} className="p-4 rounded-xl bg-background/40 border border-border/50">
              <p className="text-sm font-semibold text-foreground mb-1">{r.company}</p>
              <p className="text-primary font-bold text-lg">{r.price}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" /> {r.days}
              </p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// ─── Page ───
const DeliveryPaymentPage = () => {
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
            <span className="text-foreground">Доставка и оплата</span>
          </nav>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Доставка и оплата
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Мы работаем с надёжными транспортными компаниями и обеспечиваем безопасную упаковку
              каждого изделия ручной работы.
            </p>
          </motion.div>

          {/* ═══════ DELIVERY SECTION ═══════ */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Способы доставки</h2>
                <p className="text-muted-foreground text-sm">Выберите удобный способ получения заказа</p>
              </div>
            </motion.div>

            {/* Company cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {deliveryCompanies.map((company, i) => (
                <motion.div
                  key={company.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group"
                >
                  {/* Logo placeholder */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: company.color }}
                    >
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold text-lg group-hover:text-primary transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {company.timing}
                      </p>
                    </div>
                  </div>

                  <p className="text-foreground/70 text-sm mb-4 leading-relaxed">
                    {company.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {company.features.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/5 text-primary/80 border border-primary/10"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pickup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 mb-10"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Самовывоз</h3>
                  <p className="text-sm text-muted-foreground">Бесплатно из нашей мастерской</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-foreground/70 text-sm leading-relaxed mb-3">
                    Вы можете забрать заказ самостоятельно из нашей мастерской. Перед визитом, пожалуйста,
                    свяжитесь с нами для согласования времени. Мы расположены в удобном месте с бесплатной парковкой.
                  </p>
                  <ul className="space-y-2">
                    {["Бесплатно", "Осмотр изделия перед покупкой", "Бесплатная парковка"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-background/40 rounded-xl p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">Адрес мастерской</p>
                  <p className="text-foreground font-medium mb-3">г. Москва, ул. Примерная, д. 1</p>
                  <p className="text-sm text-muted-foreground mb-2">Время работы</p>
                  <p className="text-foreground font-medium mb-3">Пн–Пт: 10:00 — 19:00</p>
                  <p className="text-sm text-muted-foreground mb-2">Контакт</p>
                  <a href="tel:+79001234567" className="text-primary font-medium flex items-center gap-2 hover:underline">
                    <Phone className="h-4 w-4" /> +7 (900) 123-45-67
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <DeliveryCalculator />
            </motion.div>
          </section>

          {/* ═══════ PACKAGING ═══════ */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Надёжная упаковка</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Индивидуальная упаковка",
                    desc: "Каждое изделие упаковывается вручную в несколько слоёв защитного материала.",
                  },
                  {
                    title: "Жёсткий каркас",
                    desc: "Для крупных и хрупких изделий мы используем деревянную обрешётку или жёсткий короб.",
                  },
                  {
                    title: "Страхование",
                    desc: "Все отправления застрахованы на полную стоимость товара. Если что-то случится — мы заменим бесплатно.",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <h4 className="text-foreground font-semibold mb-2">{item.title}</h4>
                    <p className="text-foreground/70 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ═══════ PAYMENT SECTION ═══════ */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Способы оплаты</h2>
                <p className="text-muted-foreground text-sm">Безопасные и удобные варианты оплаты</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentMethods.map((method, i) => (
                <motion.div
                  key={method.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg mb-2">{method.name}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">{method.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ═══════ FAQ ═══════ */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Частые вопросы
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: "Сколько стоит доставка?",
                  a: "Стоимость зависит от города, веса и выбранной транспортной компании. Воспользуйтесь калькулятором выше для расчёта. Самовывоз — бесплатно.",
                },
                {
                  q: "Как быстро отправляете заказ?",
                  a: "Товары в наличии отправляем в течение 1–3 рабочих дней после оплаты. Изделия на заказ — в срок, указанный на странице товара.",
                },
                {
                  q: "Можно ли оплатить при получении?",
                  a: "Да, наложенный платёж доступен при отправке Почтой России и СДЭК. Обратите внимание: транспортная компания взимает комиссию за эту услугу.",
                },
                {
                  q: "Что делать, если товар пришёл повреждённым?",
                  a: "Все отправления застрахованы. Сфотографируйте повреждение и свяжитесь с нами — мы заменим товар или вернём деньги в кратчайшие сроки.",
                },
                {
                  q: "Как использовать промокод?",
                  a: "Введите промокод на странице оформления заказа в поле «Промокод». Скидка применится автоматически. Промокоды не суммируются с другими акциями.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group bg-card/40 border border-border rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer text-foreground font-medium hover:text-primary transition-colors">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 text-foreground/70 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeliveryPaymentPage;
