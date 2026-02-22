import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRight, User, Package, Heart, MapPin, LogOut,
  Clock, Eye, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const tabs = [
  { id: "orders", label: "Мои заказы", icon: Package },
  { id: "favorites", label: "Избранное", icon: Heart },
  { id: "addresses", label: "Адреса", icon: MapPin },
  { id: "settings", label: "Настройки", icon: Settings },
];

// Mock orders
const mockOrders = [
  {
    id: "#DW-48291",
    date: "15 февраля 2026",
    status: "В производстве",
    statusColor: "text-yellow-500",
    total: "42 500 ₽",
    items: 2,
  },
  {
    id: "#DW-47830",
    date: "2 февраля 2026",
    status: "Доставлен",
    statusColor: "text-green-500",
    total: "18 900 ₽",
    items: 1,
  },
  {
    id: "#DW-46512",
    date: "10 января 2026",
    status: "Доставлен",
    statusColor: "text-green-500",
    total: "67 200 ₽",
    items: 3,
  },
];

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [isLoggedIn] = useState(false); // mock

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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Вход в аккаунт</h1>
                <p className="text-muted-foreground text-sm mb-8">Войдите, чтобы отслеживать заказы и управлять профилем</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block text-left">Email</label>
                    <input className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors" placeholder="mail@example.com" type="email" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block text-left">Пароль</label>
                    <input className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors" placeholder="••••••••" type="password" />
                  </div>
                </div>

                <Button size="lg" className="w-full rounded-xl mb-4">Войти</Button>

                <p className="text-sm text-muted-foreground">
                  Нет аккаунта? <button className="text-primary hover:underline">Зарегистрироваться</button>
                </p>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card/60 px-3 text-muted-foreground">или</span></div>
                </div>

                <Link to="/checkout">
                  <Button variant="outline" className="w-full rounded-xl">
                    Оформить заказ как гость
                  </Button>
                </Link>
              </motion.div>
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
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6">
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
                          <div className="text-right">
                            <p className={`text-sm font-medium ${order.statusColor}`}>{order.status}</p>
                            <p className="text-foreground font-bold mt-1">{order.total}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">{order.items} товар(ов)</p>
                          <button className="text-primary text-sm flex items-center gap-1 hover:gap-2 transition-all">
                            <Eye className="h-3.5 w-3.5" /> Подробнее
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "favorites" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-foreground text-lg mb-2">Избранное пусто</p>
                  <p className="text-muted-foreground text-sm mb-6">Нажмите ♥ на товаре, чтобы добавить</p>
                  <Link to="/catalog"><Button className="rounded-full">В каталог</Button></Link>
                </motion.div>
              )}

              {activeTab === "addresses" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Адреса доставки</h2>
                  <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">Основной адрес</p>
                        <p className="text-sm text-muted-foreground mt-1">г. Москва, ул. Примерная, д. 10, кв. 5</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl mt-4">+ Добавить адрес</Button>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Настройки профиля</h2>
                  <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
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
                    <div className="flex items-center gap-3 mt-6">
                      <input type="checkbox" defaultChecked className="rounded" id="notif" />
                      <label htmlFor="notif" className="text-sm text-foreground/80">Получать уведомления о статусе заказа по email</label>
                    </div>
                    <Button className="rounded-xl mt-6">Сохранить изменения</Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountPage;
