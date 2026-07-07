import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Package, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizePhone } from "@/lib/phone";

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_method: string;
  payment_method: string;
  delivery_address: string | null;
  payment_url: string | null;
  items: unknown;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

const formatPrice = (n: number) => Number(n).toLocaleString("ru-RU") + " ₽";
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const statusLabel: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Ждёт оплаты", color: "text-orange-400 bg-orange-500/10" },
  new: { label: "Оплачен · принят", color: "text-primary bg-primary/10" },
  in_progress: { label: "В производстве", color: "text-yellow-500 bg-yellow-500/10" },
  shipped: { label: "В пути", color: "text-blue-400 bg-blue-500/10" },
  completed: { label: "Выполнен", color: "text-green-500 bg-green-500/10" },
  delivered: { label: "Доставлен", color: "text-green-500 bg-green-500/10" },
  cancelled: { label: "Отменён", color: "text-red-500 bg-red-500/10" },
};

const PAY_WINDOW_HOURS = 24;

const formatCountdown = (msLeft: number) => {
  if (msLeft <= 0) return "истекло";
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return `${h}ч ${m}м`;
};

const tabs = [
  { id: "orders", label: "Мои заказы", icon: Package },
  { id: "profile", label: "Профиль", icon: User },
  { id: "settings", label: "Настройки", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const AccountPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [active, setActive] = useState<TabId>("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({ first_name: "", last_name: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const loadOrders = () => {
    if (!user) return Promise.resolve();
    return supabase
      .from("orders")
      .select("id, created_at, status, total_amount, delivery_method, payment_method, delivery_address, payment_url, items")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as OrderRow[]) ?? []));
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setOrdersLoading(true);
    // Тихо чистим неоплаченные заказы старше 24ч
    supabase.functions.invoke("tinkoff-payment", { body: { action: "expire" } }).catch(() => {});
    Promise.all([
      loadOrders(),
      supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([_, prof]) => {
      if (cancelled) return;
      if (prof.data) {
        setProfile({
          first_name: prof.data.first_name ?? "",
          last_name: prof.data.last_name ?? "",
          phone: prof.data.phone ?? "",
        });
      }
      setOrdersLoading(false);
    });
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [user]);

  const handlePayNow = async (order: OrderRow) => {
    setPayingId(order.id);
    try {
      const { data, error } = await supabase.functions.invoke("tinkoff-payment", {
        body: { action: "init", orderId: order.id },
      });
      const url = (data as any)?.paymentUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      toast({
        title: "Не удалось открыть оплату",
        description: (data as any)?.error ?? error?.message ?? "Попробуйте ещё раз позже.",
        variant: "destructive",
      });
    } catch (e: any) {
      toast({ title: "Не удалось открыть оплату", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setPayingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
        },
        { onConflict: "user_id" },
      );
    setProfileSaving(false);
    if (error) {
      toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Профиль обновлён" });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Личный кабинет</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {profile.first_name || profile.last_name
                  ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
                  : "Личный кабинет"}
              </h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="rounded-xl gap-2 self-start">
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            {/* Tabs */}
            <aside className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-3 h-fit">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActive(t.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                      active === t.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </aside>

            {/* Content */}
            <section>
              {active === "orders" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold text-foreground mb-4">Мои заказы</h2>
                  {ordersLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-card/60 border border-border rounded-2xl p-10 text-center">
                      <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">У вас пока нет заказов</p>
                      <Link to="/catalog">
                        <Button className="rounded-full">В каталог</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const items = Array.isArray(order.items) ? (order.items as Array<{ name: string; quantity: number; price: number; image?: string }>) : [];
                        const status = statusLabel[order.status] ?? { label: order.status, color: "text-muted-foreground bg-muted/20" };
                        const isPending = order.status === "pending_payment";
                        const deadline = new Date(order.created_at).getTime() + PAY_WINDOW_HOURS * 3_600_000;
                        const msLeft = deadline - now;
                        return (
                          <div
                            key={order.id}
                            className={`bg-card/60 backdrop-blur-sm border rounded-2xl p-5 ${isPending ? "border-orange-500/40" : "border-border"}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                              <div>
                                <p className="text-foreground font-semibold">
                                  Заказ #DW-{order.id.slice(0, 6).toUpperCase()}
                                </p>
                                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full ${status.color}`}>
                                {status.label}
                              </span>
                            </div>

                            {isPending && (
                              <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm">
                                  <div className="text-orange-300 font-semibold">Ожидает оплаты</div>
                                  <div className="text-xs text-muted-foreground">
                                    Осталось {formatCountdown(msLeft)}. После истечения заказ будет отменён автоматически.
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handlePayNow(order)}
                                  disabled={payingId === order.id || msLeft <= 0}
                                  className="rounded-full"
                                >
                                  {payingId === order.id ? "Открываем..." : "Оплатить"}
                                </Button>
                              </div>
                            )}

                            <div className="space-y-2 mb-4">
                              {items.map((it, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                  {it.image && (
                                    <img src={it.image} alt={it.name} loading="lazy" decoding="async" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground line-clamp-1">{it.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {it.quantity} × {formatPrice(it.price)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50 text-sm">
                              <span className="text-muted-foreground">
                                {order.delivery_method}
                                {order.delivery_address ? ` · ${order.delivery_address}` : ""}
                              </span>
                              <span className="text-primary font-bold">
                                {formatPrice(Number(order.total_amount))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {active === "profile" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8"
                >
                  <h2 className="text-xl font-bold text-foreground mb-6">Профиль</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Имя</label>
                      <input
                        value={profile.first_name ?? ""}
                        onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Фамилия</label>
                      <input
                        value={profile.last_name ?? ""}
                        onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Телефон</label>
                      <input
                        type="tel"
                        value={profile.phone ?? ""}
                        onFocus={(e) => { if (!e.target.value) setProfile((p) => ({ ...p, phone: "+7 " })); }}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: normalizePhone(e.target.value) }))}
                        className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                      <input
                        value={user.email ?? ""}
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-background/30 border border-border text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <Button onClick={saveProfile} disabled={profileSaving} className="rounded-xl">
                    {profileSaving ? "Сохраняем..." : "Сохранить изменения"}
                  </Button>
                </motion.div>
              )}

              {active === "settings" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8"
                >
                  <h2 className="text-xl font-bold text-foreground mb-4">Настройки</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Выйти из аккаунта или сменить пароль через восстановление по email.
                  </p>
                  <Button variant="outline" onClick={handleSignOut} className="rounded-xl gap-2">
                    <LogOut className="h-4 w-4" />
                    Выйти из аккаунта
                  </Button>
                </motion.div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountPage;
