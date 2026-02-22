import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRight, User, Package, Heart, MapPin, LogOut,
  Clock, Eye, Settings, Truck, RefreshCw, FileText,
  Download, CheckCircle2, CircleDot, PackageCheck,
  ShoppingCart, Trash2, Edit, Star, ExternalLink, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

import productPano1 from "@/assets/product-pano-1.jpeg";
import productMirror1 from "@/assets/product-mirror-1.jpeg";
import productShelf2 from "@/assets/product-shelf-2.jpg";

import logoCdek from "@/assets/logo-cdek.png";

// ─── Tabs ───
const tabs = [
  { id: "orders", label: "Мои заказы", icon: Package },
  { id: "tracking", label: "Отслеживание", icon: Truck },
  { id: "favorites", label: "Избранное", icon: Heart },
  { id: "addresses", label: "Адреса", icon: MapPin },
  { id: "forms", label: "Формы услуг", icon: FileText },
  { id: "settings", label: "Настройки", icon: Settings },
];

// ─── Mock Data ───
const mockOrders = [
  {
    id: "#DW-48291",
    date: "15 февраля 2026",
    status: "В производстве",
    statusColor: "text-yellow-500",
    statusBg: "bg-yellow-500/10",
    total: 42500,
    items: [
      { name: "Панно «Волна»", price: 28500, qty: 1, image: productPano1, productId: "pano-wave" },
      { name: "Зеркало «Поток»", price: 14000, qty: 1, image: productMirror1, productId: "mirror-stream" },
    ],
    delivery: { company: "СДЭК", tracking: "1234567890", logo: logoCdek },
  },
  {
    id: "#DW-47830",
    date: "2 февраля 2026",
    status: "В пути",
    statusColor: "text-blue-500",
    statusBg: "bg-blue-500/10",
    total: 18900,
    items: [
      { name: "Полка настенная «Лофт»", price: 18900, qty: 1, image: productShelf2, productId: "shelf-loft" },
    ],
    delivery: { company: "СДЭК", tracking: "9876543210", logo: logoCdek },
  },
  {
    id: "#DW-46512",
    date: "10 января 2026",
    status: "Доставлен",
    statusColor: "text-green-500",
    statusBg: "bg-green-500/10",
    total: 67200,
    items: [
      { name: "Панно «Волна»", price: 28500, qty: 2, image: productPano1, productId: "pano-wave" },
      { name: "Полка настенная «Лофт»", price: 10200, qty: 1, image: productShelf2, productId: "shelf-loft" },
    ],
    delivery: { company: "СДЭК", tracking: "5555555555", logo: logoCdek },
  },
];

const mockFavorites = [
  { id: "pano-wave", name: "Панно «Волна»", price: 28500, image: productPano1, inStock: true },
  { id: "mirror-stream", name: "Зеркало «Поток»", price: 14000, image: productMirror1, inStock: true },
  { id: "shelf-loft", name: "Полка настенная «Лофт»", price: 18900, image: productShelf2, inStock: false },
];

const mockAddresses = [
  { id: "1", label: "Дом", address: "г. Москва, ул. Примерная, д. 10, кв. 5", isDefault: true },
  { id: "2", label: "Работа", address: "г. Москва, Пресненская наб., д. 12, офис 401", isDefault: false },
];

const trackingSteps = [
  { label: "Отправлен со склада", date: "10 фев, 16:00", done: true },
  { label: "Передан курьеру", date: "11 фев, 10:20", done: true },
  { label: "В пути", date: "11 фев, 12:00", done: true, active: true },
  { label: "Прибыл в пункт выдачи", date: "—", done: false },
  { label: "Доставлен", date: "—", done: false },
];

const serviceForms = [
  {
    id: "custom-order",
    title: "Заявка на индивидуальный заказ",
    desc: "Заполните бриф — опишите размеры, материал, пожелания по дизайну",
    fields: ["Тип изделия", "Размеры (Д×Ш×В)", "Порода дерева", "Покрытие", "Пожелания"],
  },
  {
    id: "measurement",
    title: "Заявка на замер",
    desc: "Оставьте заявку на бесплатный выезд замерщика",
    fields: ["Адрес", "Удобная дата", "Контактный телефон", "Что нужно замерить"],
  },
  {
    id: "restoration",
    title: "Заявка на реставрацию",
    desc: "Опишите изделие, которое нужно восстановить — приложите фото",
    fields: ["Тип мебели", "Что нужно сделать", "Фото (ссылка)", "Контактный телефон"],
  },
];

const formatPrice = (n: number) => n.toLocaleString("ru-RU") + " ₽";

