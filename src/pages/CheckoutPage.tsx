import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRight, User, Truck, CreditCard, CheckCircle2, MapPin,
  Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import logoYandex from "@/assets/logo-yandex-delivery.png";

const parseDims = (s?: string) => {
  if (!s) return { w: 30, h: 30, d: 30 };
  const nums = s.match(/\d+(?:[.,]\d+)?/g)?.map((n) => Number(n.replace(",", "."))) ?? [];
  return { w: nums[0] ?? 30, h: nums[1] ?? 30, d: nums[2] ?? 30 };
};
const parseWeight = (s?: string) => {
  if (!s) return 1;
  const n = Number((s.match(/\d+(?:[.,]\d+)?/)?.[0] ?? "1").replace(",", "."));
  return n || 1;
};

interface QuoteResult {
  ok: boolean;
  cost?: number;
  days?: string;
  error?: string;
}

const paymentOptions = [
  { id: "card", label: "Банковская карта", desc: "Visa, Mastercard, МИР" },
  { id: "yookassa", label: "YooKassa", desc: "Онлайн-оплата через агрегатор" },
  { id: "cod", label: "При получении", desc: "Наложенный платёж (комиссия ТК)" },
];

const steps = ["Контактные данные", "Доставка", "Оплата", "Готово"];

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const [delivery, setDelivery] = useState<"yandex" | "pek" | "cdek" | "pickup">("yandex");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [quotes, setQuotes] = useState<{ yandex?: QuoteResult; pek?: QuoteResult; cdek?: QuoteResult } | null>(null);
  const [quoting, setQuoting] = useState(false);

  const [payment, setPayment] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    phone: "+7 ",
    email: "",
  });

  // Гарантируем префикс +7 в телефоне (п.8)
  const onPhoneChange = (raw: string) => {
    let v = raw.replace(/[^\d+\s\-()]/g, "");
    const digits = v.replace(/\D/g, "");
    if (!v.startsWith("+")) v = "+" + (digits.startsWith("7") ? digits : "7" + digits);
    if (!v.startsWith("+7")) v = "+7" + v.replace(/^\+?\d?/, "");
    setContact((c) => ({ ...c, phone: v }));
  };

  useEffect(() => {
    if (!user) return;
    setContact((c) => ({ ...c, email: c.email || user.email || "" }));
    supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setContact((c) => ({
          firstName: c.firstName || (data.first_name ?? ""),
          lastName: c.lastName || (data.last_name ?? ""),
          phone: c.phone || (data.phone ?? ""),
          email: c.email || user.email || "",
        }));
      });
  }, [user]);

  const formatPrice = (n: number) => n.toLocaleString("ru-RU") + " ₽";

  const isPickup = delivery === "pickup";
  const selectedQuote = isPickup ? null : quotes?.[delivery];
  const canProceedToPayment =
    isPickup || (city.trim().length > 1 && address.trim().length > 0 && !!selectedQuote?.ok);
  const canProceedFromContact =
    contact.firstName.trim().length >= 2 &&
    contact.lastName.trim().length >= 2 &&
    contact.phone.trim().length >= 5 &&
    contact.email.trim().length >= 3;

  const requestQuote = async () => {
    if (!city.trim() || !address.trim()) {
      toast({ title: "Укажите город и адрес", variant: "destructive" });
      return;
    }
    setQuoting(true);
    setQuotes(null);
    try {
      const { data, error } = await supabase.functions.invoke("delivery-quote", {
        body: {
          city: city.trim(),
          address: address.trim(),
          items: items.map((i) => {
            const d = parseDims(i.dimensions);
            return {
              width_cm: d.w, height_cm: d.h, depth_cm: d.d,
              weight_kg: parseWeight(i.weight),
              price: i.price, quantity: i.quantity,
            };
          }),
        },
      });
      if (error) throw error;
      setQuotes(data);
    } catch (e: any) {
      toast({ title: "Ошибка расчёта", description: e?.message ?? String(e), variant: "destructive" });
    }
    setQuoting(false);
  };

  const deliveryShipping = isPickup ? 0 : (selectedQuote?.cost ?? 0);
  const grandTotal = totalPrice + deliveryShipping;

  const handleComplete = async () => {
    if (submitting) return;
    setSubmitting(true);
    const customerName = `${contact.firstName.trim()} ${contact.lastName.trim()}`.trim();
    const providerName =
      delivery === "yandex"
        ? "Яндекс Доставка"
        : delivery === "pek"
        ? "ПЭК"
        : delivery === "cdek"
        ? "СДЭК"
        : "Самовывоз";

    const { data, error } = await supabase.functions.invoke("order-place", {
      body: {
        user_id: user?.id ?? null,
        customer_name: customerName,
        customer_phone: contact.phone.trim(),
        customer_email: contact.email.trim() || null,
        delivery_method: providerName,
        delivery_address: isPickup ? null : `${city.trim()}, ${address.trim()}`,
        delivery_provider: delivery,
        delivery_city: isPickup ? null : city.trim(),
        delivery_cost: deliveryShipping || null,
        delivery_days: selectedQuote?.days ?? null,
        payment_method: paymentOptions.find((p) => p.id === payment)?.label ?? payment,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          variations: i.variationLabels ?? null,
          dimensions: i.dimensions ?? null,
          weight: i.weight ?? null,
        })),
        total_amount: grandTotal,
      },
    });

    setSubmitting(false);

    const errMsg = error?.message ?? (data as any)?.error;
    if (errMsg) {
      toast({
        title: "Не удалось оформить заказ",
        description: errMsg,
        variant: "destructive",
      });
      return;
    }

    const orderId = (data as any)?.data?.order_id as string | undefined;
    const deliveryRes = (data as any)?.data?.delivery as
      | { ok: boolean; tracking?: string; error?: string }
      | undefined;

    setOrderNumber(orderId ? `DW-${orderId.slice(0, 6).toUpperCase()}` : "");

    if (delivery !== "pickup") {
      if (deliveryRes?.ok) {
        toast({
          title: "Заявка перевозчику создана",
          description: deliveryRes.tracking ? `Трек: ${deliveryRes.tracking}` : undefined,
        });
      } else if (deliveryRes?.error) {
        toast({
          title: "Заказ принят, но заявка перевозчику не создана",
          description: "Менеджер оформит её вручную и свяжется с вами.",
        });
      }
    }

    setStep(3);
    clearCart();
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)" }}>
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center py-20">
            <p className="text-xl text-foreground mb-4">Корзина пуста</p>
            <Link to="/catalog"><Button size="lg" className="rounded-full">В каталог</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)" }}>
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/cart" className="hover:text-primary transition-colors">Корзина</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Оформление</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Оформление заказа</h1>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-10 max-w-2xl">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-card/60 border border-border text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {step === 3 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-foreground mb-3">Заказ оформлен!</h2>
              <p className="text-muted-foreground mb-2">Номер заказа: <span className="text-foreground font-semibold">#{orderNumber}</span></p>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {isPickup
                  ? "Мы свяжемся с вами, когда заказ будет готов к выдаче."
                  : "Мы передадим заказ перевозчику и пришлём трек-номер на email."}
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/catalog"><Button size="lg" className="rounded-full">Продолжить покупки</Button></Link>
                <Link to="/account"><Button variant="outline" size="lg" className="rounded-full">Мои заказы</Button></Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Step 0: Contact info */}
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <User className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">Контактные данные</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {([
                        { key: "firstName", label: "Имя *", placeholder: "Иван", type: "text" },
                        { key: "lastName", label: "Фамилия *", placeholder: "Иванов", type: "text" },
                        { key: "phone", label: "Телефон *", placeholder: "+7 (900) 123-45-67", type: "tel" },
                        { key: "email", label: "Email *", placeholder: "mail@example.com", type: "email" },
                      ] as const).map((f) => (
                        <div key={f.key}>
                          <label className="text-sm text-muted-foreground mb-1.5 block">{f.label}</label>
                          <input
                            type={f.type}
                            value={contact[f.key]}
                            onChange={(e) =>
                              f.key === "phone"
                                ? onPhoneChange(e.target.value)
                                : setContact((c) => ({ ...c, [f.key]: e.target.value }))
                            }
                            className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                            placeholder={f.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Уже есть аккаунт? <Link to="/account" className="text-primary hover:underline">Войти</Link>
                    </p>
                    <Button onClick={() => setStep(1)} size="lg" disabled={!canProceedFromContact} className="rounded-xl w-full sm:w-auto">
                      Далее: Доставка
                    </Button>
                  </motion.div>
                )}

                {/* Step 1: Delivery */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Truck className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">Способ доставки</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="text-sm text-muted-foreground mb-1.5 block">Город *</label>
                          <input
                            value={city}
                            onChange={(e) => { setCity(e.target.value); setQuotes(null); }}
                            className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                            placeholder="Москва"
                            disabled={isPickup}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-sm text-muted-foreground mb-1.5 block">Адрес *</label>
                          <input
                            value={address}
                            onChange={(e) => { setAddress(e.target.value); setQuotes(null); }}
                            className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                            placeholder="ул. Примерная, 1, кв. 2"
                            disabled={isPickup}
                          />
                        </div>
                      </div>

                      {!isPickup && (
                        <Button
                          onClick={requestQuote}
                          disabled={quoting || !city.trim() || !address.trim()}
                          variant="outline"
                          className="rounded-xl"
                        >
                          {quoting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Считаем...</> : "Рассчитать стоимость"}
                        </Button>
                      )}
                    </div>

                    {/* Варианты доставки */}
                    <div className="space-y-3 mb-6">
                      {/* Самовывоз */}
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        delivery === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}>
                        <input type="radio" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          delivery === "pickup" ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {delivery === "pickup" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <MapPin className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">Самовывоз</p>
                          <p className="text-xs text-muted-foreground">По готовности</p>
                        </div>
                        <span className="text-primary font-semibold text-sm">Бесплатно</span>
                      </label>

                      {/* Яндекс */}
                      <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        !quotes?.yandex?.ok ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      } ${delivery === "yandex" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <input type="radio" checked={delivery === "yandex"} 
                          onChange={() => setDelivery("yandex")} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          delivery === "yandex" ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {delivery === "yandex" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <img src={logoYandex} alt="Яндекс" className="h-8 object-contain" />
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">Яндекс Доставка</p>
                          <p className="text-xs text-muted-foreground">
                            {quotes?.yandex?.ok ? quotes.yandex.days : (quotes?.yandex?.error ?? "Введите адрес и нажмите «Рассчитать»")}
                          </p>
                        </div>
                        {quotes?.yandex?.ok && (
                          <span className="text-primary font-semibold text-sm whitespace-nowrap">{formatPrice(quotes.yandex.cost!)}</span>
                        )}
                      </label>

                      {/* ПЭК */}
                      <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        !quotes?.pek?.ok ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      } ${delivery === "pek" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <input type="radio" checked={delivery === "pek"} 
                          onChange={() => setDelivery("pek")} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          delivery === "pek" ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {delivery === "pek" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <Truck className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">ПЭК</p>
                          <p className="text-xs text-muted-foreground">
                            {quotes?.pek?.ok ? quotes.pek.days : (quotes?.pek?.error ?? "Введите адрес и нажмите «Рассчитать»")}
                          </p>
                        </div>
                        {quotes?.pek?.ok && (
                          <span className="text-primary font-semibold text-sm whitespace-nowrap">{formatPrice(quotes.pek.cost!)}</span>
                        )}
                      </label>

                      {/* СДЭК */}
                      <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        !quotes?.cdek?.ok ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      } ${delivery === "cdek" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <input type="radio" checked={delivery === "cdek"} 
                          onChange={() => setDelivery("cdek")} className="sr-only" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          delivery === "cdek" ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {delivery === "cdek" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <Truck className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">СДЭК</p>
                          <p className="text-xs text-muted-foreground">
                            {quotes?.cdek?.ok ? quotes.cdek.days : (quotes?.cdek?.error ?? "Введите адрес и нажмите «Рассчитать»")}
                          </p>
                        </div>
                        {quotes?.cdek?.ok && (
                          <span className="text-primary font-semibold text-sm whitespace-nowrap">{formatPrice(quotes.cdek.cost!)}</span>
                        )}
                      </label>
                    </div>

                    {!canProceedToPayment && !isPickup && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <AlertCircle className="h-3.5 w-3.5 text-primary/60" />
                        <span>Укажите адрес, рассчитайте и выберите способ доставки</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(0)} className="rounded-xl">Назад</Button>
                      <Button
                        onClick={() => setStep(2)}
                        size="lg"
                        className="rounded-xl"
                        disabled={!canProceedToPayment}
                      >
                        Далее: Оплата
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">Способ оплаты</h2>
                    </div>

                    <div className="space-y-3 mb-6">
                      {paymentOptions.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            payment === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                          }`}
                        >
                          <input type="radio" name="payment" value={opt.id} checked={payment === opt.id} onChange={() => setPayment(opt.id)} className="sr-only" />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            payment === opt.id ? "border-primary" : "border-muted-foreground/30"
                          }`}>
                            {payment === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="text-foreground font-medium text-sm">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Promo */}
                    <div className="flex gap-2 mb-6">
                      <input type="text" placeholder="Промокод или сертификат" className="flex-1 px-4 py-2.5 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors text-sm" />
                      <Button variant="outline" className="rounded-xl px-4">Применить</Button>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">Назад</Button>
                      <Button onClick={handleComplete} size="lg" disabled={submitting} className="rounded-xl">{submitting ? "Оформление..." : "Оформить заказ"}</Button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Order summary sidebar */}
              <div>
                <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 sticky top-36">
                  <h3 className="text-lg font-bold text-foreground mb-4">Ваш заказ</h3>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                        <div className="min-w-0">
                          <p className="text-foreground text-sm font-medium line-clamp-1">{item.name}</p>
                          {item.variationLabels && Object.keys(item.variationLabels).length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {Object.entries(item.variationLabels).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(item.price)}</p>
                          {item.dimensions && <p className="text-[10px] text-muted-foreground/70">{item.dimensions} · {item.weight}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border/50 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Товары</span>
                      <span className="text-foreground">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Доставка</span>
                      <span className="text-foreground">
                        {isPickup
                          ? "Бесплатно (самовывоз)"
                          : selectedQuote?.ok
                            ? formatPrice(selectedQuote.cost!)
                            : "Не рассчитана"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border/50">
                      <span className="text-foreground font-semibold">Итого</span>
                      <span className="text-primary font-bold text-xl">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