// ─── Phone Login Form ───
const PhoneLoginForm = () => {
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 1) return digits.length ? `+7` : "";
    let formatted = "+7 (";
    if (digits.length > 1) formatted += digits.slice(1, 4);
    if (digits.length > 4) formatted += ") " + digits.slice(4, 7);
    if (digits.length > 7) formatted += "-" + digits.slice(7, 9);
    if (digits.length > 9) formatted += "-" + digits.slice(9, 11);
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSendCode = () => {
    if (phone.replace(/\D/g, "").length === 11) {
      setCodeSent(true);
      toast.success("Код отправлен на " + phone);
    }
  };

  const handleLogin = () => {
    if (code.length === 4) {
      toast.success("Вход выполнен!");
      // В реальном приложении здесь будет авторизация
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Phone className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Вход в кабинет</h1>
      <p className="text-muted-foreground text-sm mb-8">Введите номер телефона — мы отправим код для входа</p>

      {!codeSent ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block text-left">Номер телефона</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={handlePhoneChange}
              type="tel"
            />
          </div>
          <Button size="lg" className="w-full rounded-xl" onClick={handleSendCode} disabled={phone.replace(/\D/g, "").length < 11}>
            Получить код
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Код отправлен на <span className="text-foreground font-medium">{phone}</span></p>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block text-left">Код из SMS</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="• • • •"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
            />
          </div>
          <Button size="lg" className="w-full rounded-xl" onClick={handleLogin} disabled={code.length < 4}>
            Войти
          </Button>
          <button className="text-sm text-primary hover:underline" onClick={() => { setCodeSent(false); setCode(""); }}>
            Изменить номер
          </button>
        </div>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card/60 px-3 text-muted-foreground">или</span></div>
      </div>
      <Link to="/checkout">
        <Button variant="outline" className="w-full rounded-xl">Оформить заказ как гость</Button>
      </Link>
    </motion.div>
  );
};

// ─── Order Detail Modal ───
const OrderDetail = ({ order, onClose }: { order: typeof mockOrders[0]; onClose: () => void }) => {
  const { addItem } = useCart();

  const handleRepeat = () => {
    order.items.forEach((item) => {
      addItem({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
      }, item.qty);
    });
    toast.success("Товары добавлены в корзину");
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">Заказ {order.id}</h3>
            <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${order.statusBg} ${order.statusColor}`}>
            {order.status}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.productId}`} className="text-foreground text-sm font-medium hover:text-primary transition-colors">{item.name}</Link>
                <p className="text-xs text-muted-foreground">{item.qty} × {formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
        </div>

        {order.delivery && (
          <div className="bg-background/40 rounded-xl p-4 border border-border/50 mb-6">
            <div className="flex items-center gap-3">
              <img src={order.delivery.logo} alt={order.delivery.company} className="h-6 object-contain" />
              <div>
                <p className="text-sm text-foreground font-medium">{order.delivery.company}</p>
                <p className="text-xs text-muted-foreground">Трек: {order.delivery.tracking}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-border/50 mb-6">
          <span className="text-muted-foreground text-sm">Итого</span>
          <span className="text-foreground font-bold text-lg">{formatPrice(order.total)}</span>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleRepeat} className="flex-1 rounded-xl gap-2">
            <RefreshCw className="h-4 w-4" /> Повторить заказ
          </Button>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Закрыть
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Page ───
const AccountPage = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [isLoggedIn] = useState(true); // mock as logged in to show all features
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);
  const [activeForm, setActiveForm] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)" }}>
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">Личный кабинет</span>
            </nav>
            <div className="max-w-md mx-auto">
              <PhoneLoginForm />
            </div>
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
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Личный кабинет</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div>
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 sticky top-36">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">Иван Иванов</p>
                    <p className="text-xs text-muted-foreground">ivan@example.com</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors">
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* ════ ORDERS ════ */}
              {activeTab === "orders" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Мои заказы</h2>
                  <div className="space-y-4">
                    {mockOrders.map((order) => (
                      <div key={order.id} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-foreground font-semibold">{order.id}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" /> {order.date}
                            </p>
                          </div>
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${order.statusBg} ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Item previews */}
                        <div className="flex gap-2 mt-4">
                          {order.items.map((item, i) => (
                            <img key={i} src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-border/50" />
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border/50">
                          <p className="text-foreground font-bold">{formatPrice(order.total)}</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 text-xs" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-3.5 w-3.5" /> Подробнее
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 text-xs" onClick={() => {
                              order.items.forEach((item) => {
                                // Using useCart through parent scope
                              });
                              setSelectedOrder(order);
                            }}>
                              <RefreshCw className="h-3.5 w-3.5" /> Повторить
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ════ TRACKING ════ */}
              {activeTab === "tracking" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Отслеживание доставки</h2>

                  {/* Active shipment */}
                  <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <img src={logoCdek} alt="СДЭК" className="h-8 object-contain" />
                        <div>
                          <p className="text-foreground font-semibold">Заказ #DW-47830</p>
                          <p className="text-xs text-muted-foreground">Трек-номер: 9876543210</p>
                        </div>
                      </div>
                      <a href="https://www.cdek.ru/tracking" target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 hover:underline">
                        Отследить на сайте ТК <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-8">
                      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                      {trackingSteps.map((step, i) => (
                        <div key={i} className="relative mb-6 last:mb-0">
                          <div className={`absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center ${
                            step.active
                              ? "bg-primary text-primary-foreground"
                              : step.done
                                ? "bg-primary/20 text-primary"
                                : "bg-card border border-border text-muted-foreground"
                          }`}>
                            {step.done ? (
                              step.active ? <Truck className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <CircleDot className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className={`text-sm font-medium ${step.active ? "text-primary" : step.done ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{step.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivered order */}
                  <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-foreground font-medium">Заказ #DW-46512 — <span className="text-green-500">Доставлен</span></p>
                        <p className="text-xs text-muted-foreground">Получен 18 января 2026</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════ FAVORITES ════ */}
              {activeTab === "favorites" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Избранное</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockFavorites.map((item) => (
                      <div key={item.id} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-all">
                        <Link to={`/product/${item.id}`}>
                          <div className="aspect-square overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link to={`/product/${item.id}`} className="text-foreground font-semibold text-sm hover:text-primary transition-colors line-clamp-1">{item.name}</Link>
                          <p className="text-primary font-bold mt-1">{formatPrice(item.price)}</p>
                          <div className="flex items-center justify-between mt-3">
                            {item.inStock ? (
                              <span className="text-xs text-green-500 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> В наличии
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Под заказ</span>
                            )}
                            <div className="flex gap-1">
                              <button className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="В корзину">
                                <ShoppingCart className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Удалить">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ════ ADDRESSES ════ */}
              {activeTab === "addresses" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Сохранённые адреса</h2>
                  <div className="space-y-4 mb-4">
                    {mockAddresses.map((addr) => (
                      <div key={addr.id} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-foreground font-semibold">{addr.label}</p>
                            {addr.isDefault && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">По умолчанию</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{addr.address}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="rounded-xl">+ Добавить адрес</Button>
                </motion.div>
              )}

              {/* ════ SERVICE FORMS ════ */}
              {activeTab === "forms" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Формы услуг</h2>
                  <p className="text-muted-foreground text-sm mb-6">Заполните форму онлайн или скачайте бланк для заполнения</p>

                  <div className="space-y-4">
                    {serviceForms.map((form) => (
                      <div key={form.id} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-foreground font-semibold">{form.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{form.desc}</p>
                            </div>
                          </div>
                        </div>

                        {activeForm === form.id ? (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              {form.fields.map((field) => (
                                <div key={field}>
                                  <label className="text-sm text-muted-foreground mb-1.5 block">{field}</label>
                                  <input className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors" placeholder={field} />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-3">
                              <Button className="rounded-xl" onClick={() => {
                                toast.success("Заявка отправлена! Мы свяжемся с вами.");
                                setActiveForm(null);
                              }}>
                                Отправить заявку
                              </Button>
                              <Button variant="outline" className="rounded-xl" onClick={() => setActiveForm(null)}>
                                Отмена
                              </Button>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex gap-3 mt-2">
                            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setActiveForm(form.id)}>
                              <Edit className="h-3.5 w-3.5" /> Заполнить онлайн
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => toast.success("Бланк скачан")}>
                              <Download className="h-3.5 w-3.5" /> Скачать бланк
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ════ SETTINGS ════ */}
              {activeTab === "settings" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Настройки профиля</h2>
                  <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Личные данные</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Имя", value: "Иван" },
                        { label: "Фамилия", value: "Иванов" },
                        { label: "Телефон", value: "+7 (900) 123-45-67" },
                        { label: "Email", value: "ivan@example.com" },
                      ].map((f) => (
                        <div key={f.label}>
                          <label className="text-sm text-muted-foreground mb-1.5 block">{f.label}</label>
                          <input className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors" defaultValue={f.value} />
                        </div>
                      ))}
                    </div>
                    <Button className="rounded-xl mt-6">Сохранить изменения</Button>
                  </div>

                  {/* Notifications */}
                  <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Уведомления</h3>
                    <div className="space-y-4">
                      {[
                        { id: "email-status", label: "Статус заказа по Email", checked: true },
                        { id: "sms-status", label: "Статус заказа по SMS", checked: false },
                        { id: "email-promo", label: "Акции и скидки по Email", checked: true },
                        { id: "sms-promo", label: "Акции и скидки по SMS", checked: false },
                      ].map((n) => (
                        <label key={n.id} className="flex items-center justify-between py-2 cursor-pointer">
                          <span className="text-sm text-foreground/80">{n.label}</span>
                          <div className={`w-11 h-6 rounded-full relative transition-colors ${n.checked ? "bg-primary" : "bg-muted"}`}>
                            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${n.checked ? "translate-x-5.5" : "translate-x-0.5"}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default AccountPage;
