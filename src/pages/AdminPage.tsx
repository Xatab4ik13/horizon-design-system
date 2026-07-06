import { useEffect, useState, FormEvent } from "react";
import { adminAuth, adminCall, adminCallSWR, getCachedAdminCall, invalidateAdminCache, adminLogin, adminUploadFile, prefetchAdminSettings } from "@/lib/adminApi";
import { supabase } from "@/integrations/supabase/client";
import { parse1CFile } from "@/lib/import1c";
import { exportProductsTo1CXlsx, downloadBlob } from "@/lib/export1c";
import { toast } from "sonner";
import { invalidateHomepageContent, invalidateNavMenu, invalidateHomepageBlocks, invalidatePagesContent, invalidateContactsContent, invalidateServicesContent, invalidateDeliveryContent, invalidateSeoContent, type PageKey, type SeoPageKey, type SeoContent } from "@/hooks/useSiteContent";
import {
  Package,
  ShoppingBag,
  MessageSquare,
  Briefcase,
  FileText,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Upload,
  FileSpreadsheet,
  QrCode,
  Download,
  Settings,
  ExternalLink,
  ImageIcon,
  Layout,
  Copy,
  Image as ImageLucide,
  Users,
  Search,
  Mail,
  Phone,
  Key,
  CreditCard,

} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

// ===== ОБЩИЕ КЛАССЫ ТЁМНО-СЕРОЙ ТЕМЫ =====
const ui = {
  page: "min-h-screen bg-[#1f1f1f] text-[#e8e8e8] text-[17px]",
  card: "bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6",
  input:
    "w-full bg-[#1a1a1a] border-2 border-[#3a3a3a] rounded-lg px-4 py-3 text-[17px] text-[#e8e8e8] placeholder:text-[#777] focus:border-[#888] focus:outline-none",
  textarea:
    "w-full bg-[#1a1a1a] border-2 border-[#3a3a3a] rounded-lg px-4 py-3 text-[17px] text-[#e8e8e8] placeholder:text-[#777] focus:border-[#888] focus:outline-none resize-y min-h-[100px]",
  btn: "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-[16px] transition-colors",
  btnPrimary: "bg-[#e8e8e8] text-[#1a1a1a] hover:bg-white",
  btnSecondary: "bg-[#3a3a3a] text-[#e8e8e8] hover:bg-[#4a4a4a]",
  btnDanger: "bg-[#5a2a2a] text-[#ffd0d0] hover:bg-[#7a3a3a]",
  label: "block text-[15px] font-semibold text-[#bbb] mb-2 uppercase tracking-wide",
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-2xl font-bold",
  h3: "text-xl font-bold",
  tabActive: "bg-[#e8e8e8] text-[#1a1a1a]",
  tabIdle: "bg-[#2a2a2a] text-[#bbb] hover:bg-[#333]",
};

type Tab = "dashboard" | "products" | "orders" | "requests" | "users" | "emails" | "payments" | "vacancies" | "blog" | "gallery" | "media" | "content" | "settings";

const AdminPage = () => {
  const [authed, setAuthed] = useState(adminAuth.isLoggedIn());
  const [tab, setTab] = useState<Tab>("dashboard");

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Сводка", icon: Package },
    { id: "products", label: "Товары", icon: Package },
    { id: "orders", label: "Заказы", icon: ShoppingBag },
    { id: "requests", label: "Заявки", icon: MessageSquare },
    { id: "users", label: "Пользователи", icon: Users },
    { id: "emails", label: "Письма", icon: Mail },
    { id: "payments", label: "Платежи", icon: CreditCard },

    { id: "vacancies", label: "Вакансии", icon: Briefcase },
    { id: "blog", label: "Блог", icon: FileText },
    { id: "gallery", label: "Галерея", icon: ImageIcon },
    { id: "media", label: "Медиа", icon: ImageLucide },
    { id: "content", label: "Контент сайта", icon: Layout },
    { id: "settings", label: "Настройки", icon: Settings },
  ];


  return (
    <div className={ui.page}>
      <header className="border-b border-[#3a3a3a] bg-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-wider">FAKTURA — АДМИН</h1>
          </div>
          <button
            onClick={() => {
              adminAuth.clear();
              setAuthed(false);
            }}
            className={`${ui.btn} ${ui.btnSecondary}`}
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <nav className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`${ui.btn} ${tab === t.id ? ui.tabActive : ui.tabIdle}`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "dashboard" && <Dashboard onNavigate={setTab} />}
        {tab === "products" && <ProductsPanel />}
        {tab === "orders" && <OrdersPanel />}
        {tab === "requests" && <RequestsPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "emails" && <EmailsPanel />}
        {tab === "payments" && <PaymentsPanel />}

        {tab === "vacancies" && <VacanciesPanel />}

        {tab === "blog" && <BlogPanel />}
        {tab === "gallery" && <GalleryPanel />}
        {tab === "media" && <MediaPanel />}
        {tab === "content" && <ContentPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
};

// ===================================================================
// ЛОГИН
// ===================================================================
const LoginScreen = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await adminLogin(email.trim(), pwd);
      if (ok) onSuccess();
      else toast.error("Неверный email или пароль");
    } catch (err: any) {
      toast.error("Сеть недоступна, попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${ui.page} flex items-center justify-center px-4`}>
      <form onSubmit={submit} className={`${ui.card} w-full max-w-md`}>
        <h1 className={`${ui.h1} mb-2 text-center`}>FAKTURA</h1>
        <p className="text-center text-[#888] mb-8 text-[15px] uppercase tracking-widest">
          Панель администратора
        </p>
        <label className={ui.label}>Email</label>
        <input
          type="email"
          autoFocus
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={ui.input}
          placeholder="admin@example.com"
        />
        <label className={`${ui.label} mt-4`}>Пароль</label>
        <input
          type="password"
          autoComplete="current-password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className={ui.input}
          placeholder="Введите пароль"
        />
        <button
          type="submit"
          disabled={loading || !pwd || !email}
          className={`${ui.btn} ${ui.btnPrimary} w-full mt-6 disabled:opacity-50`}
        >
          {loading ? "Проверка…" : "Войти"}
        </button>
      </form>
    </div>
  );
};

// ===================================================================
// СВОДКА
// ===================================================================
const fmtRub = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("ru-RU")} ₽`;

type Stats = {
  ordersTotal: number; ordersNew: number; ordersToday: number; orders7d: number; orders30d: number;
  revenueTotal: number; revenueToday: number; revenue7d: number; revenue30d: number;
  byStatus: Record<string, number>; byDelivery: Record<string, number>;
  requestsTotal: number; requestsUnread: number; requestsToday: number; requests7d: number;
  productsTotal: number; productsActive: number;
  usersTotal: number;
  emailsTotal: number; emailsFailed: number; emails7d: number;
};

const Dashboard = ({ onNavigate }: { onNavigate: (t: Tab) => void }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminCall<{ data: Stats }>("stats")
      .then((r) => setStats(r.data))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading && !stats) return <p className="text-[#888]">Загрузка сводки…</p>;
  if (!stats) return <p className="text-[#888]">Нет данных.</p>;

  const StatCard = ({ label, value, sub, tab, hot }: { label: string; value: React.ReactNode; sub?: string; tab?: Tab; hot?: boolean }) => (
    <button
      onClick={() => tab && onNavigate(tab)}
      disabled={!tab}
      className={`${ui.card} text-left transition-colors ${tab ? "hover:border-[#666] cursor-pointer" : "cursor-default"}`}
    >
      <div className="text-[13px] uppercase tracking-wider text-[#888] mb-2">{label}</div>
      <div className={`text-4xl font-bold ${hot && Number(value) > 0 ? "text-[#f5b15a]" : ""}`}>{value}</div>
      {sub && <div className="text-[13px] text-[#888] mt-2">{sub}</div>}
    </button>
  );

  const statusOrder = ["new", "in_progress", "shipped", "completed", "cancelled"];
  const statusLabels: Record<string, string> = {
    new: "Новые", in_progress: "В работе", shipped: "Отправлены", completed: "Выполнены", cancelled: "Отменены",
  };
  const deliveryLabels: Record<string, string> = {
    pickup: "Самовывоз", cdek: "СДЭК", yandex: "Яндекс.Доставка", pek: "ПЭК", russianpost: "Почта России",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={ui.h2}>Сводка</h2>
        <button onClick={load} className={`${ui.btn} ${ui.btnSecondary}`}>Обновить</button>
      </div>

      {/* Заказы за периоды */}
      <div>
        <div className="text-[13px] uppercase tracking-wider text-[#888] mb-3">Заказы</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Сегодня" value={stats.ordersToday} sub={fmtRub(stats.revenueToday)} tab="orders" />
          <StatCard label="За 7 дней" value={stats.orders7d} sub={fmtRub(stats.revenue7d)} tab="orders" />
          <StatCard label="За 30 дней" value={stats.orders30d} sub={fmtRub(stats.revenue30d)} tab="orders" />
          <StatCard label="Всего" value={stats.ordersTotal} sub={`Выручка: ${fmtRub(stats.revenueTotal)}`} tab="orders" />
        </div>
      </div>

      {/* Требуют внимания */}
      <div>
        <div className="text-[13px] uppercase tracking-wider text-[#888] mb-3">Требуют внимания</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Новых заказов" value={stats.ordersNew} tab="orders" hot />
          <StatCard label="Непрочитанных заявок" value={stats.requestsUnread} tab="requests" hot />
          <StatCard label="Ошибок писем" value={stats.emailsFailed} tab="emails" hot />
          <StatCard label="Заявок сегодня" value={stats.requestsToday} tab="requests" />
        </div>
      </div>

      {/* Заказы по статусам */}
      {stats.ordersTotal > 0 && (
        <div className={ui.card}>
          <div className="text-[13px] uppercase tracking-wider text-[#888] mb-3">Заказы по статусам</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {statusOrder.map((s) => (
              <div key={s} className="bg-[#1a1a1a] rounded-lg p-4">
                <div className="text-[12px] text-[#888] uppercase">{statusLabels[s]}</div>
                <div className="text-2xl font-bold mt-1">{stats.byStatus[s] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Способы доставки */}
      {Object.keys(stats.byDelivery).length > 0 && (
        <div className={ui.card}>
          <div className="text-[13px] uppercase tracking-wider text-[#888] mb-3">Способы доставки</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(stats.byDelivery)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k} className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[12px] text-[#888] uppercase">{deliveryLabels[k] ?? k}</div>
                  <div className="text-2xl font-bold mt-1">{v}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Прочее */}
      <div>
        <div className="text-[13px] uppercase tracking-wider text-[#888] mb-3">Каталог и клиенты</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Товаров активных" value={stats.productsActive} sub={`Всего: ${stats.productsTotal}`} tab="products" />
          <StatCard label="Пользователей" value={stats.usersTotal} tab="users" />
          <StatCard label="Заявок всего" value={stats.requestsTotal} sub={`За 7 дней: ${stats.requests7d}`} tab="requests" />
          <StatCard label="Писем за 7 дней" value={stats.emails7d} sub={`Всего: ${stats.emailsTotal}`} tab="emails" />
        </div>
      </div>
    </div>
  );
};


// ===================================================================
// ТОВАРЫ
// ===================================================================
const emptyProduct = {
  name: "",
  sku: "",
  description: "",
  category: "interior",
  price: 0,
  discount_percent: 0,
  stock_status: null as string | null,
  width_cm: null as number | null,
  height_cm: null as number | null,
  depth_cm: null as number | null,
  weight_kg: null as number | null,
  weight_gross_kg: null as number | null,
  area_m2: null as number | null,
  volume_m3: null as number | null,
  package_info: null as string | null,
  material: null as string | null,
  wood_species: null as string | null,
  coating: null as string | null,
  brand: null as string | null,
  country: null as string | null,
  manufacturer: null as string | null,
  images: [] as string[],
  options: {} as Record<string, string>,
  is_active: true,
  sort_order: 0,
};

const categoryOptions = [
  { value: "mirrors", label: "Зеркала" },
  { value: "panels", label: "Панно" },
  { value: "doors", label: "Двери" },
  { value: "furniture", label: "Мебель" },
  { value: "kitchen", label: "Кухонные принадлежности" },
  { value: "storage", label: "Системы хранения" },
  { value: "interior", label: "Предметы интерьера" },
  { value: "crafts", label: "Заготовки для творчества" },
];

// ===== Импорт из 1С (XLSX) =====
const Import1CBlock = ({
  onDone,
  defaultCategory,
}: {
  onDone: () => void;
  defaultCategory: string;
}) => {
  const [parsed, setParsed] = useState<any[] | null>(null);
  const [category, setCategory] = useState(defaultCategory);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const items = await parse1CFile(file);
      if (items.length === 0) {
        toast.error("В файле не найдено ни одного товара");
        setParsed(null);
      } else {
        setParsed(items);
        toast.success(`Найдено товаров: ${items.length}`);
      }
    } catch (e: any) {
      toast.error("Ошибка чтения файла: " + e.message);
    }
    setBusy(false);
  };

  const doImport = async () => {
    if (!parsed) return;
    setBusy(true);
    try {
      // Загружаем встроенные изображения из карточек в storage
      const totalImgs = parsed.reduce((s, p: any) => s + (p._images?.length ?? 0), 0);
      let uploadedImgs = 0;
      if (totalImgs > 0) toast.message(`Загрузка изображений: 0/${totalImgs}`);

      const items = [];
      for (const p of parsed) {
        const { _images, ...rest } = p;
        const imageUrls: string[] = [];
        if (_images?.length) {
          for (const img of _images) {
            try {
              const file = new File([img.blob], img.name, { type: img.blob.type });
              const url = await adminUploadFile("product-images", file, { prefix: "1c/" });
              imageUrls.push(url);
              uploadedImgs++;
              if (totalImgs > 0) toast.message(`Загрузка изображений: ${uploadedImgs}/${totalImgs}`);
            } catch (e) {
              console.warn("[1c-import] image upload failed", img.name, e);
            }
          }
        }
        const item: any = {
          ...rest,
          sku: rest.sku || null,
          category,
          is_active: true,
          sort_order: 0,
        };
        if (imageUrls.length) item.images = imageUrls;
        items.push(item);
      }

      const r = await adminCall<{ data: { created: number; updated: number; errors: string[] } }>(
        "products.bulkUpsert",
        { items },
      );
      const { created, updated, errors } = r.data;
      toast.success(
        `Импорт: создано ${created}, обновлено ${updated}` +
          (totalImgs ? `, изображений загружено ${uploadedImgs}/${totalImgs}` : ""),
      );
      if (errors.length) toast.error(`Ошибок: ${errors.length}. См. консоль.`);
      if (errors.length) console.warn("Import errors:", errors);
      setParsed(null);
      setOpen(false);
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${ui.btn} ${ui.btnSecondary}`}>
        <FileSpreadsheet size={18} />
        Импорт из 1С (XLSX)
      </button>
    );
  }

  return (
    <div className={`${ui.card} mb-2`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={ui.h3}>Импорт товаров из 1С</h3>
        <button
          onClick={() => {
            setOpen(false);
            setParsed(null);
          }}
          className={`${ui.btn} ${ui.btnSecondary}`}
        >
          <X size={16} /> Закрыть
        </button>
      </div>

      <div className="grid gap-4">
        <div>
          <label className={ui.label}>Категория для импортируемых товаров</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={ui.input}
          >
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={ui.label}>Файл выгрузки (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
            className={ui.input}
          />
          <p className="text-[13px] text-[#888] mt-2">
            Поддерживается формат «карточка товара» из 1С. Один файл может содержать несколько
            товаров. Сопоставление с существующими — по артикулу. Скидка из 1С игнорируется.
            Встроенные в файл изображения автоматически загружаются как миниатюры товара
            (для существующих товаров — добавляются к уже загруженным без дублей).
          </p>
        </div>

        {parsed && (
          <div className="border border-[#3a3a3a] rounded-lg overflow-hidden">
            <div className="bg-[#1a1a1a] px-4 py-2 text-[14px] text-[#aaa]">
              Предпросмотр ({parsed.length}) — кликните по любому полю, чтобы изменить значение. Нажмите ✕ справа, чтобы удалить позицию из импорта.
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[#888] text-left sticky top-0 bg-[#1a1a1a]">
                  <tr>
                    <th className="px-2 py-2">Артикул</th>
                    <th className="px-2 py-2">Название</th>
                    <th className="px-2 py-2 w-24">Цена</th>
                    <th className="px-2 py-2 w-20">Ш, см</th>
                    <th className="px-2 py-2 w-20">В, см</th>
                    <th className="px-2 py-2 w-20">Г, см</th>
                    <th className="px-2 py-2 w-20">Вес, кг</th>
                    <th className="px-2 py-2 w-16" title="Фото из 1С">Фото</th>
                    <th className="px-2 py-2 w-14"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((p, i) => {
                    const upd = (k: string, v: any) =>
                      setParsed((arr) => arr!.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
                    const num = (v: string) => v === "" ? null : Number(v);
                    const cellInput = "bg-[#0f0f0f] border border-[#3a3a3a] hover:border-[#555] focus:border-amber-500 rounded px-2 py-1 w-full text-[#e8e8e8] focus:outline-none";
                    return (
                      <tr key={i} className="border-t border-[#3a3a3a]">
                        <td className="px-2 py-1"><input value={p.sku ?? ""} onChange={(e) => upd("sku", e.target.value || null)} className={`${cellInput} font-mono text-[12px]`} /></td>
                        <td className="px-2 py-1"><input value={p.name ?? ""} onChange={(e) => upd("name", e.target.value)} className={cellInput} /></td>
                        <td className="px-2 py-1"><input type="number" value={p.price ?? 0} onChange={(e) => upd("price", num(e.target.value) ?? 0)} className={cellInput} /></td>
                        <td className="px-2 py-1"><input type="number" value={p.width_cm ?? ""} onChange={(e) => upd("width_cm", num(e.target.value))} className={cellInput} /></td>
                        <td className="px-2 py-1"><input type="number" value={p.height_cm ?? ""} onChange={(e) => upd("height_cm", num(e.target.value))} className={cellInput} /></td>
                        <td className="px-2 py-1"><input type="number" value={p.depth_cm ?? ""} onChange={(e) => upd("depth_cm", num(e.target.value))} className={cellInput} /></td>
                        <td className="px-2 py-1"><input type="number" value={p.weight_kg ?? ""} onChange={(e) => upd("weight_kg", num(e.target.value))} className={cellInput} /></td>
                        <td className="px-2 py-1 text-center text-[12px] text-amber-400">
                          {(p as any)._images?.length ? `📷 ${(p as any)._images.length}` : "—"}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => setParsed((arr) => arr!.filter((_, idx) => idx !== i))}
                            className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#3a1a1a] hover:bg-[#7a2a2a] text-[#ffb0b0] hover:text-white transition-colors"
                            title="Удалить строку из импорта"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={doImport}
            disabled={!parsed || busy}
            className={`${ui.btn} ${ui.btnPrimary} ${!parsed || busy ? "opacity-50" : ""}`}
          >
            <Check size={18} />
            {busy ? "Импорт…" : `Импортировать${parsed ? ` (${parsed.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// QR-код на страницу товара (для печати/визиток/AR-перехода)
const QrModal = ({ product, onClose }: { product: any; onClose: () => void }) => {
  const url = `${window.location.origin}/product/${product.id}`;
  const download = () => {
    const canvas = document.querySelector("#admin-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${product.sku ?? product.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${ui.card} max-w-md w-full`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={ui.h3}>QR-код товара</h3>
          <button onClick={onClose} className="text-[#888] hover:text-white"><X size={22} /></button>
        </div>
        <p className="text-[14px] text-[#aaa] mb-2 truncate">{product.name}</p>
        <p className="text-[12px] text-[#777] font-mono break-all mb-4">{url}</p>
        <div className="bg-white p-4 rounded-lg flex justify-center mb-4">
          <QRCodeCanvas id="admin-qr-canvas" value={url} size={256} level="H" includeMargin />
        </div>
        <button onClick={download} className={`${ui.btn} ${ui.btnPrimary} w-full`}>
          <Download size={18} />
          Скачать PNG
        </button>
      </div>
    </div>
  );
};

const ProductsPanel = () => {
  const cached = getCachedAdminCall<{ data: any[] }>("products.list");
  const [items, setItems] = useState<any[]>(cached?.data ?? []);
  const [editing, setEditing] = useState<any | null>(null);
  const [qrFor, setQrFor] = useState<any | null>(null);
  const [loading, setLoading] = useState(!cached);

  const load = async () => {
    if (!getCachedAdminCall("products.list")) setLoading(true);
    try {
      const r = await adminCallSWR<{ data: any[] }>("products.list", undefined, (fresh) => {
        setItems(fresh.data ?? []);
      });
      setItems(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    const prev = items;
    setItems((arr) => arr.filter((x) => x.id !== id));
    try {
      await adminCall("products.delete", { id });
      invalidateAdminCache("products.");
      toast.success("Удалено");
    } catch (e: any) {
      setItems(prev);
      toast.error(e.message ?? "Не удалось удалить");
    }
  };


  if (editing) {
    return (
      <ProductEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <Import1CBlock onDone={load} defaultCategory="interior" />

      <div className="flex justify-between items-center mb-6 mt-6 gap-3 flex-wrap">
        <h2 className={ui.h2}>Товары ({items.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              if (!items.length) {
                toast.error("Нет товаров для экспорта");
                return;
              }
              const blob = exportProductsTo1CXlsx(items);
              downloadBlob(blob, `faktura-products-${new Date().toISOString().slice(0, 10)}.xlsx`);
              toast.success(`Экспортировано: ${items.length}`);
            }}
            className={`${ui.btn} ${ui.btnSecondary}`}
            title="Экспорт всех товаров в XLSX в формате карточки 1С (round-trip с импортом)"
          >
            <FileSpreadsheet size={18} />
            Экспорт XLSX (1С)
          </button>
          <button
            onClick={() => setEditing({ ...emptyProduct })}
            className={`${ui.btn} ${ui.btnPrimary}`}
          >
            <Plus size={20} />
            Добавить товар
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>
          Товаров пока нет. Нажмите «Добавить товар».
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className={`${ui.card} flex items-center gap-4`}>
              <div className="relative w-20 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {p.images?.[0] ? (
                  <>
                    <ImageIcon size={28} className="text-[#555]" />
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </>
                ) : (
                  <ImageIcon size={28} className="text-[#555]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[18px] truncate">{p.name}</div>
                <div className="text-[14px] text-[#888]">
                  {p.sku && <span className="text-[#aaa] font-mono mr-2">{p.sku}</span>}
                  {categoryOptions.find((c) => c.value === p.category)?.label ?? p.category} •{" "}
                  {Number(p.price).toLocaleString("ru-RU")} ₽
                  {!p.is_active && " • СКРЫТ"}
                </div>
              </div>
              <a
                href={`/product/${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${ui.btn} ${ui.btnSecondary}`}
                title="Открыть страницу товара на сайте в новой вкладке"
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => setQrFor(p)}
                className={`${ui.btn} ${ui.btnSecondary}`}
                title="QR-код ведёт на страницу товара на сайте — удобно для печати ценников и AR-перехода с телефона"
              >
                <QrCode size={16} />
              </button>
              <button onClick={() => setEditing(p)} className={`${ui.btn} ${ui.btnSecondary}`}>
                <Pencil size={16} />
                Изменить
              </button>
              <button onClick={() => remove(p.id)} className={`${ui.btn} ${ui.btnDanger}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {qrFor && <QrModal product={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
};

const ProductEditor = ({
  initial,
  onCancel,
  onSaved,
}: {
  initial: any;
  onCancel: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [arFileNames, setArFileNames] = useState<{ glb?: string; usdz?: string }>({});
  const [arUploadErrors, setArUploadErrors] = useState<{ glb?: boolean; usdz?: boolean }>({});
  const [imageUploadPreviews, setImageUploadPreviews] = useState<{ id: string; url: string; name: string }[]>([]);

  const fileNameFromUrl = (url?: string | null) => {
    if (!url) return "";
    try {
      const last = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
      return last.replace(/^\d+-/, "") || url;
    } catch {
      return url.split("/").pop()?.replace(/^\d+-/, "") || url;
    }
  };

  const save = async () => {
    if (uploading || arUploading) {
      toast.error("Дождитесь окончания загрузки файлов");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await adminCall("products.update", form);
      } else {
        await adminCall("products.create", form);
      }
      invalidateAdminCache("products.");
      toast.success("Сохранено");

      onSaved();
    } catch (e: any) {
      toast.error(e.message);
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    const preview = { id: `${Date.now()}-${file.name}`, url: URL.createObjectURL(file), name: file.name };
    setImageUploadPreviews((current) => [...current, preview]);
    setUploading(true);
    try {
      const url = await adminUploadFile("product-images", file);
      setForm((current: any) => ({ ...current, images: [...(current.images ?? []), url] }));
      toast.success("Фото загружено");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImageUploadPreviews((current) => current.filter((item) => item.id !== preview.id));
      URL.revokeObjectURL(preview.url);
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setForm((f: any) => ({ ...f, images: (f.images ?? []).filter((_: any, i: number) => i !== idx) }));
  };

  const [arUploading, setArUploading] = useState<"glb" | "usdz" | null>(null);
  const handleArUpload = async (file: File, kind: "glb" | "usdz") => {
    setArUploading(kind);
    setArFileNames((current) => ({ ...current, [kind]: file.name }));
    setArUploadErrors((current) => ({ ...current, [kind]: false }));
    try {
      const url = await adminUploadFile("product-models", file);
      const field = kind === "glb" ? "ar_glb_url" : "ar_usdz_url";
      setForm((current: any) => ({ ...current, [field]: url }));
      toast.success(`${kind.toUpperCase()} загружен`);
    } catch (e: any) {
      setArUploadErrors((current) => ({ ...current, [kind]: true }));
      toast.error(e.message);
    }
    setArUploading(null);
  };

  const NumField = ({ k, label }: { k: string; label: string }) => (
    <div>
      <label className={ui.label}>{label}</label>
      <input
        type="number"
        step="0.1"
        value={form[k] ?? ""}
        onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.value === "" ? null : Number(e.target.value) }))}
        className={ui.input}
      />
    </div>
  );

  return (
    <div className={`${ui.card} max-w-4xl mx-auto`}>
      <h2 className={`${ui.h2} mb-6`}>{form.id ? "Изменить товар" : "Новый товар"}</h2>

      <div className="grid gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={ui.label}>Название *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Артикул (SKU)</label>
            <input
              value={form.sku ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, sku: e.target.value }))}
              className={ui.input}
              placeholder="напр. П0002"
            />
          </div>
        </div>

        <div>
          <label className={ui.label}>Описание</label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
            className={ui.textarea}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={ui.label}>Категория *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))}
              className={ui.input}
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ui.label}>Цена, ₽ *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f: any) => ({ ...f, price: Number(e.target.value) }))}
              className={ui.input}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField k="width_cm" label="Ширина, см" />
          <NumField k="height_cm" label="Высота (длина), см" />
          <NumField k="depth_cm" label="Толщина, см" />
          <NumField k="weight_kg" label="Вес нетто, кг" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={ui.label}>Скидка, %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={form.discount_percent ?? 0}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, discount_percent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))
              }
              className={ui.input}
              placeholder="0"
            />
          </div>
          <div>
            <label className={ui.label}>Наличие</label>
            <select
              value={form.stock_status ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, stock_status: e.target.value || null }))}
              className={ui.input}
            >
              <option value="">— не указано —</option>
              <option value="В наличии">В наличии</option>
              <option value="На заказ">На заказ</option>
              <option value="Под заказ">Под заказ</option>
              <option value="Нет в наличии">Нет в наличии</option>
            </select>
          </div>
          <NumField k="weight_gross_kg" label="Вес брутто, кг" />
          <NumField k="area_m2" label="Площадь, м²" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={ui.label}>Материал</label>
            <input
              value={form.material ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, material: e.target.value || null }))}
              className={ui.input}
              placeholder="напр. Дерево"
            />
          </div>
          <div>
            <label className={ui.label}>Порода</label>
            <input
              value={form.wood_species ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, wood_species: e.target.value || null }))}
              className={ui.input}
              placeholder="напр. Дуб"
            />
          </div>
          <div>
            <label className={ui.label}>Покрытие</label>
            <input
              value={form.coating ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, coating: e.target.value || null }))}
              className={ui.input}
              placeholder="напр. Воск"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NumField k="volume_m3" label="Объём, м³" />
          <div>
            <label className={ui.label}>Упаковка</label>
            <input
              value={form.package_info ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, package_info: e.target.value || null }))}
              className={ui.input}
              placeholder="напр. 200x100x11"
            />
          </div>
          <div>
            <label className={ui.label}>Бренд</label>
            <input
              value={form.brand ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, brand: e.target.value || null }))}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Страна</label>
            <input
              value={form.country ?? ""}
              onChange={(e) => setForm((f: any) => ({ ...f, country: e.target.value || null }))}
              className={ui.input}
              placeholder="напр. Россия"
            />
          </div>
        </div>

        <div>
          <label className={ui.label}>Производитель</label>
          <input
            value={form.manufacturer ?? ""}
            onChange={(e) => setForm((f: any) => ({ ...f, manufacturer: e.target.value || null }))}
            className={ui.input}
          />
        </div>

        <div>
          <label className={ui.label}>Фотографии</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {imageUploadPreviews.map((preview) => (
              <div key={preview.id} className="relative w-28 h-28 rounded-lg overflow-hidden bg-[#1a1a1a] opacity-80">
                <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[11px] text-[#ddd] truncate">
                  Загрузка…
                </div>
              </div>
            ))}
            {form.images?.map((url: string, i: number) => (
              <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                <ImageIcon size={28} className="text-[#555]" />
                <img
                  src={url}
                  alt={`Фото товара ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label
              className={`w-28 h-28 border-2 border-dashed border-[#444] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#666] text-[#888] text-[13px] ${uploading ? "opacity-50" : ""}`}
            >
              <Upload size={24} className="mb-1" />
              {uploading ? "..." : "Загрузить"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* AR-модели */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={ui.label}>AR — Android (.glb)</label>
            <div className="flex gap-2">
              <input
                value={form.ar_glb_url ?? ""}
                onChange={(e) => setForm((f: any) => ({ ...f, ar_glb_url: e.target.value || null }))}
                className={ui.input}
                placeholder="URL или загрузите файл"
              />
              <label
                className={`px-3 flex items-center gap-2 border border-[#444] rounded-lg cursor-pointer hover:border-[#666] text-[13px] whitespace-nowrap ${arUploading === "glb" ? "opacity-50" : ""}`}
              >
                <Upload size={16} />
                {arUploading === "glb" ? "..." : "Файл"}
                <input
                  type="file"
                  accept=".glb,model/gltf-binary"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleArUpload(f, "glb");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {(form.ar_glb_url || arFileNames.glb) && (
              <div className="flex items-center gap-3 mt-1 text-[12px] text-[#888]">
                <span className="truncate">
                  {arUploadErrors.glb ? "Ошибка загрузки: " : "Файл: "}{arFileNames.glb || fileNameFromUrl(form.ar_glb_url)}{arUploading === "glb" ? " — загрузка…" : ""}
                </span>
                <button
                  onClick={() => {
                    setForm((f: any) => ({ ...f, ar_glb_url: null }));
                    setArFileNames((current) => ({ ...current, glb: undefined }));
                    setArUploadErrors((current) => ({ ...current, glb: false }));
                  }}
                  className="hover:text-white flex-shrink-0"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
          <div>
            <label className={ui.label}>AR — iOS (.usdz)</label>
            <div className="flex gap-2">
              <input
                value={form.ar_usdz_url ?? ""}
                onChange={(e) => setForm((f: any) => ({ ...f, ar_usdz_url: e.target.value || null }))}
                className={ui.input}
                placeholder="URL или загрузите файл"
              />
              <label
                className={`px-3 flex items-center gap-2 border border-[#444] rounded-lg cursor-pointer hover:border-[#666] text-[13px] whitespace-nowrap ${arUploading === "usdz" ? "opacity-50" : ""}`}
              >
                <Upload size={16} />
                {arUploading === "usdz" ? "..." : "Файл"}
                <input
                  type="file"
                  accept=".usdz,model/vnd.usdz+zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleArUpload(f, "usdz");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {(form.ar_usdz_url || arFileNames.usdz) && (
              <div className="flex items-center gap-3 mt-1 text-[12px] text-[#888]">
                <span className="truncate">
                  {arUploadErrors.usdz ? "Ошибка загрузки: " : "Файл: "}{arFileNames.usdz || fileNameFromUrl(form.ar_usdz_url)}{arUploading === "usdz" ? " — загрузка…" : ""}
                </span>
                <button
                  onClick={() => {
                    setForm((f: any) => ({ ...f, ar_usdz_url: null }));
                    setArFileNames((current) => ({ ...current, usdz: undefined }));
                    setArUploadErrors((current) => ({ ...current, usdz: false }));
                  }}
                  className="hover:text-white flex-shrink-0"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="active"
            checked={form.is_active}
            onChange={(e) => setForm((f: any) => ({ ...f, is_active: e.target.checked }))}
            className="w-5 h-5"
          />
          <label htmlFor="active" className="text-[16px]">
            Товар отображается на сайте
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#3a3a3a]">
          <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary}`}>
            <Check size={18} />
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
          <button onClick={onCancel} className={`${ui.btn} ${ui.btnSecondary}`}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// ЗАКАЗЫ
// ===================================================================
const orderStatuses = [
  { value: "new", label: "Новый" },
  { value: "in_progress", label: "В работе" },
  { value: "shipped", label: "Отправлен" },
  { value: "completed", label: "Выполнен" },
  { value: "cancelled", label: "Отменён" },
];

const orderStatusLabel = (v: string) => orderStatuses.find((s) => s.value === v)?.label ?? v;

const deliveryMethodLabel = (v: string) => {
  const m: Record<string, string> = {
    pickup: "Самовывоз",
    cdek: "СДЭК",
    yandex: "Яндекс Доставка",
    pek: "ПЭК",
    courier: "Курьер",
    post: "Почта",
  };
  return m[v] ?? v;
};

const paymentMethodLabel = (v: string) => {
  const m: Record<string, string> = {
    card: "Картой онлайн",
    tinkoff: "Тинькофф",
    cash: "Наличные при получении",
    invoice: "Счёт для юр. лица",
    transfer: "Перевод на счёт",
  };
  return m[v] ?? v;
};

const csvEscape = (v: unknown) => {
  const s = v == null ? "" : String(v);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const csv = rows.map((r) => r.map(csvEscape).join(";")).join("\n");
  // BOM для Excel, чтобы корректно читал кириллицу
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const OrdersPanel = () => {
  const cached = getCachedAdminCall<{ data: any[] }>("orders.list");
  const [items, setItems] = useState<any[]>(cached?.data ?? []);
  const [loading, setLoading] = useState(!cached);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // фильтры
  const [status, setStatus] = useState<string>("all");
  const [delivery, setDelivery] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const load = async (silent = false) => {
    if (!silent && !getCachedAdminCall("orders.list")) setLoading(true);
    try {
      const r = await adminCallSWR<{ data: any[] }>("orders.list", undefined, (fresh) => {
        setItems(fresh.data ?? []);
      });
      setItems(r.data ?? []);
    } catch (e: any) {
      if (!silent) toast.error(e.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    invalidateAdminCache("orders.");
    load();
    const t = setInterval(() => {
      invalidateAdminCache("orders.");
      load(true);
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const setStatusFn = async (id: string, s: string) => {
    await adminCall("orders.updateStatus", { id, status: s });
    invalidateAdminCache("orders.");
    toast.success("Статус обновлён");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить заказ?")) return;
    await adminCall("orders.delete", { id });
    invalidateAdminCache("orders.");
    load();
  };

  // Фильтрация
  const filtered = items.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (delivery !== "all") {
      const m = o.delivery_provider || o.delivery_method;
      if (m !== delivery) return false;
    }
    if (dateFrom) {
      if (new Date(o.created_at) < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      // Включительно до конца дня
      const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
      if (new Date(o.created_at) > end) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const hay = `${o.customer_name ?? ""} ${o.customer_phone ?? ""} ${o.customer_email ?? ""} ${o.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const visible = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);

  useEffect(() => { setPage(1); }, [status, delivery, dateFrom, dateTo, search]);

  // Уникальные способы доставки для фильтра
  const deliveryOptions = Array.from(new Set(items.map((o) => o.delivery_provider || o.delivery_method).filter(Boolean)));

  const exportCsv = () => {
    const header = [
      "ID", "Дата", "Статус", "Клиент", "Телефон", "Email",
      "Способ доставки", "Провайдер", "Город", "Адрес", "Трек",
      "Оплата", "Сумма", "Комментарий", "Состав",
    ];
    const rows = filtered.map((o) => [
      o.id,
      new Date(o.created_at).toLocaleString("ru-RU"),
      orderStatusLabel(o.status),
      o.customer_name ?? "",
      o.customer_phone ?? "",
      o.customer_email ?? "",
      deliveryMethodLabel(o.delivery_method),
      o.delivery_provider ?? "",
      o.delivery_city ?? "",
      o.delivery_address ?? "",
      o.delivery_tracking ?? "",
      paymentMethodLabel(o.payment_method),
      Number(o.total_amount ?? 0),
      o.comment ?? "",
      Array.isArray(o.items)
        ? o.items.map((i: any) => `${i.name} × ${i.quantity} = ${Number(i.price * i.quantity)}`).join(" | ")
        : "",
    ]);
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  const resetFilters = () => {
    setStatus("all"); setDelivery("all"); setDateFrom(""); setDateTo(""); setSearch("");
  };

  const hasFilters = status !== "all" || delivery !== "all" || dateFrom || dateTo || search;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className={ui.h2}>Заказы ({filtered.length}{hasFilters ? ` из ${items.length}` : ""})</h2>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!filtered.length} className={`${ui.btn} ${ui.btnSecondary} ${!filtered.length ? "opacity-40" : ""}`}>
            <Download size={16} /> Экспорт CSV
          </button>
          <button onClick={() => { invalidateAdminCache("orders."); load(); }} className={`${ui.btn} ${ui.btnSecondary}`}>
            Обновить
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className={`${ui.card} mb-4`}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-end">
          <div>
            <label className={ui.label}>Поиск</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ФИО, телефон, email, № заказа"
                className={`${ui.input} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className={ui.label}>Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={ui.input}>
              <option value="all">Все</option>
              {orderStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={ui.label}>Доставка</label>
            <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className={ui.input}>
              <option value="all">Все</option>
              {deliveryOptions.map((d) => <option key={d} value={d}>{deliveryMethodLabel(d)}</option>)}
            </select>
          </div>
          <div>
            <label className={ui.label}>С даты</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={ui.input} />
          </div>
          <div>
            <label className={ui.label}>По дату</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={ui.input} />
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className={`${ui.btn} ${ui.btnSecondary}`}>
              <X size={14} /> Сброс
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : filtered.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>
          {items.length === 0 ? "Заказов пока нет." : "Ничего не найдено по фильтрам."}
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {visible.map((o) => (
              <div key={o.id} className={ui.card}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <div className="text-[14px] text-[#888] flex items-center gap-2">
                      <span>№ {o.id.slice(0, 8)}</span>
                      <span>·</span>
                      <span>{new Date(o.created_at).toLocaleString("ru-RU")}</span>
                    </div>
                    <div className="font-bold text-[18px] mt-1 flex items-center gap-2 flex-wrap">
                      {o.customer_name}
                      {o.user_id && (
                        <button
                          onClick={() => setSelectedUser(o.user_id)}
                          className="text-[12px] px-2 py-0.5 bg-[#1e2e3a] text-[#7dd3fc] rounded hover:bg-[#243a4a]"
                          title="Открыть карточку клиента"
                        >
                          <Users size={12} className="inline mr-1" />Клиент сайта
                        </button>
                      )}
                    </div>
                    <div className="text-[15px] text-[#bbb]">
                      {o.customer_phone}
                      {o.customer_email && ` • ${o.customer_email}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {Number(o.total_amount).toLocaleString("ru-RU")} ₽
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => setStatusFn(o.id, e.target.value)}
                      className={`${ui.input} mt-2 max-w-[200px]`}
                    >
                      {orderStatuses.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    className={`${ui.btn} ${ui.btnSecondary}`}
                  >
                    {expanded === o.id ? "Скрыть детали" : "Подробнее"}
                  </button>
                  <button onClick={() => remove(o.id)} className={`${ui.btn} ${ui.btnDanger}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
                {expanded === o.id && (
                  <div className="mt-4 pt-4 border-t border-[#3a3a3a] grid gap-3 text-[15px]">
                    <div>
                      <b className="text-[#888]">Доставка:</b> {deliveryMethodLabel(o.delivery_method)}
                      {o.delivery_provider && ` (${o.delivery_provider})`}
                      {o.delivery_city && ` — ${o.delivery_city}`}
                      {o.delivery_address && `, ${o.delivery_address}`}
                      {o.delivery_tracking && (
                        <div className="text-[13px] text-[#888] mt-1">Трек: {o.delivery_tracking}</div>
                      )}
                    </div>
                    <div>
                      <b className="text-[#888]">Оплата:</b> {paymentMethodLabel(o.payment_method)}
                    </div>
                    {o.comment && (
                      <div>
                        <b className="text-[#888]">Комментарий:</b> {o.comment}
                      </div>
                    )}
                    <div>
                      <b className="text-[#888]">Состав:</b>
                      <ul className="mt-2 grid gap-1">
                        {(o.items as any[]).map((i, idx) => (
                          <li key={idx} className="bg-[#1a1a1a] p-3 rounded">
                            {i.name} × {i.quantity} —{" "}
                            {Number(i.price * i.quantity).toLocaleString("ru-RU")} ₽
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-[13px] text-[#888]">
              <span>Стр. {pageSafe} из {totalPages} · показано {visible.length} из {filtered.length}</span>
              <div className="flex gap-2">
                <button
                  disabled={pageSafe <= 1}
                  onClick={() => setPage(pageSafe - 1)}
                  className={`${ui.btn} ${ui.btnSecondary} ${pageSafe <= 1 ? "opacity-40" : ""}`}
                >Назад</button>
                <button
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage(pageSafe + 1)}
                  className={`${ui.btn} ${ui.btnSecondary} ${pageSafe >= totalPages ? "opacity-40" : ""}`}
                >Вперёд</button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <UserDetailsModal
          id={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDeleted={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

// ===================================================================
// ЗАЯВКИ
// ===================================================================
const RequestsPanel = () => {
  const cached = getCachedAdminCall<{ data: any[] }>("requests.list");
  const [items, setItems] = useState<any[]>(cached?.data ?? []);
  const [loading, setLoading] = useState(!cached);

  const [subject, setSubject] = useState<string>("all");
  const [readState, setReadState] = useState<"all" | "unread" | "read">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const load = async () => {
    if (!getCachedAdminCall("requests.list")) setLoading(true);
    try {
      const r = await adminCallSWR<{ data: any[] }>("requests.list", undefined, (fresh) => {
        setItems(fresh.data ?? []);
      });
      setItems(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleRead = async (it: any) => {
    await adminCall("requests.markRead", { id: it.id, is_read: !it.is_read });
    invalidateAdminCache("requests.");
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Удалить заявку?")) return;
    await adminCall("requests.delete", { id });
    invalidateAdminCache("requests.");
    load();
  };

  // Уникальные темы для фильтра
  const subjectOptions = Array.from(new Set(items.map((r) => r.subject).filter(Boolean))) as string[];

  const filtered = items.filter((r) => {
    if (subject !== "all" && r.subject !== subject) return false;
    if (readState === "unread" && r.is_read) return false;
    if (readState === "read" && !r.is_read) return false;
    if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
      if (new Date(r.created_at) > end) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const hay = `${r.name ?? ""} ${r.contact ?? ""} ${r.subject ?? ""} ${r.message ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  useEffect(() => { setPage(1); }, [subject, readState, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const visible = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);

  const unreadCount = items.filter((r) => !r.is_read).length;
  const hasFilters = subject !== "all" || readState !== "all" || dateFrom || dateTo || search;

  const resetFilters = () => {
    setSubject("all"); setReadState("all"); setDateFrom(""); setDateTo(""); setSearch("");
  };

  const exportCsv = () => {
    const header = ["ID", "Дата", "Прочитано", "Имя", "Контакт", "Тема", "Сообщение"];
    const rows = filtered.map((r) => [
      r.id,
      new Date(r.created_at).toLocaleString("ru-RU"),
      r.is_read ? "да" : "нет",
      r.name ?? "",
      r.contact ?? "",
      r.subject ?? "",
      r.message ?? "",
    ]);
    downloadCsv(`requests-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className={ui.h2}>
          Заявки ({filtered.length}{hasFilters ? ` из ${items.length}` : ""})
          {unreadCount > 0 && <span className="ml-3 text-[13px] font-normal text-[#f5b15a]">· непрочитанных: {unreadCount}</span>}
        </h2>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!filtered.length} className={`${ui.btn} ${ui.btnSecondary} ${!filtered.length ? "opacity-40" : ""}`}>
            <Download size={16} /> Экспорт CSV
          </button>
          <button onClick={() => { invalidateAdminCache("requests."); load(); }} className={`${ui.btn} ${ui.btnSecondary}`}>
            Обновить
          </button>
        </div>
      </div>

      <div className={`${ui.card} mb-4`}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-end">
          <div>
            <label className={ui.label}>Поиск</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Имя, контакт, текст"
                className={`${ui.input} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className={ui.label}>Тема</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={ui.input}>
              <option value="all">Все</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={ui.label}>Статус</label>
            <select value={readState} onChange={(e) => setReadState(e.target.value as any)} className={ui.input}>
              <option value="all">Все</option>
              <option value="unread">Непрочитанные</option>
              <option value="read">Прочитанные</option>
            </select>
          </div>
          <div>
            <label className={ui.label}>С даты</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={ui.input} />
          </div>
          <div>
            <label className={ui.label}>По дату</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={ui.input} />
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className={`${ui.btn} ${ui.btnSecondary}`}>
              <X size={14} /> Сброс
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : filtered.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>
          {items.length === 0 ? "Заявок пока нет." : "Ничего не найдено по фильтрам."}
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {visible.map((r) => (
              <div
                key={r.id}
                className={`${ui.card} ${!r.is_read ? "border-l-4 border-l-[#f5b15a]" : ""}`}
              >
                <div className="flex justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="text-[14px] text-[#888]">
                      {new Date(r.created_at).toLocaleString("ru-RU")}
                    </div>
                    <div className="font-bold text-[18px] mt-1">{r.name}</div>
                    <div className="text-[15px] text-[#bbb]">{r.contact}</div>
                    {r.subject && <div className="text-[15px] mt-2 font-semibold">{r.subject}</div>}
                    <div className="text-[15px] mt-2 whitespace-pre-wrap">{r.message}</div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => toggleRead(r)} className={`${ui.btn} ${ui.btnSecondary}`}>
                    {r.is_read ? "Отметить как новое" : "Отметить прочитанным"}
                  </button>
                  <button onClick={() => remove(r.id)} className={`${ui.btn} ${ui.btnDanger}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-[13px] text-[#888]">
              <span>Стр. {pageSafe} из {totalPages} · показано {visible.length} из {filtered.length}</span>
              <div className="flex gap-2">
                <button
                  disabled={pageSafe <= 1}
                  onClick={() => setPage(pageSafe - 1)}
                  className={`${ui.btn} ${ui.btnSecondary} ${pageSafe <= 1 ? "opacity-40" : ""}`}
                >Назад</button>
                <button
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage(pageSafe + 1)}
                  className={`${ui.btn} ${ui.btnSecondary} ${pageSafe >= totalPages ? "opacity-40" : ""}`}
                >Вперёд</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ===================================================================
// ПИСЬМА (ЖУРНАЛ EMAIL)
// ===================================================================
type EmailRow = {
  id: string;
  recipient: string;
  subject: string;
  template: string | null;
  status: string;
  error: string | null;
  related_order_id: string | null;
  related_request_id: string | null;
  metadata: any;
  created_at: string;
};

const emailStatusLabel: Record<string, string> = {
  sent: "Отправлено",
  failed: "Ошибка",
  pending: "В очереди",
  bounced: "Отклонено",
  suppressed: "Заблокировано",
};

const emailStatusColor: Record<string, string> = {
  sent: "bg-[#2a4a2a] text-[#a7e0a7]",
  failed: "bg-[#5a2a2a] text-[#ffd0d0]",
  pending: "bg-[#4a4a2a] text-[#f5e5a7]",
  bounced: "bg-[#5a2a2a] text-[#ffd0d0]",
  suppressed: "bg-[#4a3a2a] text-[#f5c58a]",
};

const EmailsPanel = () => {
  const [items, setItems] = useState<EmailRow[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmailRow | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [template, setTemplate] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminCall<{ items: EmailRow[]; templates: string[] }>("emails.list", {
        search,
        status: status === "all" ? "" : status,
        template: template === "all" ? "" : template,
        dateFrom,
        dateTo,
      });
      setItems(r.items ?? []);
      setTemplates(r.templates ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setPage(1); }, [search, status, template, dateFrom, dateTo]);

  const filtered = items; // Фильтры применяются на бэке

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const visible = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);

  const stats = {
    total: items.length,
    sent: items.filter((i) => i.status === "sent").length,
    failed: items.filter((i) => i.status === "failed" || i.status === "bounced").length,
    pending: items.filter((i) => i.status === "pending").length,
  };

  const hasFilters = !!(search || status !== "all" || template !== "all" || dateFrom || dateTo);
  const resetFilters = () => {
    setSearch(""); setStatus("all"); setTemplate("all"); setDateFrom(""); setDateTo("");
  };

  const exportCsv = () => {
    const header = ["ID", "Дата", "Получатель", "Тема", "Шаблон", "Статус", "Ошибка", "Заказ", "Заявка"];
    const rows = filtered.map((r) => [
      r.id,
      new Date(r.created_at).toLocaleString("ru-RU"),
      r.recipient,
      r.subject,
      r.template ?? "",
      emailStatusLabel[r.status] ?? r.status,
      r.error ?? "",
      r.related_order_id ?? "",
      r.related_request_id ?? "",
    ]);
    downloadCsv(`emails-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  const purge = async () => {
    const daysStr = prompt("Удалить записи старше скольких дней?", "90");
    if (!daysStr) return;
    const days = parseInt(daysStr, 10);
    if (!Number.isFinite(days) || days < 1) return;
    if (!confirm(`Удалить все записи старше ${days} дн.? Это действие необратимо.`)) return;
    try {
      const r = await adminCall<{ deleted: number }>("emails.purge", { days });
      toast.success(`Удалено записей: ${r.deleted}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className={ui.h2}>Журнал писем ({filtered.length})</h2>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!filtered.length} className={`${ui.btn} ${ui.btnSecondary} ${!filtered.length ? "opacity-40" : ""}`}>
            <Download size={16} /> Экспорт CSV
          </button>
          <button onClick={purge} className={`${ui.btn} ${ui.btnDanger}`}>
            <Trash2 size={16} /> Очистить старые
          </button>
          <button onClick={load} className={`${ui.btn} ${ui.btnSecondary}`}>Обновить</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">Всего</div>
          <div className="text-3xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">Отправлено</div>
          <div className="text-3xl font-bold mt-1 text-[#a7e0a7]">{stats.sent}</div>
        </div>
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">Ошибки</div>
          <div className="text-3xl font-bold mt-1 text-[#ffd0d0]">{stats.failed}</div>
        </div>
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">В очереди</div>
          <div className="text-3xl font-bold mt-1 text-[#f5e5a7]">{stats.pending}</div>
        </div>
      </div>

      <div className={`${ui.card} mb-4`}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] items-end">
          <div>
            <label className={ui.label}>Поиск</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Email или тема" className={`${ui.input} pl-8`} />
            </div>
          </div>
          <div>
            <label className={ui.label}>Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={ui.input}>
              <option value="all">Все</option>
              <option value="sent">Отправлено</option>
              <option value="failed">Ошибка</option>
              <option value="pending">В очереди</option>
              <option value="bounced">Отклонено</option>
              <option value="suppressed">Заблокировано</option>
            </select>
          </div>
          <div>
            <label className={ui.label}>Шаблон</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)} className={ui.input}>
              <option value="all">Все</option>
              {templates.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={ui.label}>С даты</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={ui.input} />
          </div>
          <div>
            <label className={ui.label}>По дату</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={ui.input} />
          </div>
          <button onClick={load} className={`${ui.btn} ${ui.btnPrimary}`}>Применить</button>
          {hasFilters && (
            <button onClick={() => { resetFilters(); setTimeout(load, 0); }} className={`${ui.btn} ${ui.btnSecondary}`}>
              <X size={14} /> Сброс
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : filtered.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>
          Писем пока нет. Как только сайт начнёт отправлять уведомления, они появятся здесь.
        </div>
      ) : (
        <>
          <div className={`${ui.card} overflow-x-auto p-0`}>
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[#888] border-b border-[#3a3a3a]">
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Получатель</th>
                  <th className="px-4 py-3">Тема</th>
                  <th className="px-4 py-3">Шаблон</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-b border-[#333] hover:bg-[#2f2f2f]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#bbb]">{new Date(r.created_at).toLocaleString("ru-RU")}</td>
                    <td className="px-4 py-3 font-mono text-[13px]">{r.recipient}</td>
                    <td className="px-4 py-3 max-w-[300px] truncate" title={r.subject}>{r.subject}</td>
                    <td className="px-4 py-3 text-[#888]">{r.template ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-[12px] font-semibold ${emailStatusColor[r.status] ?? "bg-[#3a3a3a]"}`}>
                        {emailStatusLabel[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(r)} className="text-[#e8e8e8] hover:underline">Открыть</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-[13px] text-[#888]">
              <span>Стр. {pageSafe} из {totalPages} · показано {visible.length} из {filtered.length}</span>
              <div className="flex gap-2">
                <button disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)} className={`${ui.btn} ${ui.btnSecondary} ${pageSafe <= 1 ? "opacity-40" : ""}`}>Назад</button>
                <button disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)} className={`${ui.btn} ${ui.btnSecondary} ${pageSafe >= totalPages ? "opacity-40" : ""}`}>Вперёд</button>
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className={`${ui.card} max-w-2xl w-full max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={ui.h3}>Письмо</h3>
              <button onClick={() => setSelected(null)} className={`${ui.btn} ${ui.btnSecondary}`}><X size={16} /></button>
            </div>
            <dl className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-[15px]">
              <dt className="text-[#888]">Дата</dt><dd>{new Date(selected.created_at).toLocaleString("ru-RU")}</dd>
              <dt className="text-[#888]">Получатель</dt><dd className="font-mono">{selected.recipient}</dd>
              <dt className="text-[#888]">Тема</dt><dd>{selected.subject}</dd>
              <dt className="text-[#888]">Шаблон</dt><dd>{selected.template ?? "—"}</dd>
              <dt className="text-[#888]">Статус</dt>
              <dd>
                <span className={`inline-block px-2 py-1 rounded text-[12px] font-semibold ${emailStatusColor[selected.status] ?? "bg-[#3a3a3a]"}`}>
                  {emailStatusLabel[selected.status] ?? selected.status}
                </span>
              </dd>
              {selected.error && (<><dt className="text-[#888]">Ошибка</dt><dd className="text-[#ffd0d0] whitespace-pre-wrap">{selected.error}</dd></>)}
              {selected.related_order_id && (<><dt className="text-[#888]">Заказ</dt><dd className="font-mono text-[12px]">{selected.related_order_id}</dd></>)}
              {selected.related_request_id && (<><dt className="text-[#888]">Заявка</dt><dd className="font-mono text-[12px]">{selected.related_request_id}</dd></>)}
              {selected.metadata && Object.keys(selected.metadata ?? {}).length > 0 && (
                <>
                  <dt className="text-[#888]">Данные</dt>
                  <dd><pre className="bg-[#1a1a1a] p-3 rounded text-[12px] overflow-x-auto">{JSON.stringify(selected.metadata, null, 2)}</pre></dd>
                </>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================================
// ПЛАТЕЖИ (ЖУРНАЛ ТИНЬКОФФ)
// ===================================================================
type PaymentRow = {
  id: string;
  order_id: string | null;
  provider: string;
  event: string;
  amount: number | null;
  currency: string;
  status: string | null;
  payment_id: string | null;
  order_key: string | null;
  raw_request: any;
  raw_response: any;
  error: string | null;
  created_at: string;
  order?: {
    id: string; order_number: string; customer_name: string;
    total_amount: number; payment_status: string | null; refunded_amount: number | null;
  } | null;
};

const paymentEventLabel: Record<string, string> = {
  init: "Инициация", notification: "Webhook", refund: "Возврат", error: "Ошибка",
};

const paymentStatusColor = (s: string | null): string => {
  if (!s) return "bg-[#3a3a3a]";
  if (s === "CONFIRMED" || s === "AUTHORIZED") return "bg-[#2a4a2a] text-[#a7e0a7]";
  if (s === "REFUNDED" || s === "REVERSED") return "bg-[#4a3a2a] text-[#f5c58a]";
  if (s === "REJECTED" || s.startsWith("REJECTED") || s === "CANCELED" || s === "FAILED") return "bg-[#5a2a2a] text-[#ffd0d0]";
  return "bg-[#3a3a3a] text-[#ccc]";
};

const PaymentsPanel = () => {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [event, setEvent] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminCall<{ items: PaymentRow[] }>("payments.list", {
        search,
        status: status === "all" ? "" : status,
        event: event === "all" ? "" : event,
        dateFrom, dateTo,
      });
      setItems(r.items ?? []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setPage(1); }, [search, status, event, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const visible = items.slice((pageSafe - 1) * perPage, pageSafe * perPage);

  const stats = {
    inits: items.filter((i) => i.event === "init").length,
    confirmed: items.filter((i) => i.status === "CONFIRMED").length,
    refunds: items.filter((i) => i.event === "refund").length,
    errors: items.filter((i) => i.event === "error" || (i.status ?? "").startsWith("REJECTED")).length,
  };

  const hasFilters = !!(search || status !== "all" || event !== "all" || dateFrom || dateTo);
  const resetFilters = () => { setSearch(""); setStatus("all"); setEvent("all"); setDateFrom(""); setDateTo(""); };

  const exportCsv = () => {
    const header = ["Дата", "Событие", "Статус", "Заказ", "PaymentId", "Сумма", "Ошибка"];
    const rows = items.map((r) => [
      new Date(r.created_at).toLocaleString("ru-RU"),
      paymentEventLabel[r.event] ?? r.event,
      r.status ?? "",
      r.order?.order_number ?? r.order_key ?? "",
      r.payment_id ?? "",
      r.amount != null ? String(r.amount) : "",
      r.error ?? "",
    ]);
    downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  const doRefund = async (r: PaymentRow) => {
    if (!r.payment_id) { toast.error("Нет PaymentId"); return; }
    const orderAmount = r.order?.total_amount ?? r.amount ?? 0;
    const alreadyRefunded = Number(r.order?.refunded_amount ?? 0);
    const maxRefundable = orderAmount - alreadyRefunded;
    if (maxRefundable <= 0) { toast.error("Уже возвращено полностью"); return; }
    const input = prompt(`Сумма возврата в рублях (макс. ${maxRefundable}). Оставь пустым для полного возврата.`, "");
    if (input === null) return;
    const amount = input.trim() ? parseFloat(input.replace(",", ".")) : 0;
    if (input.trim() && (!Number.isFinite(amount) || amount <= 0 || amount > maxRefundable)) {
      toast.error("Некорректная сумма"); return;
    }
    if (!confirm(`Оформить возврат ${amount > 0 ? amount + " ₽" : "полной суммы"} по PaymentId ${r.payment_id}?`)) return;
    setRefunding(r.id);
    try {
      await adminCall("payments.refund", { paymentId: r.payment_id, amount });
      toast.success("Возврат отправлен в Тинькофф");
      load();
    } catch (e: any) { toast.error(e.message); }
    setRefunding(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className={ui.h2}>Платежи ({items.length})</h2>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!items.length} className={`${ui.btn} ${ui.btnSecondary} ${!items.length ? "opacity-40" : ""}`}>
            <Download size={16} /> Экспорт CSV
          </button>
          <button onClick={load} className={`${ui.btn} ${ui.btnSecondary}`}>Обновить</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">Инициации</div>
          <div className="text-3xl font-bold mt-1">{stats.inits}</div>
        </div>
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">Оплачено</div>
          <div className="text-3xl font-bold mt-1 text-[#a7e0a7]">{stats.confirmed}</div>
        </div>
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">Возвраты</div>
          <div className="text-3xl font-bold mt-1 text-[#f5c58a]">{stats.refunds}</div>
        </div>
        <div className={ui.card}>
          <div className="text-[13px] text-[#888] uppercase tracking-wide">Ошибки</div>
          <div className="text-3xl font-bold mt-1 text-[#ffd0d0]">{stats.errors}</div>
        </div>
      </div>

      <div className={`${ui.card} mb-4`}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] items-end">
          <div>
            <label className={ui.label}>Поиск</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="PaymentId / № заказа" className={`${ui.input} pl-8`} />
            </div>
          </div>
          <div>
            <label className={ui.label}>Событие</label>
            <select value={event} onChange={(e) => setEvent(e.target.value)} className={ui.input}>
              <option value="all">Все</option>
              <option value="init">Инициация</option>
              <option value="notification">Webhook</option>
              <option value="refund">Возврат</option>
              <option value="error">Ошибка</option>
            </select>
          </div>
          <div>
            <label className={ui.label}>Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={ui.input}>
              <option value="all">Все</option>
              <option value="NEW">NEW</option>
              <option value="AUTHORIZED">AUTHORIZED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="REVERSED">REVERSED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </div>
          <div>
            <label className={ui.label}>С даты</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={ui.input} />
          </div>
          <div>
            <label className={ui.label}>По дату</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={ui.input} />
          </div>
          <button onClick={load} className={`${ui.btn} ${ui.btnPrimary}`}>Применить</button>
          {hasFilters && (
            <button onClick={() => { resetFilters(); setTimeout(load, 0); }} className={`${ui.btn} ${ui.btnSecondary}`}>
              <X size={14} /> Сброс
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>
          Платежей пока нет. Как только клиенты начнут оплачивать заказы через Т-Кассу, они появятся здесь.
        </div>
      ) : (
        <>
          <div className={`${ui.card} overflow-x-auto p-0`}>
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[#888] border-b border-[#3a3a3a]">
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Событие</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Заказ</th>
                  <th className="px-4 py-3">PaymentId</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const canRefund = r.status === "CONFIRMED" && r.payment_id && r.event !== "refund";
                  return (
                    <tr key={r.id} className="border-b border-[#333] hover:bg-[#2f2f2f]">
                      <td className="px-4 py-3 whitespace-nowrap text-[#bbb]">{new Date(r.created_at).toLocaleString("ru-RU")}</td>
                      <td className="px-4 py-3">{paymentEventLabel[r.event] ?? r.event}</td>
                      <td className="px-4 py-3">
                        {r.status ? (
                          <span className={`inline-block px-2 py-1 rounded text-[11px] font-semibold ${paymentStatusColor(r.status)}`}>
                            {r.status}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.order ? (
                          <div>
                            <div className="font-semibold">№ {r.order.order_number}</div>
                            <div className="text-[12px] text-[#888]">{r.order.customer_name}</div>
                          </div>
                        ) : r.order_key ? <span className="text-[#888]">{r.order_key}</span> : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px]">{r.payment_id ?? "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {r.amount != null ? formatRub(Number(r.amount)) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => setSelected(r)} className="text-[#e8e8e8] hover:underline mr-3">Открыть</button>
                        {canRefund && (
                          <button
                            onClick={() => doRefund(r)}
                            disabled={refunding === r.id}
                            className="text-[#f5c58a] hover:underline disabled:opacity-40"
                          >
                            {refunding === r.id ? "…" : "Возврат"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-[13px] text-[#888]">
              <span>Стр. {pageSafe} из {totalPages} · показано {visible.length} из {items.length}</span>
              <div className="flex gap-2">
                <button disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)} className={`${ui.btn} ${ui.btnSecondary} ${pageSafe <= 1 ? "opacity-40" : ""}`}>Назад</button>
                <button disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)} className={`${ui.btn} ${ui.btnSecondary} ${pageSafe >= totalPages ? "opacity-40" : ""}`}>Вперёд</button>
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className={`${ui.card} max-w-3xl w-full max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={ui.h3}>Платёж</h3>
              <button onClick={() => setSelected(null)} className={`${ui.btn} ${ui.btnSecondary}`}><X size={16} /></button>
            </div>
            <dl className="grid grid-cols-[160px_1fr] gap-y-3 gap-x-4 text-[15px] mb-4">
              <dt className="text-[#888]">Дата</dt><dd>{new Date(selected.created_at).toLocaleString("ru-RU")}</dd>
              <dt className="text-[#888]">Событие</dt><dd>{paymentEventLabel[selected.event] ?? selected.event}</dd>
              <dt className="text-[#888]">Статус</dt>
              <dd>{selected.status ? (
                <span className={`inline-block px-2 py-1 rounded text-[12px] font-semibold ${paymentStatusColor(selected.status)}`}>{selected.status}</span>
              ) : "—"}</dd>
              <dt className="text-[#888]">Сумма</dt><dd>{selected.amount != null ? formatRub(Number(selected.amount)) : "—"}</dd>
              <dt className="text-[#888]">PaymentId</dt><dd className="font-mono text-[13px]">{selected.payment_id ?? "—"}</dd>
              <dt className="text-[#888]">OrderId</dt><dd className="font-mono text-[13px]">{selected.order_key ?? "—"}</dd>
              {selected.order && (
                <>
                  <dt className="text-[#888]">Заказ</dt>
                  <dd>№ {selected.order.order_number} · {selected.order.customer_name} · {formatRub(Number(selected.order.total_amount))}
                    {Number(selected.order.refunded_amount ?? 0) > 0 && (
                      <span className="ml-2 text-[#f5c58a]">возвращено: {formatRub(Number(selected.order.refunded_amount))}</span>
                    )}
                  </dd>
                </>
              )}
              {selected.error && (<><dt className="text-[#888]">Ошибка</dt><dd className="text-[#ffd0d0] whitespace-pre-wrap">{selected.error}</dd></>)}
            </dl>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-[13px] text-[#888] uppercase mb-2">Запрос</div>
                <pre className="bg-[#1a1a1a] p-3 rounded text-[12px] overflow-x-auto max-h-[300px]">{JSON.stringify(selected.raw_request, null, 2)}</pre>
              </div>
              <div>
                <div className="text-[13px] text-[#888] uppercase mb-2">Ответ</div>
                <pre className="bg-[#1a1a1a] p-3 rounded text-[12px] overflow-x-auto max-h-[300px]">{JSON.stringify(selected.raw_response, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================================



type UserRow = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  ordersCount: number;
  ordersSum: number;
  provider: string;
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const formatRub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

const UsersPanel = () => {
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const r = await adminCall<{ data: { items: UserRow[]; total: number } }>(
        "users.list",
        { page: p, perPage, search: q },
      );
      setItems(r.data.items);
      setTotal(r.data.total);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(1, ""); /* eslint-disable-next-line */ }, []);

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
    load(1, searchInput.trim());
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className={ui.h2}>Пользователи ({total})</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
              placeholder="Email, ФИО, телефон…"
              className={`${ui.input} pl-9 w-64`}
            />
          </div>
          <button onClick={applySearch} className={`${ui.btn} ${ui.btnPrimary}`}>Искать</button>
          {search && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); load(1, ""); }} className={`${ui.btn} ${ui.btnSecondary}`}>Сброс</button>
          )}
        </div>
      </div>

      <div className={`${ui.card} p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#1a1a1a] text-[#888] text-left">
              <tr>
                <th className="p-3 font-normal">Email</th>
                <th className="p-3 font-normal">ФИО</th>
                <th className="p-3 font-normal">Телефон</th>
                <th className="p-3 font-normal">Регистрация</th>
                <th className="p-3 font-normal">Последний вход</th>
                <th className="p-3 font-normal text-right">Заказы</th>
                <th className="p-3 font-normal text-right">Сумма</th>
                <th className="p-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-[#666]">Загрузка…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-[#666]">Пользователи не найдены</td></tr>
              )}
              {items.map((u) => (
                <tr key={u.id} className="border-t border-[#3a3a3a] hover:bg-[#252525]">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{u.email || <span className="text-[#666]">—</span>}</span>
                      {u.emailConfirmed && <Check size={14} className="text-[#4ade80]" />}
                    </div>
                    {u.provider !== "email" && (
                      <div className="text-[11px] text-[#888] uppercase">{u.provider}</div>
                    )}
                  </td>
                  <td className="p-3">{u.fullName || <span className="text-[#666]">—</span>}</td>
                  <td className="p-3">{u.phone || <span className="text-[#666]">—</span>}</td>
                  <td className="p-3 text-[#aaa]">{formatDateTime(u.createdAt)}</td>
                  <td className="p-3 text-[#aaa]">{formatDateTime(u.lastSignInAt)}</td>
                  <td className="p-3 text-right">{u.ordersCount}</td>
                  <td className="p-3 text-right">{u.ordersSum > 0 ? formatRub(u.ordersSum) : "—"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setSelected(u.id)} className={`${ui.btn} ${ui.btnSecondary}`}>
                      Открыть
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-[#3a3a3a] text-[13px] text-[#888]">
            <span>Стр. {page} из {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); load(p, search); }}
                className={`${ui.btn} ${ui.btnSecondary} ${page <= 1 ? "opacity-40" : ""}`}
              >Назад</button>
              <button
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); load(p, search); }}
                className={`${ui.btn} ${ui.btnSecondary} ${page >= totalPages ? "opacity-40" : ""}`}
              >Вперёд</button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <UserDetailsModal
          id={selected}
          onClose={() => setSelected(null)}
          onDeleted={() => { setSelected(null); load(page, search); }}
        />
      )}
    </div>
  );
};

const UserDetailsModal = ({ id, onClose, onDeleted }: { id: string; onClose: () => void; onDeleted: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    adminCall<{ data: any }>("users.get", { id })
      .then((r) => { if (alive) { setData(r.data); setLoading(false); } })
      .catch((e) => { toast.error(e.message); onClose(); });
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [id]);

  const sendReset = async () => {
    if (!data?.user?.email) { toast.error("У пользователя нет email"); return; }
    setBusy("reset");
    try {
      await adminCall("users.sendPasswordReset", { email: data.user.email });
      toast.success("Ссылка для сброса пароля отправлена на email");
    } catch (e: any) { toast.error(e.message); }
    setBusy(null);
  };

  const del = async () => {
    if (!confirm("Удалить пользователя? История заказов будет сохранена (без привязки к аккаунту).")) return;
    setBusy("delete");
    try {
      await adminCall("users.delete", { id });
      toast.success("Пользователь удалён");
      onDeleted();
    } catch (e: any) { toast.error(e.message); setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className={`${ui.card} w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={ui.h2}>Карточка пользователя</h2>
          <button onClick={onClose} className={`${ui.btn} ${ui.btnSecondary}`}><X size={18} /></button>
        </div>

        {loading || !data ? (
          <div className="py-12 text-center text-[#666]">Загрузка…</div>
        ) : (
          <div className="grid gap-6">
            {/* Инфо */}
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-[15px]">
                <Mail size={16} className="text-[#888]" />
                <span>{data.user.email || <span className="text-[#666]">—</span>}</span>
                {data.user.emailConfirmed && <span className="text-[11px] px-2 py-0.5 bg-[#1e3a2e] text-[#4ade80] rounded">Подтверждён</span>}
              </div>
              {data.user.phone && (
                <div className="flex items-center gap-2 text-[15px]">
                  <Phone size={16} className="text-[#888]" />
                  <span>{data.user.phone}</span>
                </div>
              )}
              <div className="text-[14px] text-[#aaa]">
                ФИО: <span className="text-white">{`${data.user.firstName} ${data.user.lastName}`.trim() || "—"}</span>
              </div>
              <div className="text-[13px] text-[#888]">
                Регистрация: {formatDateTime(data.user.createdAt)} · Последний вход: {formatDateTime(data.user.lastSignInAt)} · Метод входа: {data.user.provider}
              </div>
            </div>

            {/* Действия */}
            <div className="flex gap-2 flex-wrap pb-4 border-b border-[#3a3a3a]">
              <button onClick={sendReset} disabled={!!busy} className={`${ui.btn} ${ui.btnSecondary} ${busy ? "opacity-50" : ""}`}>
                <Key size={16} /> {busy === "reset" ? "Отправка…" : "Сбросить пароль"}
              </button>
              <button onClick={del} disabled={!!busy} className={`${ui.btn} ${ui.btnDanger} ${busy ? "opacity-50" : ""}`}>
                <Trash2 size={16} /> {busy === "delete" ? "Удаление…" : "Удалить пользователя"}
              </button>
            </div>

            {/* Заказы */}
            <div>
              <h3 className={`${ui.h3} mb-3`}>Заказы ({data.orders.length})</h3>
              {data.orders.length === 0 ? (
                <p className="text-[#666] text-[14px]">Заказов нет.</p>
              ) : (
                <div className="grid gap-2">
                  {data.orders.map((o: any) => (
                    <div key={o.id} className="p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a]">
                      <div className="flex justify-between items-start gap-3 flex-wrap">
                        <div>
                          <div className="text-[13px] text-[#888]">№ {o.id.slice(0, 8)} · {formatDateTime(o.created_at)}</div>
                          <div className="text-[14px] mt-1">
                            {o.customer_name} · {o.delivery_method === "pickup" ? "Самовывоз" : o.delivery_provider ?? o.delivery_method}
                            {o.delivery_city ? ` · ${o.delivery_city}` : ""}
                          </div>
                          <div className="text-[12px] text-[#888] mt-1">
                            Оплата: {o.payment_method} · Статус: <span className="text-white">{o.status}</span>
                            {o.delivery_tracking ? ` · Трек: ${o.delivery_tracking}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[16px] font-semibold">{formatRub(Number(o.total_amount ?? 0))}</div>
                          <div className="text-[11px] text-[#888]">{Array.isArray(o.items) ? o.items.length : 0} позиций</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Заявки */}
            <div>
              <h3 className={`${ui.h3} mb-3`}>Заявки с сайта ({data.requests.length})</h3>
              {data.requests.length === 0 ? (
                <p className="text-[#666] text-[14px]">Заявок нет.</p>
              ) : (
                <div className="grid gap-2">
                  {data.requests.map((r: any) => (
                    <div key={r.id} className="p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a]">
                      <div className="text-[13px] text-[#888]">{formatDateTime(r.created_at)} · {r.subject ?? "—"}</div>
                      <div className="text-[14px] mt-1">{r.name}{r.contact ? ` · ${r.contact}` : ""}</div>
                      {r.message && <div className="text-[13px] text-[#ccc] mt-1 whitespace-pre-wrap">{r.message}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================================
// ВАКАНСИИ
// ===================================================================
const emptyVacancy = {
  title: "",
  description: "",
  salary: "",
  requirements: "",
  is_active: true,
  sort_order: 0,
};

const VacanciesPanel = () => {
  const cached = getCachedAdminCall<{ data: any[] }>("vacancies.list");
  const [items, setItems] = useState<any[]>(cached?.data ?? []);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    try {
      const r = await adminCallSWR<{ data: any[] }>("vacancies.list", undefined, (fresh) => {
        setItems(fresh.data ?? []);
      });
      setItems(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      if (editing.id) await adminCall("vacancies.update", editing);
      else await adminCall("vacancies.create", editing);
      invalidateAdminCache("vacancies.");
      toast.success("Сохранено");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Удалить вакансию?")) return;
    await adminCall("vacancies.delete", { id });
    invalidateAdminCache("vacancies.");
    load();
  };


  if (editing) {
    return (
      <div className={`${ui.card} max-w-3xl mx-auto`}>
        <h2 className={`${ui.h2} mb-6`}>{editing.id ? "Изменить вакансию" : "Новая вакансия"}</h2>
        <div className="grid gap-4">
          <div>
            <label className={ui.label}>Должность *</label>
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Описание *</label>
            <textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className={ui.textarea}
            />
          </div>
          <div>
            <label className={ui.label}>Зарплата</label>
            <input
              value={editing.salary ?? ""}
              onChange={(e) => setEditing({ ...editing, salary: e.target.value })}
              className={ui.input}
              placeholder="от 60 000 ₽"
            />
          </div>
          <div>
            <label className={ui.label}>Требования</label>
            <textarea
              value={editing.requirements ?? ""}
              onChange={(e) => setEditing({ ...editing, requirements: e.target.value })}
              className={ui.textarea}
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              className="w-5 h-5"
            />
            Вакансия активна
          </label>
          <div className="flex gap-3 pt-4 border-t border-[#3a3a3a]">
            <button onClick={save} className={`${ui.btn} ${ui.btnPrimary}`}>
              <Check size={18} /> Сохранить
            </button>
            <button onClick={() => setEditing(null)} className={`${ui.btn} ${ui.btnSecondary}`}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className={ui.h2}>Вакансии ({items.length})</h2>
        <button
          onClick={() => setEditing({ ...emptyVacancy })}
          className={`${ui.btn} ${ui.btnPrimary}`}
        >
          <Plus size={20} />
          Добавить вакансию
        </button>
      </div>
      <div className="grid gap-3">
        {items.map((v) => (
          <div key={v.id} className={`${ui.card} flex items-start gap-4`}>
            <div className="flex-1">
              <div className="font-bold text-[18px]">{v.title}</div>
              {v.salary && <div className="text-[#f5b15a] mt-1">{v.salary}</div>}
              <div className="text-[15px] text-[#bbb] mt-2">{v.description}</div>
              {!v.is_active && <div className="text-[13px] text-[#888] mt-2">СКРЫТА</div>}
            </div>
            <button onClick={() => setEditing(v)} className={`${ui.btn} ${ui.btnSecondary}`}>
              <Pencil size={16} />
            </button>
            <button onClick={() => remove(v.id)} className={`${ui.btn} ${ui.btnDanger}`}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===================================================================
// БЛОГ
// ===================================================================
const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  is_published: false,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

const BlogPanel = () => {
  const cached = getCachedAdminCall<{ data: any[] }>("blog.list");
  const [items, setItems] = useState<any[]>(cached?.data ?? []);
  const [loading, setLoading] = useState(!cached);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const r = await adminCallSWR<{ data: any[] }>("blog.list", undefined, (fresh) => {
        setItems(fresh.data ?? []);
      });
      setItems(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      const payload = {
        ...editing,
        slug: editing.slug || slugify(editing.title),
        published_at: editing.is_published ? editing.published_at ?? new Date().toISOString() : null,
      };
      if (editing.id) await adminCall("blog.update", payload);
      else await adminCall("blog.create", payload);
      invalidateAdminCache("blog.");
      toast.success("Сохранено");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Удалить статью?")) return;
    await adminCall("blog.delete", { id });
    invalidateAdminCache("blog.");
    load();
  };


  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const url = await adminUploadFile("blog-images", file);
      setEditing({ ...editing, cover_image: url });
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploading(false);
  };

  if (editing) {
    return (
      <div className={`${ui.card} max-w-4xl mx-auto`}>
        <h2 className={`${ui.h2} mb-6`}>{editing.id ? "Изменить статью" : "Новая статья"}</h2>
        <div className="grid gap-4">
          <div>
            <label className={ui.label}>Заголовок *</label>
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>URL (slug)</label>
            <input
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className={ui.input}
              placeholder="оставьте пустым для авто-генерации"
            />
          </div>
          <div>
            <label className={ui.label}>Краткое описание</label>
            <textarea
              value={editing.excerpt ?? ""}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              className={ui.textarea}
            />
          </div>
          <div>
            <label className={ui.label}>Обложка</label>
            {editing.cover_image && (
              <img src={editing.cover_image} alt="" className="w-48 h-32 object-cover rounded-lg mb-2" />
            )}
            <label className={`${ui.btn} ${ui.btnSecondary} cursor-pointer w-fit`}>
              <Upload size={18} />
              {uploading ? "Загрузка…" : "Загрузить обложку"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCover(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div>
            <label className={ui.label}>Содержание *</label>
            <textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              className={`${ui.textarea} min-h-[300px]`}
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={editing.is_published}
              onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
              className="w-5 h-5"
            />
            Опубликовать
          </label>
          <div className="flex gap-3 pt-4 border-t border-[#3a3a3a]">
            <button onClick={save} className={`${ui.btn} ${ui.btnPrimary}`}>
              <Check size={18} /> Сохранить
            </button>
            <button onClick={() => setEditing(null)} className={`${ui.btn} ${ui.btnSecondary}`}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className={ui.h2}>Блог ({items.length})</h2>
        <button
          onClick={() => setEditing({ ...emptyPost })}
          className={`${ui.btn} ${ui.btnPrimary}`}
        >
          <Plus size={20} />
          Новая статья
        </button>
      </div>
      {loading ? (
        <p className="text-[#888] py-8 text-center">Загрузка статей…</p>
      ) : items.length === 0 ? (
        <p className="text-[#888] py-8 text-center">Статей пока нет. Создайте первую — кнопка «Новая статья» сверху.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className={`${ui.card} flex items-start gap-4`}>
              {p.cover_image && (
                <img src={p.cover_image} alt="" className="w-24 h-24 object-cover rounded-lg" />
              )}
              <div className="flex-1">
                <div className="font-bold text-[18px]">{p.title}</div>
                <div className="text-[14px] text-[#888] mt-1">/{p.slug}</div>
                {p.excerpt && <div className="text-[15px] text-[#bbb] mt-2">{p.excerpt}</div>}
                <div className="text-[13px] mt-2">
                  {p.is_published ? (
                    <span className="text-[#7ad07a]">● Опубликовано</span>
                  ) : (
                    <span className="text-[#888]">○ Черновик</span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(p)} className={`${ui.btn} ${ui.btnSecondary}`}>
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(p.id)} className={`${ui.btn} ${ui.btnDanger}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// НАСТРОЙКИ — отправитель (для расчёта/создания доставки)
// ===================================================================
const emptySender = {
  city: "",
  address: "",
  contact_name: "",
  contact_phone: "",
  pek_city_id: "",
  cdek_city_code: "",
};

const SettingsPanel = () => {
  const [sender, setSender] = useState(emptySender);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Один batch-вызов под обе панели (sender + notifications),
    // чтобы первая отрисовка не упиралась в 2 параллельных холодных запроса.
    prefetchAdminSettings(["sender", "notifications"]);
    adminCallSWR("settings.get", { key: "sender" })
      .then((r) => {
        setSender({ ...emptySender, ...(r.data ?? {}) });
        setLoading(false);
      })
      .catch((e) => {
        toast.error(e.message);
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "sender", value: sender });
      toast.success("Настройки сохранены");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (loading) return <p className="text-[#888]">Загрузка…</p>;

  const field = (k: keyof typeof sender, label: string, placeholder = "") => (
    <div>
      <label className={ui.label}>{label}</label>
      <input
        value={sender[k] ?? ""}
        onChange={(e) => setSender({ ...sender, [k]: e.target.value })}
        className={ui.input}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="grid gap-6">
      <div className={ui.card}>
        <h2 className={`${ui.h2} mb-2`}>Отправитель</h2>
        <p className="text-[14px] text-[#888] mb-6">
          Эти данные используются для расчёта доставки в Яндекс.Доставке и ПЭК и для
          создания заявок у перевозчиков.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {field("city", "Город", "Москва")}
          {field("address", "Адрес склада / пункта отправки", "ул. Мастеровая, 12")}
          {field("contact_name", "Контактное лицо", "Иван Иванов")}
          {field("contact_phone", "Телефон", "+79991234567")}
          {field(
            "pek_city_id",
            "ID города-отправителя в ПЭК",
            "из ЛК ПЭК (например, 50001)",
          )}
          {field(
            "cdek_city_code",
            "Код города-отправителя в СДЭК",
            "необяз., иначе по названию города (напр. 44)",
          )}
        </div>
        <div className="flex gap-3 mt-6 pt-6 border-t border-[#3a3a3a]">
          <button
            onClick={save}
            disabled={saving}
            className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}
          >
            <Check size={18} /> {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>

      <NotificationsEditor />
      <PasswordPanel />
    </div>
  );
};

// ===================================================================
// CONTENT PANEL — редактирование контента и страниц сайта
// ===================================================================
const ContentPanel = () => {
  // Подтягиваем все ключи настроек одним запросом и кладём в SWR-кэш,
  // чтобы дочерние редакторы получили данные мгновенно вместо 8 параллельных
  // вызовов settings.get на холодном старте edge-функции.
  useEffect(() => {
    prefetchAdminSettings([
      "homepage",
      "pages",
      "nav_menu",
      "homepage_blocks",
      "services_docs",
      "contacts_page",
      "services_page",
      "delivery_page",
      "seo",
    ]);
  }, []);

  return (
    <div className="grid gap-6">
      <div className={ui.card}>
        <h2 className={`${ui.h2} mb-2`}>Контент сайта</h2>
        <p className="text-[14px] text-[#888]">
          Здесь редактируются тексты, изображения, видео и порядок блоков на всех страницах сайта.
          Изменения применяются сразу после сохранения.
        </p>
      </div>
      <NavMenuEditor />
      <BlocksOrderEditor />
      <HomepageEditor />
      <PagesHeadersEditor />
      <ContactsPageEditor />
      <ServicesPageEditor />
      <DeliveryPageEditor />
      <ServicesDocsEditor />
      <SeoEditor />
    </div>
  );
};

// ===================================================================
// SEO EDITOR — title / description / og:image per page
// ===================================================================
const SEO_PAGES: { key: SeoPageKey; label: string; path: string }[] = [
  { key: "home",     label: "Главная",              path: "/" },
  { key: "catalog",  label: "Каталог",              path: "/catalog" },
  { key: "gallery",  label: "Галерея",              path: "/gallery" },
  { key: "services", label: "Услуги",               path: "/services" },
  { key: "delivery", label: "Доставка и оплата",    path: "/delivery" },
  { key: "blog",     label: "Блог",                 path: "/blog" },
  { key: "contacts", label: "Контакты",             path: "/contacts" },
];

const SeoEditor = () => {
  const [val, setVal] = useState<SeoContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "seo" })
      .then((r) => {
        setVal(((r.data ?? {}) as SeoContent) || {});
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const update = (key: SeoPageKey, patch: Partial<SeoContent[SeoPageKey]>) => {
    setVal((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), ...patch } }));
  };

  const uploadOg = async (key: SeoPageKey, file: File) => {
    setUploading(key);
    try {
      const url = await adminUploadFile("site-images", file, { prefix: `seo/${key}-` });
      update(key, { ogImage: url });
      toast.success("Изображение загружено");
    } catch (e: any) { toast.error(e.message); }
    setUploading(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "seo", value: val });
      invalidateSeoContent();
      toast.success("SEO сохранён");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>SEO — мета-теги страниц</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Title и Description для поисковиков и соц-сетей. Пусто — используется значение по умолчанию из кода.
        Рекомендации: title ≤ 60 символов, description ≤ 160. og:image — 1200×630px.
      </p>
      <div className="grid gap-6">
        {SEO_PAGES.map((p) => {
          const v = val[p.key] ?? {};
          const titleLen = (v.title ?? "").length;
          const descLen = (v.description ?? "").length;
          return (
            <div key={p.key} className="grid gap-3 pb-6 border-b border-[#3a3a3a] last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-white">{p.label}</h3>
                <span className="text-[12px] text-[#666]">{p.path}</span>
              </div>
              <div>
                <label className={ui.label}>Title <span className={titleLen > 60 ? "text-[#ff6b6b]" : "text-[#666]"}>({titleLen}/60)</span></label>
                <input
                  value={v.title ?? ""}
                  onChange={(e) => update(p.key, { title: e.target.value })}
                  className={ui.input}
                  placeholder="Заголовок страницы для вкладки браузера и поиска"
                />
              </div>
              <div>
                <label className={ui.label}>Description <span className={descLen > 160 ? "text-[#ff6b6b]" : "text-[#666]"}>({descLen}/160)</span></label>
                <textarea
                  value={v.description ?? ""}
                  onChange={(e) => update(p.key, { description: e.target.value })}
                  className={`${ui.input} min-h-[70px]`}
                  placeholder="Короткое описание для сниппета в поиске"
                />
              </div>
              <div>
                <label className={ui.label}>OG-image (URL или загрузить)</label>
                <div className="flex gap-3 items-start flex-wrap">
                  <input
                    value={v.ogImage ?? ""}
                    onChange={(e) => update(p.key, { ogImage: e.target.value })}
                    className={`${ui.input} flex-1 min-w-[240px]`}
                    placeholder="https://…"
                  />
                  <label className={`${ui.btn} ${ui.btnSecondary} cursor-pointer`}>
                    <Upload size={16} />
                    {uploading === p.key ? "Загрузка…" : "Загрузить"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading === p.key}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadOg(p.key, f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {v.ogImage ? (
                    <img src={v.ogImage} alt="" className="w-24 h-24 object-cover rounded border border-[#3a3a3a]" />
                  ) : null}
                </div>
              </div>
              <label className="flex items-center gap-2 text-[14px] text-[#ccc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!v.noindex}
                  onChange={(e) => update(p.key, { noindex: e.target.checked })}
                />
                Скрыть страницу от поисковых систем (noindex)
              </label>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-6 pt-6 border-t border-[#3a3a3a]">
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить SEO"}
        </button>
      </div>
    </div>
  );
};

// ===================================================================
// PAGES HEADERS EDITOR — заголовок + подзаголовок для 5 страниц
// ===================================================================
const PAGES_META: { key: PageKey; label: string; defTitle: string; defSubtitle: string }[] = [
  { key: "catalog",  label: "Каталог",            defTitle: "Каталог", defSubtitle: "" },
  { key: "services", label: "Услуги",             defTitle: "Наши услуги", defSubtitle: "Полный цикл работ — от замера и проектирования до изготовления, доставки и монтажа" },
  { key: "gallery",  label: "Галерея",            defTitle: "Галерея", defSubtitle: "Наши изделия в интерьерах — вдохновляйтесь реальными примерами" },
  { key: "delivery", label: "Доставка и оплата",  defTitle: "Доставка и оплата", defSubtitle: "Мы работаем с надёжными транспортными компаниями и обеспечиваем безопасную упаковку каждого изделия ручной работы." },
  { key: "contacts", label: "Контакты",           defTitle: "Контакты", defSubtitle: "Свяжитесь с нами любым удобным способом — мы всегда на связи" },
];

const PagesHeadersEditor = () => {
  const [val, setVal] = useState<Record<string, { title: string; subtitle: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "pages" })
      .then((r) => {
        const data = (r.data ?? {}) as Record<string, { title?: string; subtitle?: string }>;
        const next: Record<string, { title: string; subtitle: string }> = {};
        for (const p of PAGES_META) {
          next[p.key] = {
            title: data[p.key]?.title ?? "",
            subtitle: data[p.key]?.subtitle ?? "",
          };
        }
        setVal(next);
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "pages", value: val });
      invalidatePagesContent();
      toast.success("Заголовки страниц сохранены");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Заголовки страниц</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Заголовок и подзаголовок в шапке каждой страницы. Пусто — используется значение по умолчанию.
      </p>
      <div className="grid gap-6">
        {PAGES_META.map((p) => (
          <div key={p.key} className="grid md:grid-cols-2 gap-4 pb-6 border-b border-[#3a3a3a] last:border-0 last:pb-0">
            <div>
              <label className={ui.label}>{p.label} — заголовок</label>
              <input
                value={val[p.key]?.title ?? ""}
                onChange={(e) => setVal({ ...val, [p.key]: { ...val[p.key], title: e.target.value } })}
                className={ui.input}
                placeholder={p.defTitle}
              />
            </div>
            <div>
              <label className={ui.label}>{p.label} — подзаголовок</label>
              <input
                value={val[p.key]?.subtitle ?? ""}
                onChange={(e) => setVal({ ...val, [p.key]: { ...val[p.key], subtitle: e.target.value } })}
                className={ui.input}
                placeholder={p.defSubtitle}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6 pt-6 border-t border-[#3a3a3a]">
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
};

// ===================================================================
// PASSWORD PANEL — смена и сброс пароля админа
// ===================================================================
const PasswordPanel = () => {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetPwd, setResetPwd] = useState("");
  const [resetting, setResetting] = useState(false);

  const change = async () => {
    if (next.length < 6) { toast.error("Новый пароль — минимум 6 символов"); return; }
    if (next !== next2) { toast.error("Пароли не совпадают"); return; }
    setSaving(true);
    try {
      await adminCall("auth.changePassword", { currentPassword: cur, newPassword: next });
      adminAuth.set(next);
      toast.success("Пароль изменён");
      setCur(""); setNext(""); setNext2("");
    } catch (e: any) {
      toast.error(e.message ?? "Не удалось сменить пароль");
    }
    setSaving(false);
  };

  const reset = async () => {
    if (!resetPwd) { toast.error("Введите мастер-пароль из настроек сервера"); return; }
    if (!confirm("Сбросить пароль к серверному (ADMIN_PASSWORD)? После этого войдите им.")) return;
    setResetting(true);
    try {
      // отдельный вызов с master-паролем (не текущим из sessionStorage)
      await adminCall("auth.resetWithEnv", undefined, resetPwd);
      adminAuth.clear();
      toast.success("Пароль сброшен. Войдите серверным паролем.");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      toast.error(e.message ?? "Не удалось сбросить");
    }
    setResetting(false);
  };

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Пароль администратора</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Смените пароль или сбросьте его к серверному (если забыли).
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className={ui.label}>Текущий пароль</label>
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={ui.input} />
        </div>
        <div>
          <label className={ui.label}>Новый пароль</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={ui.input} />
        </div>
        <div>
          <label className={ui.label}>Повторите новый</label>
          <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} className={ui.input} />
        </div>
      </div>
      <button onClick={change} disabled={saving || !cur || !next} className={`${ui.btn} ${ui.btnPrimary} ${saving || !cur || !next ? "opacity-50" : ""}`}>
        <Check size={18} /> {saving ? "Сохранение…" : "Сменить пароль"}
      </button>

      <div className="mt-8 pt-6 border-t border-[#3a3a3a]">
        <h3 className={`${ui.h3} mb-2`}>Забыли пароль? Сбросьте его</h3>
        <p className="text-[13px] text-[#888] mb-3">
          Введите мастер-пароль <code className="text-[#aaa]">ADMIN_PASSWORD</code> из настроек сервера —
          текущий пароль будет сброшен, после чего войдите им и при желании смените на новый.
        </p>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[220px]">
            <label className={ui.label}>Мастер-пароль (серверный)</label>
            <input type="password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} className={ui.input} />
          </div>
          <button onClick={reset} disabled={resetting || !resetPwd} className={`${ui.btn} ${ui.btnDanger} ${resetting || !resetPwd ? "opacity-50" : ""}`}>
            {resetting ? "Сброс…" : "Сбросить пароль"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// HOMEPAGE EDITOR — тексты и изображения главной страницы
// ===================================================================
const emptyHomepage = {
  hero: { marqueeText: "", marqueeEnabled: true, videoUrl: "", posterUrl: "" },
  popular: {
    bgImage: "",
    items: Array.from({ length: 10 }, () => ({
      title: "", tagline: "", description: "", cta: "", image: "", enabled: true,
    })),
  },
  categories: {
    title: "",
    bgImage: "",
    items: Array.from({ length: 12 }, () => ({ name: "", image: "", enabled: true })),
  },
  advantages: {
    title: "",
    bgImage: "",
    items: Array.from({ length: 8 }, () => ({ title: "", desc: "", enabled: true })),
  },
  contact: { title: "", subtitle: "", consent: "", submitLabel: "", bgImage: "" },
  footer: { tagline: "", phone: "", email: "", copyright: "" },
};

// Module-level — НЕ объявлять внутри родителя, иначе input теряет фокус на каждом keystroke
const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  multi,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multi?: boolean;
}) => (
  <div>
    <label className={ui.label}>{label}</label>
    {multi ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ui.textarea}
        placeholder={placeholder}
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ui.input}
        placeholder={placeholder}
      />
    )}
  </div>
);

const ImageField = ({
  label,
  value,
  onChange,
  accept = "image/*",
  upload,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  upload: (file: File) => Promise<string>;
}) => {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const derivedName = (() => {
    if (fileName) return fileName;
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      const last = url.pathname.split("/").filter(Boolean).pop() || "";
      return decodeURIComponent(last);
    } catch {
      return value.split("/").pop() || "";
    }
  })();
  return (
    <div>
      <label className={ui.label}>{label}</label>
      <div className="flex items-start gap-3">
        {value ? (
          accept.startsWith("video") ? (
            <video
              src={value}
              className="w-40 h-24 object-cover rounded bg-black"
              muted
              playsInline
              controls
              preload="metadata"
            />
          ) : (
            <img src={value} alt="" className="w-24 h-24 object-cover rounded bg-[#1a1a1a]" />
          )
        ) : (
          <div className="w-24 h-24 rounded bg-[#1a1a1a] flex items-center justify-center text-[#555]">
            <ImageIcon size={28} />
          </div>
        )}
        <div className="flex-1 grid gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={ui.input}
            placeholder="URL или загрузите файл ниже"
          />
          {derivedName && (
            <p className="text-[12px] text-[#888] truncate">Файл: {derivedName}</p>
          )}
          <label className={`${ui.btn} ${ui.btnSecondary} cursor-pointer self-start ${busy ? "opacity-50" : ""}`}>
            <Upload size={16} /> {busy ? "Загрузка…" : "Загрузить файл"}
            <input
              type="file"
              accept={accept}
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                setFileName(f.name);
                try {
                  const url = await upload(f);
                  onChange(url);
                  toast.success(`Файл загружен: ${f.name}`);
                } catch (err: any) {
                  toast.error(err?.message ?? "Не удалось загрузить");
                  setFileName("");
                }
                setBusy(false);
                e.target.value = "";
              }}
            />
          </label>
          {value && (
            <button
              onClick={() => { onChange(""); setFileName(""); }}
              className={`${ui.btn} ${ui.btnDanger} self-start`}
              type="button"
            >
              <X size={16} /> Удалить / сбросить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const HomepageEditor = () => {
  const [data, setData] = useState<any>(emptyHomepage);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "homepage" })
      .then((r) => {
        const v = r.data ?? {};
        // Глубокий мерж с пустым шаблоном, чтобы все поля присутствовали
        const popularItems = Array.isArray(v.popular?.items) && v.popular.items.length > 0
          ? v.popular.items.map((it: any, i: number) => ({ ...(emptyHomepage.popular.items[i] ?? {}), ...it }))
          : emptyHomepage.popular.items.map((d) => ({ ...d }));
        const categoryItems = Array.isArray(v.categories?.items) && v.categories.items.length > 0
          ? v.categories.items.map((it: any, i: number) => ({ ...(emptyHomepage.categories.items[i] ?? {}), ...it }))
          : emptyHomepage.categories.items.map((d) => ({ ...d }));
        setData({
          hero: { ...emptyHomepage.hero, ...(v.hero ?? {}) },
          popular: { bgImage: v.popular?.bgImage ?? "", items: popularItems },
          categories: {
            title: v.categories?.title ?? "",
            bgImage: v.categories?.bgImage ?? "",
            items: categoryItems,
          },
          advantages: {
            title: v.advantages?.title ?? "",
            bgImage: v.advantages?.bgImage ?? "",
            items: emptyHomepage.advantages.items.map((d, i) => ({
              ...d,
              ...(v.advantages?.items?.[i] ?? {}),
            })),
          },
          contact: { ...emptyHomepage.contact, ...(v.contact ?? {}) },
          footer: { ...emptyHomepage.footer, ...(v.footer ?? {}) },
        });
        setLoading(false);
      })
      .catch((e) => {
        toast.error(e.message);
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "homepage", value: data });
      invalidateHomepageContent();
      toast.success("Главная сохранена. Обновите вкладку сайта.");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const uploadImage = async (file: File): Promise<string> => {
    return await adminUploadFile("site-images", file, { prefix: "homepage/" });
  };

  if (loading) return <p className="text-[#888]">Загрузка главной…</p>;


  const setHero = (k: string, v: string) =>
    setData((d: any) => ({ ...d, hero: { ...d.hero, [k]: v } }));
  const setContact = (k: string, v: string) =>
    setData((d: any) => ({ ...d, contact: { ...d.contact, [k]: v } }));
  const setFooter = (k: string, v: string) =>
    setData((d: any) => ({ ...d, footer: { ...d.footer, [k]: v } }));
  const setPopularItem = (i: number, k: string, v: string) => {
    setData((d: any) => {
      const items = [...d.popular.items];
      items[i] = { ...items[i], [k]: v };
      return { ...d, popular: { ...d.popular, items } };
    });
  };
  const addPopularItem = () => {
    setData((d: any) => ({
      ...d,
      popular: { ...d.popular, items: [...d.popular.items, { title: "", tagline: "", description: "", cta: "Выбрать", image: "", enabled: true }] },
    }));
  };
  const removePopularItem = (i: number) => {
    setData((d: any) => ({
      ...d,
      popular: { ...d.popular, items: d.popular.items.filter((_: any, idx: number) => idx !== i) },
    }));
  };
  const setCategoriesItem = (i: number, k: string, v: string) => {
    setData((d: any) => {
      const items = [...d.categories.items];
      items[i] = { ...items[i], [k]: v };
      return { ...d, categories: { ...d.categories, items } };
    });
  };
  const addCategoryItem = () => {
    setData((d: any) => ({
      ...d,
      categories: { ...d.categories, items: [...d.categories.items, { name: "", image: "", enabled: true }] },
    }));
  };
  const removeCategoryItem = (i: number) => {
    setData((d: any) => ({
      ...d,
      categories: { ...d.categories, items: d.categories.items.filter((_: any, idx: number) => idx !== i) },
    }));
  };
  const setAdvantagesItem = (i: number, k: string, v: string) => {
    setData((d: any) => {
      const items = [...d.advantages.items];
      items[i] = { ...items[i], [k]: v };
      return { ...d, advantages: { ...d.advantages, items } };
    });
  };

  const defaultPopular = ["Панно", "Зеркала"];
  const defaultCategories = [
    "Мебель",
    "Кухонные принадлежности",
    "Системы хранения",
    "Предметы интерьера",
    "Заготовки для творчества",
    "Двери",
  ];
  const defaultAdvantages = [
    "Ручная работа",
    "Натуральные материалы",
    "Индивидуальный подход",
    "Быстрая доставка",
  ];
  const EnabledToggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-2 text-[13px] text-[#aaa] cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-amber-500 w-4 h-4"
      />
      Показывать на сайте
    </label>
  );

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Главная страница</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Изменяйте тексты и изображения главной. Пустое поле = значение по умолчанию.
      </p>

      <div className="grid gap-6">
        <details open className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Hero (главный экран)</summary>
          <div className="grid gap-4 mt-4">
            <div className="flex items-center justify-between gap-3">
              <label className={ui.label}>Бегущая строка</label>
              <EnabledToggle
                checked={data.hero.marqueeEnabled !== false}
                onChange={(v) => setHero("marqueeEnabled", v as any)}
              />
            </div>
            <TextField
              label=""
              value={data.hero.marqueeText}
              onChange={(v) => setHero("marqueeText", v)}
              placeholder="FAKTURA — изделия из натурального дерева…"
              multi
            />
            <ImageField
              label="Фоновое видео (mp4)"
              value={data.hero.videoUrl}
              onChange={(v) => setHero("videoUrl", v)}
              accept="video/mp4,video/*"
              upload={uploadImage}
            />
            <ImageField
              label="Постер (показывается, если видео не задано)"
              value={data.hero.posterUrl ?? ""}
              onChange={(v) => setHero("posterUrl", v)}
              upload={uploadImage}
            />
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Слайдер «Популярное»</summary>
          <div className="grid gap-6 mt-4">
            <ImageField
              label="Фоновое изображение секции (опционально, перекрывает градиент)"
              value={data.popular.bgImage ?? ""}
              onChange={(v) => setData((d: any) => ({ ...d, popular: { ...d.popular, bgImage: v } }))}
              upload={uploadImage}
            />
            {data.popular.items.map((it: any, i: number) => (
              <div key={i} className="border border-[#3a3a3a] rounded-lg p-4 grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[#888] text-sm">
                    Слайд {i + 1}{defaultPopular[i] ? <> (по умолчанию: <b>{defaultPopular[i]}</b>)</> : null}
                  </p>
                  <div className="flex items-center gap-3">
                    <EnabledToggle checked={it.enabled !== false} onChange={(v) => setPopularItem(i, "enabled", v as any)} />
                    <button type="button" onClick={() => removePopularItem(i)} className={`${ui.btn} ${ui.btnDanger}`}>
                      <X size={14} /> Удалить
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <TextField label="Заголовок" value={it.title} onChange={(v) => setPopularItem(i, "title", v)} />
                  <TextField label="Подзаголовок (tagline)" value={it.tagline} onChange={(v) => setPopularItem(i, "tagline", v)} />
                </div>
                <TextField label="Описание" value={it.description} onChange={(v) => setPopularItem(i, "description", v)} multi />
                <TextField label="Текст кнопки" value={it.cta} onChange={(v) => setPopularItem(i, "cta", v)} />
                <ImageField label="Изображение" value={it.image} onChange={(v) => setPopularItem(i, "image", v)} upload={uploadImage} />
              </div>
            ))}
            <button type="button" onClick={addPopularItem} className={`${ui.btn} ${ui.btnSecondary} w-fit`}>
              + Добавить слайд
            </button>
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Категории</summary>
          <div className="grid gap-4 mt-4">
            <TextField
              label="Заголовок секции"
              value={data.categories.title}
              onChange={(v) => setData({ ...data, categories: { ...data.categories, title: v } })}
              placeholder="Категории каталога"
            />
            <ImageField
              label="Фоновое изображение секции (опционально, перекрывает градиент)"
              value={data.categories.bgImage ?? ""}
              onChange={(v) => setData((d: any) => ({ ...d, categories: { ...d.categories, bgImage: v } }))}
              upload={uploadImage}
            />
            <div className="grid md:grid-cols-2 gap-4">
              {data.categories.items.map((it: any, i: number) => (
                <div key={i} className="border border-[#3a3a3a] rounded-lg p-4 grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[#888] text-sm">
                      Категория {i + 1}{defaultCategories[i] ? <> (по умолчанию: <b>{defaultCategories[i]}</b>)</> : null}
                    </p>
                    <div className="flex items-center gap-3">
                      <EnabledToggle checked={it.enabled !== false} onChange={(v) => setCategoriesItem(i, "enabled", v as any)} />
                      <button type="button" onClick={() => removeCategoryItem(i)} className={`${ui.btn} ${ui.btnDanger}`}>
                        <X size={14} /> Удалить
                      </button>
                    </div>
                  </div>
                  <TextField label="Название" value={it.name} onChange={(v) => setCategoriesItem(i, "name", v)} />
                  <ImageField label="Изображение" value={it.image} onChange={(v) => setCategoriesItem(i, "image", v)} upload={uploadImage} />
                </div>
              ))}
            </div>
            <button type="button" onClick={addCategoryItem} className={`${ui.btn} ${ui.btnSecondary} w-fit`}>
              + Добавить категорию
            </button>
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Преимущества</summary>
          <div className="grid gap-4 mt-4">
            <TextField
              label="Заголовок секции"
              value={data.advantages.title}
              onChange={(v) => setData({ ...data, advantages: { ...data.advantages, title: v } })}
              placeholder="Почему выбирают нас"
            />
            <ImageField
              label="Фоновое изображение секции (перекрывает стандартное)"
              value={data.advantages.bgImage ?? ""}
              onChange={(v) => setData((d: any) => ({ ...d, advantages: { ...d.advantages, bgImage: v } }))}
              upload={uploadImage}
            />
            <div className="grid md:grid-cols-2 gap-4">
              {data.advantages.items.map((it: any, i: number) => (
                <div key={i} className="border border-[#3a3a3a] rounded-lg p-4 grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[#888] text-sm">
                      Пункт {i + 1}{defaultAdvantages[i] ? <> (по умолчанию: <b>{defaultAdvantages[i]}</b>)</> : null}
                    </p>
                    <EnabledToggle checked={it.enabled !== false} onChange={(v) => setAdvantagesItem(i, "enabled", v as any)} />
                  </div>
                  <TextField label="Заголовок" value={it.title} onChange={(v) => setAdvantagesItem(i, "title", v)} />
                  <TextField label="Описание" value={it.desc} onChange={(v) => setAdvantagesItem(i, "desc", v)} multi />
                </div>
              ))}
            </div>
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Форма «Оставить заявку»</summary>
          <div className="grid gap-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <TextField label="Заголовок" value={data.contact.title} onChange={(v) => setContact("title", v)} placeholder="Оставить заявку" />
              <TextField label="Подзаголовок" value={data.contact.subtitle} onChange={(v) => setContact("subtitle", v)} multi />
              <TextField label="Текст кнопки" value={data.contact.submitLabel} onChange={(v) => setContact("submitLabel", v)} placeholder="Отправить заявку" />
              <TextField label="Строка о согласии" value={data.contact.consent} onChange={(v) => setContact("consent", v)} multi />
            </div>
            <ImageField
              label="Фоновое изображение секции (перекрывает стандартное)"
              value={data.contact.bgImage ?? ""}
              onChange={(v) => setContact("bgImage", v)}
              upload={uploadImage}
            />
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Подвал (футер)</summary>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <TextField label="Описание под логотипом" value={data.footer.tagline} onChange={(v) => setFooter("tagline", v)} />
            <TextField label="Телефон" value={data.footer.phone} onChange={(v) => setFooter("phone", v)} />
            <TextField label="Email" value={data.footer.email} onChange={(v) => setFooter("email", v)} />
            <TextField label="Копирайт" value={data.footer.copyright} onChange={(v) => setFooter("copyright", v)} />
          </div>
        </details>
      </div>

      <div className="flex gap-3 mt-6 pt-6 border-t border-[#3a3a3a]">
        <button
          onClick={save}
          disabled={saving}
          className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}
        >
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить главную"}
        </button>
      </div>
    </div>
  );
};

// ===================================================================
// NAV MENU EDITOR — пункты главного меню (header)
// ===================================================================
const defaultNav = [
  { name: "Главная", url: "/" },
  { name: "Каталог", url: "/catalog" },
  { name: "Услуги", url: "/services" },
  { name: "Галерея", url: "/gallery" },
  { name: "Блог", url: "/blog" },
  { name: "Доставка и оплата", url: "/delivery" },
  { name: "Контакты", url: "/contacts" },
];

// Список реально существующих страниц сайта (см. src/App.tsx).
// Пункт меню должен указывать на одну из этих ссылок, иначе будет 404.
const AVAILABLE_PAGES: { url: string; label: string }[] = [
  { url: "/", label: "Главная" },
  { url: "/catalog", label: "Каталог" },
  { url: "/services", label: "Услуги" },
  { url: "/gallery", label: "Галерея" },
  { url: "/blog", label: "Блог" },
  { url: "/delivery", label: "Доставка и оплата" },
  { url: "/contacts", label: "Контакты" },
  { url: "/cart", label: "Корзина" },
  { url: "/account", label: "Личный кабинет" },
];
const KNOWN_URLS = new Set(AVAILABLE_PAGES.map((p) => p.url));
const isKnownUrl = (u: string) => {
  const url = (u || "").trim();
  if (!url) return false;
  if (url.startsWith("http://") || url.startsWith("https://")) return true; // внешняя ссылка
  if (KNOWN_URLS.has(url)) return true;
  if (url.startsWith("/blog/") || url.startsWith("/product/")) return true;
  return false;
};

const NavMenuEditor = () => {
  const [items, setItems] = useState<{ name: string; url: string }[]>(defaultNav);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "nav_menu" })
      .then((r) => {
        const v = r.data;
        if (v?.items && Array.isArray(v.items) && v.items.length > 0) setItems(v.items);
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const update = (i: number, key: "name" | "url", v: string) =>
    setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, [key]: v } : it));
  const move = (i: number, dir: -1 | 1) => {
    setItems((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const remove = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const add = () => setItems((arr) => [...arr, { name: "", url: "/" }]);
  const reset = () => setItems(defaultNav);

  const save = async () => {
    const cleaned = items
      .map((i) => ({ name: i.name.trim(), url: i.url.trim() }))
      .filter((i) => i.name && i.url);
    if (cleaned.length === 0) { toast.error("Меню не может быть пустым"); return; }
    const unknown = cleaned.filter((i) => !isKnownUrl(i.url));
    if (unknown.length > 0) {
      toast.error(
        `Страницы не существуют: ${unknown.map((u) => u.url).join(", ")}. Выберите ссылку из списка или используйте полный URL (https://…).`
      );
      return;
    }
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "nav_menu", value: { items: cleaned } });
      invalidateNavMenu();
      toast.success("Меню сохранено. Обновите вкладку сайта.");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <div className={ui.card}>Загрузка меню…</div>;

  return (
    <div className={ui.card}>
      <h3 className={`${ui.h3} mb-4`}>Меню сайта (шапка)</h3>
      <p className="text-sm text-[#999] mb-4">
        Названия и ссылки пунктов главного меню. Выберите страницу из списка, чтобы избежать ошибки 404.
        Можно также указать внешнюю ссылку (https://…).
      </p>
      <div className="space-y-2 mb-4">
        {items.map((it, i) => {
          const known = isKnownUrl(it.url);
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex gap-2 items-center">
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="px-2 py-0.5 bg-[#3a3a3a] rounded text-xs hover:bg-[#4a4a4a]">↑</button>
                  <button type="button" onClick={() => move(i, 1)} className="px-2 py-0.5 bg-[#3a3a3a] rounded text-xs hover:bg-[#4a4a4a]">↓</button>
                </div>
                <input
                  value={it.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="Название"
                  className={`${ui.input} flex-1`}
                />
                <select
                  value={KNOWN_URLS.has(it.url) ? it.url : "__custom"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v !== "__custom") update(i, "url", v);
                  }}
                  className={`${ui.input}`}
                  style={{ minWidth: 180 }}
                >
                  {AVAILABLE_PAGES.map((p) => (
                    <option key={p.url} value={p.url}>{p.label} ({p.url})</option>
                  ))}
                  <option value="__custom">— другая ссылка —</option>
                </select>
                <input
                  value={it.url}
                  onChange={(e) => update(i, "url", e.target.value)}
                  placeholder="/url или https://…"
                  className={`${ui.input} flex-1`}
                />
                <button type="button" onClick={() => remove(i)} className={`${ui.btn} ${ui.btnDanger}`}>×</button>
              </div>
              {it.url && !known && (
                <div className="text-xs text-red-400 ml-12">
                  ⚠ Страница «{it.url}» не существует — посетители увидят 404. Выберите страницу из списка.
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={add} className={`${ui.btn} ${ui.btnSecondary}`}>+ Добавить пункт</button>
        <button type="button" onClick={reset} className={`${ui.btn} ${ui.btnSecondary}`}>Сбросить к стандарту</button>
        <button type="button" onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить меню"}
        </button>
      </div>
    </div>
  );
};

// ===================================================================
// BLOCKS ORDER EDITOR — порядок секций главной
// ===================================================================
const blockLabels: Record<string, string> = {
  hero: "Главный экран (видео + бегущая строка)",
  popular: "Популярные изделия",
  categories: "Категории каталога",
  advantages: "Преимущества",
  contact: "Форма контакта",
};
const defaultBlocksOrder = ["hero", "popular", "categories", "advantages", "contact"];

const BlocksOrderEditor = () => {
  const [order, setOrder] = useState<string[]>(defaultBlocksOrder);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "homepage_blocks" })
      .then((r) => {
        const v = r.data;
        if (v?.order && Array.isArray(v.order) && v.order.length > 0) setOrder(v.order);
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const move = (i: number, dir: -1 | 1) => {
    setOrder((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const reset = () => setOrder(defaultBlocksOrder);
  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "homepage_blocks", value: { order } });
      invalidateHomepageBlocks();
      toast.success("Порядок блоков сохранён. Обновите главную страницу.");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <div className={ui.card}>Загрузка порядка блоков…</div>;

  return (
    <div className={ui.card}>
      <h3 className={`${ui.h3} mb-4`}>Порядок блоков на главной</h3>
      <p className="text-sm text-[#999] mb-4">
        Перемещайте секции главной страницы вверх/вниз — порядок применится после сохранения.
      </p>
      <div className="space-y-2 mb-4">
        {order.map((id, i) => (
          <div key={id} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3">
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} className="px-2 py-0.5 bg-[#3a3a3a] rounded text-xs hover:bg-[#4a4a4a]">↑</button>
              <button onClick={() => move(i, 1)} className="px-2 py-0.5 bg-[#3a3a3a] rounded text-xs hover:bg-[#4a4a4a]">↓</button>
            </div>
            <div className="text-[#888] w-8 text-center">{i + 1}</div>
            <div className="flex-1">{blockLabels[id] ?? id}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={reset} className={`${ui.btn} ${ui.btnSecondary}`}>Сбросить к стандарту</button>
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить порядок"}
        </button>
      </div>
    </div>
  );
};

// ===================================================================
// SERVICES DOCS EDITOR — документы для скачивания на странице «Услуги»
// ===================================================================
const ServicesDocsEditor = () => {
  const [docs, setDocs] = useState<Array<{ name: string; desc: string; url: string; format: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "services_docs" })
      .then((r) => {
        const items = Array.isArray(r.data?.items) ? r.data.items : [];
        setDocs(items);
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "services_docs", value: { items: docs } });
      toast.success("Документы сохранены");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const addDoc = () => setDocs([...docs, { name: "", desc: "", url: "", format: "" }]);
  const removeDoc = (i: number) => setDocs(docs.filter((_, idx) => idx !== i));
  const updateDoc = (i: number, k: string, v: string) =>
    setDocs(docs.map((d, idx) => (idx === i ? { ...d, [k]: v } : d)));

  const uploadDoc = async (i: number, file: File) => {
    try {
      const url = await adminUploadFile("site-documents", file, { prefix: "services/" });
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const ext = (file.name.split(".").pop() || "FILE").toUpperCase();
      setDocs((prev) =>
        prev.map((d, idx) =>
          idx === i ? { ...d, url, format: `${ext}, ${sizeMb} МБ`, name: d.name || file.name } : d,
        ),
      );
      toast.success(`Загружено: ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось загрузить");
    }
  };

  if (loading) return <p className="text-[#888]">Загрузка документов…</p>;

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Документы для скачивания (Услуги)</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Прайс-листы, каталоги, брифы и т.п. Появятся на странице /services в блоке «Скачать документы».
      </p>

      <div className="grid gap-4 mb-4">
        {docs.map((d, i) => (
          <div key={i} className="border border-[#3a3a3a] rounded-lg p-4 grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[#888] text-sm">Документ {i + 1}</p>
              <button onClick={() => removeDoc(i)} className={`${ui.btn} ${ui.btnDanger}`} type="button">
                <X size={16} /> Удалить
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <TextField label="Название" value={d.name} onChange={(v) => updateDoc(i, "name", v)} placeholder="Прайс-лист 2026" />
              <TextField label="Формат / размер" value={d.format} onChange={(v) => updateDoc(i, "format", v)} placeholder="PDF, 1.2 МБ" />
            </div>
            <TextField label="Описание" value={d.desc} onChange={(v) => updateDoc(i, "desc", v)} placeholder="Актуальные цены на все виды работ" />
            <div>
              <label className={ui.label}>Файл</label>
              <div className="flex items-start gap-3">
                <input
                  value={d.url}
                  onChange={(e) => updateDoc(i, "url", e.target.value)}
                  className={ui.input}
                  placeholder="URL файла"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  id={`doc-file-${i}`}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.png"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await uploadDoc(i, f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById(`doc-file-${i}`)?.click()}
                  className={`${ui.btn} ${ui.btnSecondary}`}
                >
                  <Upload size={16} /> Загрузить файл
                </button>
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className={`${ui.btn} ${ui.btnSecondary}`}>
                    Открыть
                  </a>
                )}
              </div>
              <p className="text-[11px] text-[#666] mt-2">
                Файл сохраняется в защищённом хранилище (bucket «site-documents»). После загрузки URL подставится автоматически.
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={addDoc} className={`${ui.btn} ${ui.btnSecondary}`} type="button">
          + Добавить документ
        </button>
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить документы"}
        </button>
      </div>
    </div>
  );
};



// ===================================================================
// NOTIFICATIONS EDITOR — email для уведомлений о заявках/заказах
// ===================================================================
const NotificationsEditor = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "notifications" })
      .then((r) => { setEmail(r.data?.email ?? ""); setLoading(false); })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "notifications", value: { email } });
      toast.success("Email для уведомлений сохранён");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <p className="text-[#888]">Загрузка…</p>;

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Email для уведомлений</h2>
      <p className="text-[14px] text-[#888] mb-4">
        Адрес, на который будут приходить уведомления о новых заявках и заказах.
        Заявки и заказы в любом случае сохраняются в админ-панели на вкладках «Заявки» и «Заказы».
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={ui.input}
        placeholder="info@faktura.example"
      />
      <div className="flex gap-2 mt-4">
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
};

export default AdminPage;

// ===================================================================
// CONTACTS PAGE EDITOR — карточки контактов, часы работы, вакансии
// ===================================================================
const emptyContacts = {
  contacts: [
    { type: "phone", title: "Телефон", value: "+7 (900) 123-45-67", href: "tel:+79001234567", note: "Пн–Пт: 10:00 — 19:00" },
    { type: "email", title: "Email", value: "info@derevo-master.ru", href: "mailto:info@derevo-master.ru", note: "Ответим в течение 2 часов" },
    { type: "messenger", title: "WhatsApp / Telegram", value: "+7 (900) 123-45-67", href: "https://wa.me/79001234567", note: "Быстрые ответы и фото" },
    { type: "address", title: "Адрес мастерской", value: "г. Москва, ул. Примерная, д. 1", href: "https://yandex.ru/maps", note: "Бесплатная парковка" },
  ],
  hours: [
    { day: "Понедельник — Пятница", time: "10:00 — 19:00" },
    { day: "Суббота", time: "11:00 — 16:00" },
    { day: "Воскресенье", time: "Выходной" },
  ],
  hoursNote: "Для визита в мастерскую рекомендуем предварительно позвонить или написать — мы подготовим ваш заказ.",
  careers: {
    title: "Работа в компании",
    intro: "Мы расширяем команду и ищем увлечённых людей, готовых создавать уникальные изделия из дерева.",
    ctaTitle: "Хотите присоединиться?",
    ctaText: "Отправьте резюме на",
    email: "hr@derevo-master.ru",
    phone: "+7 (900) 123-45-67",
  },
};

const ContactsPageEditor = () => {
  const [data, setData] = useState<any>(emptyContacts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "contacts_page" })
      .then((r) => {
        const v = r.data ?? {};
        setData({
          contacts: Array.isArray(v.contacts) && v.contacts.length > 0 ? v.contacts : emptyContacts.contacts,
          hours: Array.isArray(v.hours) && v.hours.length > 0 ? v.hours : emptyContacts.hours,
          hoursNote: v.hoursNote ?? emptyContacts.hoursNote,
          careers: { ...emptyContacts.careers, ...(v.careers ?? {}) },
        });
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "contacts_page", value: data });
      invalidateContactsContent();
      toast.success("Страница «Контакты» сохранена");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return null;

  const setContact = (i: number, k: string, v: string) => {
    const arr = [...data.contacts];
    arr[i] = { ...arr[i], [k]: v };
    setData({ ...data, contacts: arr });
  };
  const addContact = () => setData({ ...data, contacts: [...data.contacts, { type: "phone", title: "", value: "", href: "", note: "" }] });
  const removeContact = (i: number) => setData({ ...data, contacts: data.contacts.filter((_: any, idx: number) => idx !== i) });

  const setHour = (i: number, k: string, v: string) => {
    const arr = [...data.hours];
    arr[i] = { ...arr[i], [k]: v };
    setData({ ...data, hours: arr });
  };
  const addHour = () => setData({ ...data, hours: [...data.hours, { day: "", time: "" }] });
  const removeHour = (i: number) => setData({ ...data, hours: data.hours.filter((_: any, idx: number) => idx !== i) });

  const setCareers = (k: string, v: string) => setData({ ...data, careers: { ...data.careers, [k]: v } });

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Страница «Контакты»</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Карточки контактов, часы работы и блок вакансий. Заголовок страницы — в блоке «Заголовки страниц» выше.
      </p>

      <div className="grid gap-6">
        <details open className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Карточки контактов</summary>
          <div className="grid gap-4 mt-4">
            {data.contacts.map((c: any, i: number) => (
              <div key={i} className="border border-[#3a3a3a] rounded-lg p-4 grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[#888] text-sm">Карточка {i + 1}</p>
                  <button type="button" onClick={() => removeContact(i)} className={`${ui.btn} ${ui.btnDanger}`}>
                    <X size={14} /> Удалить
                  </button>
                </div>
                <div>
                  <label className={ui.label}>Иконка</label>
                  <select value={c.type ?? "phone"} onChange={(e) => setContact(i, "type", e.target.value)} className={ui.input}>
                    <option value="phone">Телефон</option>
                    <option value="email">Email</option>
                    <option value="messenger">Мессенджер</option>
                    <option value="address">Адрес</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <TextField label="Заголовок" value={c.title ?? ""} onChange={(v) => setContact(i, "title", v)} />
                  <TextField label="Значение" value={c.value ?? ""} onChange={(v) => setContact(i, "value", v)} />
                  <TextField label="Ссылка (tel:, mailto:, https://)" value={c.href ?? ""} onChange={(v) => setContact(i, "href", v)} />
                  <TextField label="Подпись" value={c.note ?? ""} onChange={(v) => setContact(i, "note", v)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addContact} className={`${ui.btn} ${ui.btnSecondary} w-fit`}>
              + Добавить карточку
            </button>
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Часы работы</summary>
          <div className="grid gap-3 mt-4">
            {data.hours.map((h: any, i: number) => (
              <div key={i} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <TextField label="День" value={h.day ?? ""} onChange={(v) => setHour(i, "day", v)} />
                <TextField label="Время" value={h.time ?? ""} onChange={(v) => setHour(i, "time", v)} />
                <button type="button" onClick={() => removeHour(i)} className={`${ui.btn} ${ui.btnDanger}`}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addHour} className={`${ui.btn} ${ui.btnSecondary} w-fit`}>
              + Добавить строку
            </button>
            <TextField label="Примечание под расписанием" value={data.hoursNote} onChange={(v) => setData({ ...data, hoursNote: v })} multi />
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Блок вакансий</summary>
          <div className="grid gap-3 mt-4">
            <TextField label="Заголовок" value={data.careers.title} onChange={(v) => setCareers("title", v)} />
            <TextField label="Вступительный текст" value={data.careers.intro} onChange={(v) => setCareers("intro", v)} multi />
            <TextField label="Заголовок CTA" value={data.careers.ctaTitle} onChange={(v) => setCareers("ctaTitle", v)} />
            <TextField label="Текст CTA (до email)" value={data.careers.ctaText} onChange={(v) => setCareers("ctaText", v)} />
            <div className="grid md:grid-cols-2 gap-3">
              <TextField label="Email" value={data.careers.email} onChange={(v) => setCareers("email", v)} />
              <TextField label="Телефон" value={data.careers.phone} onChange={(v) => setCareers("phone", v)} />
            </div>
          </div>
        </details>
      </div>

      <div className="flex gap-2 mt-6 pt-6 border-t border-[#3a3a3a]">
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
};

// ===================================================================
// SERVICES PAGE EDITOR — карточки услуг и CTA
// ===================================================================
const emptyServices = {
  items: [
    { title: "Изготовление мебели на заказ", description: "Создаём мебель по индивидуальным размерам и эскизам из массива дерева.", features: ["Любые размеры", "Выбор породы дерева", "3D-визуализация", "Гарантия 5 лет"], timing: "от 14 дней", price: "от 15 000 ₽", enabled: true },
    { title: "Замер и проектирование", description: "Бесплатный выезд замерщика. Чертежи и 3D-модель будущего изделия.", features: ["Бесплатный замер", "3D-моделирование", "Чертежи в подарок", "Консультация дизайнера"], timing: "1–3 дня", price: "Бесплатно", enabled: true },
    { title: "Реставрация и покраска", description: "Восстанавливаем старую мебель: шлифовка, ремонт, покрытие маслом, воском или лаком.", features: ["Шлифовка", "Замена фурнитуры", "Покрытие на выбор", "Антикварная мебель"], timing: "от 5 дней", price: "от 5 000 ₽", enabled: true },
    { title: "Монтаж и сборка", description: "Профессиональная сборка и установка мебели.", features: ["Доставка + сборка", "Крепёж в комплекте", "Уборка после монтажа", "Гарантия на работы"], timing: "1 день", price: "от 3 000 ₽", enabled: true },
  ],
  downloadsTitle: "Скачать документы",
  cta: {
    title: "Нужна консультация?",
    text: "Позвоните или оставьте заявку — мы поможем подобрать услугу и рассчитаем стоимость вашего проекта.",
    primary: "Оставить заявку",
    secondary: "Позвонить",
    phone: "+7 (900) 123-45-67",
  },
};

const ServicesPageEditor = () => {
  const [data, setData] = useState<any>(emptyServices);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "services_page" })
      .then((r) => {
        const v = r.data ?? {};
        setData({
          items: Array.isArray(v.items) && v.items.length > 0
            ? emptyServices.items.map((d, i) => ({ ...d, ...(v.items[i] ?? {}) }))
            : emptyServices.items,
          downloadsTitle: v.downloadsTitle ?? emptyServices.downloadsTitle,
          cta: { ...emptyServices.cta, ...(v.cta ?? {}) },
        });
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "services_page", value: data });
      invalidateServicesContent();
      toast.success("Страница «Услуги» сохранена");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return null;

  const setItem = (i: number, k: string, v: any) => {
    const arr = [...data.items];
    arr[i] = { ...arr[i], [k]: v };
    setData({ ...data, items: arr });
  };
  const setFeature = (i: number, fi: number, v: string) => {
    const arr = [...data.items];
    const feats = [...(arr[i].features ?? [])];
    feats[fi] = v;
    arr[i] = { ...arr[i], features: feats };
    setData({ ...data, items: arr });
  };
  const addFeature = (i: number) => {
    const arr = [...data.items];
    arr[i] = { ...arr[i], features: [...(arr[i].features ?? []), ""] };
    setData({ ...data, items: arr });
  };
  const removeFeature = (i: number, fi: number) => {
    const arr = [...data.items];
    arr[i] = { ...arr[i], features: (arr[i].features ?? []).filter((_: any, idx: number) => idx !== fi) };
    setData({ ...data, items: arr });
  };
  const setCta = (k: string, v: string) => setData({ ...data, cta: { ...data.cta, [k]: v } });

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Страница «Услуги»</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Карточки услуг, заголовок блока документов и CTA-блок. Сами файлы документов — в блоке «Документы услуг».
      </p>

      <div className="grid gap-6">
        {data.items.map((it: any, i: number) => (
          <details key={i} className="border border-[#3a3a3a] rounded-lg p-4">
            <summary className={`${ui.h3} cursor-pointer`}>
              Услуга {i + 1}{it.title ? <>: <span className="text-amber-400">{it.title}</span></> : null}
            </summary>
            <div className="grid gap-3 mt-4">
              <label className="flex items-center gap-2 text-[13px] text-[#aaa] cursor-pointer select-none">
                <input type="checkbox" checked={it.enabled !== false} onChange={(e) => setItem(i, "enabled", e.target.checked)} className="accent-amber-500 w-4 h-4" />
                Показывать на сайте
              </label>
              <TextField label="Заголовок" value={it.title ?? ""} onChange={(v) => setItem(i, "title", v)} />
              <TextField label="Описание" value={it.description ?? ""} onChange={(v) => setItem(i, "description", v)} multi />
              <div className="grid md:grid-cols-2 gap-3">
                <TextField label="Срок" value={it.timing ?? ""} onChange={(v) => setItem(i, "timing", v)} />
                <TextField label="Цена" value={it.price ?? ""} onChange={(v) => setItem(i, "price", v)} />
              </div>
              <div>
                <label className={ui.label}>Преимущества (буллеты)</label>
                <div className="grid gap-2">
                  {(it.features ?? []).map((f: string, fi: number) => (
                    <div key={fi} className="flex gap-2">
                      <input value={f} onChange={(e) => setFeature(i, fi, e.target.value)} className={`${ui.input} flex-1`} />
                      <button type="button" onClick={() => removeFeature(i, fi)} className={`${ui.btn} ${ui.btnDanger}`}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addFeature(i)} className={`${ui.btn} ${ui.btnSecondary} w-fit`}>
                    + Добавить
                  </button>
                </div>
              </div>
            </div>
          </details>
        ))}

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>Блок «Скачать документы»</summary>
          <div className="grid gap-3 mt-4">
            <TextField label="Заголовок секции" value={data.downloadsTitle} onChange={(v) => setData({ ...data, downloadsTitle: v })} />
          </div>
        </details>

        <details className="border border-[#3a3a3a] rounded-lg p-4">
          <summary className={`${ui.h3} cursor-pointer`}>CTA-блок (низ страницы)</summary>
          <div className="grid gap-3 mt-4">
            <TextField label="Заголовок" value={data.cta.title} onChange={(v) => setCta("title", v)} />
            <TextField label="Текст" value={data.cta.text} onChange={(v) => setCta("text", v)} multi />
            <div className="grid md:grid-cols-2 gap-3">
              <TextField label="Основная кнопка" value={data.cta.primary} onChange={(v) => setCta("primary", v)} />
              <TextField label="Кнопка-звонок" value={data.cta.secondary} onChange={(v) => setCta("secondary", v)} />
            </div>
            <TextField label="Телефон для звонка" value={data.cta.phone} onChange={(v) => setCta("phone", v)} />
          </div>
        </details>
      </div>

      <div className="flex gap-2 mt-6 pt-6 border-t border-[#3a3a3a]">
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
};


// ===================================================================
// MEDIA — библиотека файлов из Storage
// ===================================================================
const MEDIA_BUCKETS: { id: string; label: string; kind: "image" | "file" | "model" }[] = [
  { id: "product-images", label: "Товары", kind: "image" },
  { id: "blog-images", label: "Блог", kind: "image" },
  { id: "site-images", label: "Сайт", kind: "image" },
  { id: "product-models", label: "3D-модели", kind: "model" },
  { id: "site-documents", label: "Документы", kind: "file" },
];

type MediaFile = {
  name: string;
  path: string;
  size: number | null;
  mimeType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publicUrl: string;
};

const formatSize = (b: number | null) => {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const isImageFile = (f: MediaFile) => {
  if (f.mimeType?.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f.name);
};

const MediaPanel = () => {
  const [bucket, setBucket] = useState<string>(MEDIA_BUCKETS[0].id);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const load = async (b: string = bucket) => {
    setLoading(true);
    try {
      const r = await adminCall<{ data: MediaFile[] }>("storage.list", { bucket: b, limit: 1000 });
      setFiles(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load(bucket);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket]);

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    setUploading(true);
    let ok = 0;
    let fail = 0;
    for (const f of list) {
      try {
        await adminUploadFile(bucket, f);
        ok++;
      } catch (err: any) {
        fail++;
        toast.error(`${f.name}: ${err?.message ?? err}`);
      }
    }
    setUploading(false);
    e.target.value = "";
    if (ok) toast.success(`Загружено файлов: ${ok}${fail ? `, ошибок: ${fail}` : ""}`);
    load(bucket);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const remove = async (f: MediaFile) => {
    if (!confirm(`Удалить файл «${f.name}»? Действие необратимо.`)) return;
    try {
      await adminCall("storage.delete", { bucket, path: f.path });
      toast.success("Файл удалён");
      setFiles((prev) => prev.filter((x) => x.path !== f.path));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : files;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className={ui.h2}>Медиа-библиотека</h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Поиск по имени…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${ui.input} max-w-[240px]`}
          />
          <label className={`${ui.btn} ${ui.btnPrimary} cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload size={18} /> {uploading ? "Загрузка…" : "Загрузить"}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={onFilePicked}
              accept={MEDIA_BUCKETS.find((b) => b.id === bucket)?.kind === "image" ? "image/*" : undefined}
            />
          </label>
          <button onClick={() => load()} className={`${ui.btn} ${ui.btnSecondary}`}>Обновить</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {MEDIA_BUCKETS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBucket(b.id)}
            className={`${ui.btn} ${bucket === b.id ? ui.tabActive : ui.tabIdle}`}
          >
            {b.label}
            <span className="ml-2 text-[13px] opacity-70">
              {bucket === b.id ? files.length : ""}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : filtered.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>
          {search ? "Ничего не найдено." : "В этом бакете пока нет файлов."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((f) => (
            <div key={f.path} className={`${ui.card} !p-3 flex flex-col gap-2`}>
              <div className="aspect-square rounded-lg overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                {isImageFile(f) ? (
                  <img
                    src={f.publicUrl}
                    alt={f.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <FileText size={40} className="text-[#666]" />
                )}
              </div>
              <div className="text-[13px] truncate" title={f.name}>{f.name}</div>
              <div className="text-[12px] text-[#888] flex justify-between">
                <span>{formatSize(f.size)}</span>
                <span>{f.createdAt ? new Date(f.createdAt).toLocaleDateString("ru-RU") : ""}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => copyUrl(f.publicUrl)}
                  className={`${ui.btn} ${ui.btnSecondary} !px-2 !py-1.5 !text-[12px] flex-1`}
                  title="Копировать URL"
                >
                  <Copy size={14} /> URL
                </button>
                <a
                  href={f.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${ui.btn} ${ui.btnSecondary} !px-2 !py-1.5 !text-[12px]`}
                  title="Открыть в новой вкладке"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => remove(f)}
                  className={`${ui.btn} ${ui.btnDanger} !px-2 !py-1.5 !text-[12px]`}
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// GALLERY — управление карточками страницы /gallery
// ===================================================================
type GalleryRow = {
  id: string;
  image_url: string;
  title: string;
  span: "normal" | "tall" | "wide";
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

const emptyGallery = { image_url: "", title: "", span: "normal" as const, sort_order: 0, is_active: true };

const GalleryPanel = () => {
  const cached = getCachedAdminCall<{ data: GalleryRow[] }>("gallery.list");
  const [items, setItems] = useState<GalleryRow[]>(cached?.data ?? []);
  const [loading, setLoading] = useState(!cached);
  const [editing, setEditing] = useState<Partial<GalleryRow> | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!getCachedAdminCall("gallery.list")) setLoading(true);
    try {
      const r = await adminCallSWR<{ data: GalleryRow[] }>("gallery.list", undefined, (fresh) => {
        setItems(fresh.data ?? []);
      });
      setItems(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.image_url) {
      toast.error("Загрузите изображение");
      return;
    }
    try {
      if (editing.id) {
        await adminCall("gallery.update", editing);
      } else {
        await adminCall("gallery.create", {
          ...emptyGallery,
          ...editing,
          sort_order: editing.sort_order ?? items.length,
        });
      }
      invalidateAdminCache("gallery.");
      toast.success("Сохранено");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить карточку?")) return;
    try {
      await adminCall("gallery.delete", { id });
      invalidateAdminCache("gallery.");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx];
    const b = items[j];
    const next = [...items];
    next[idx] = b;
    next[j] = a;
    setItems(next);
    try {
      await adminCall("gallery.reorder", {
        items: next.map((it, i) => ({ id: it.id, sort_order: i })),
      });
      invalidateAdminCache("gallery.");
    } catch (e: any) {
      toast.error(e.message);
      load();
    }
  };

  const toggleActive = async (it: GalleryRow) => {
    try {
      await adminCall("gallery.update", { id: it.id, is_active: !it.is_active });
      invalidateAdminCache("gallery.");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const url = await adminUploadFile("site-images", f, { prefix: "gallery/" });
      setEditing((prev) => ({ ...(prev ?? emptyGallery), image_url: url }));
    } catch (err: any) {
      toast.error(err?.message ?? "Ошибка загрузки");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className={ui.h2}>Галерея ({items.length})</h2>
        <button
          onClick={() => setEditing({ ...emptyGallery, sort_order: items.length })}
          className={`${ui.btn} ${ui.btnPrimary}`}
        >
          <Plus size={18} /> Новая карточка
        </button>
      </div>

      {editing && (
        <div className={`${ui.card} mb-6`}>
          <h3 className={`${ui.h3} mb-4`}>{editing.id ? "Редактирование" : "Новая карточка"}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={ui.label}>Изображение</label>
              {editing.image_url ? (
                <div className="mb-3 rounded-lg overflow-hidden bg-[#1a1a1a] aspect-[4/3]">
                  <img src={editing.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="mb-3 rounded-lg bg-[#1a1a1a] aspect-[4/3] flex items-center justify-center text-[#666] text-sm">
                  нет изображения
                </div>
              )}
              <label className={`${ui.btn} ${ui.btnSecondary} cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <Upload size={16} /> {uploading ? "Загрузка…" : "Загрузить"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              <input
                type="text"
                value={editing.image_url ?? ""}
                onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                placeholder="или URL напрямую"
                className={`${ui.input} mt-3`}
              />
            </div>

            <div className="grid gap-4">
              <div>
                <label className={ui.label}>Подпись</label>
                <input
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className={ui.input}
                  placeholder="Гостиная с деревянными панелями"
                />
              </div>
              <div>
                <label className={ui.label}>Размер плитки</label>
                <select
                  value={editing.span ?? "normal"}
                  onChange={(e) => setEditing({ ...editing, span: e.target.value as any })}
                  className={ui.input}
                >
                  <option value="normal">Обычная</option>
                  <option value="tall">Высокая</option>
                  <option value="wide">Широкая</option>
                </select>
              </div>
              <div>
                <label className={ui.label}>Порядок сортировки</label>
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className={ui.input}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-[15px]">Показывать на сайте</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-[#3a3a3a]">
            <button onClick={save} className={`${ui.btn} ${ui.btnPrimary}`}>
              <Check size={18} /> Сохранить
            </button>
            <button onClick={() => setEditing(null)} className={`${ui.btn} ${ui.btnSecondary}`}>
              <X size={18} /> Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>
          Карточек пока нет. На публичной странице пока показывается дефолтный набор.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, idx) => (
            <div key={it.id} className={`${ui.card} !p-3 flex flex-col gap-2 ${!it.is_active ? "opacity-60" : ""}`}>
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#1a1a1a]">
                <img src={it.image_url} alt={it.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="text-[15px] truncate" title={it.title}>{it.title || <span className="text-[#666]">без подписи</span>}</div>
              <div className="text-[12px] text-[#888] flex justify-between">
                <span>#{it.sort_order} · {it.span}</span>
                <span>{it.is_active ? "видно" : "скрыто"}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => move(idx, -1)} disabled={idx === 0}
                  className={`${ui.btn} ${ui.btnSecondary} !px-2 !py-1.5 !text-[12px] ${idx === 0 ? "opacity-40" : ""}`}>↑</button>
                <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
                  className={`${ui.btn} ${ui.btnSecondary} !px-2 !py-1.5 !text-[12px] ${idx === items.length - 1 ? "opacity-40" : ""}`}>↓</button>
                <button onClick={() => toggleActive(it)} className={`${ui.btn} ${ui.btnSecondary} !px-2 !py-1.5 !text-[12px] flex-1`}>
                  {it.is_active ? "Скрыть" : "Показать"}
                </button>
                <button onClick={() => setEditing(it)} className={`${ui.btn} ${ui.btnSecondary} !px-2 !py-1.5 !text-[12px]`}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(it.id)} className={`${ui.btn} ${ui.btnDanger} !px-2 !py-1.5 !text-[12px]`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// DELIVERY PAGE EDITOR — партнёры, самовывоз, упаковка, оплата, FAQ
// ===================================================================
const emptyDelivery = {
  companies: [] as any[],
  pickup: {
    title: "Самовывоз",
    subtitle: "Бесплатно из нашей мастерской",
    description: "",
    features: [] as string[],
    address: "",
    hours: "",
    phone: "",
  },
  packaging: {
    title: "Надёжная упаковка",
    items: [] as { title: string; desc: string }[],
  },
  paymentMethods: [] as any[],
  faq: [] as { q: string; a: string }[],
};

const paymentIconOptions = [
  { value: "card", label: "Банковская карта" },
  { value: "shield", label: "Щит (защита)" },
  { value: "receipt", label: "Чек" },
  { value: "tag", label: "Ценник / акция" },
];

const DeliveryPageEditor = () => {
  const [data, setData] = useState<typeof emptyDelivery>(emptyDelivery);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    adminCallSWR("settings.get", { key: "delivery_page" })
      .then((r) => {
        const v = (r.data ?? {}) as any;
        setData({
          companies: Array.isArray(v.companies) ? v.companies : [],
          pickup: { ...emptyDelivery.pickup, ...(v.pickup ?? {}), features: Array.isArray(v.pickup?.features) ? v.pickup.features : [] },
          packaging: { ...emptyDelivery.packaging, ...(v.packaging ?? {}), items: Array.isArray(v.packaging?.items) ? v.packaging.items : [] },
          paymentMethods: Array.isArray(v.paymentMethods) ? v.paymentMethods : [],
          faq: Array.isArray(v.faq) ? v.faq : [],
        });
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminCall("settings.set", { key: "delivery_page", value: data });
      invalidateDeliveryContent();
      toast.success("Страница «Доставка и оплата» сохранена");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const uploadLogo = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const url = await adminUploadFile("site-images", file, { prefix: "delivery-logos/" });
      const next = [...data.companies];
      next[idx] = { ...next[idx], logo: url };
      setData({ ...data, companies: next });
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploadingIdx(null);
  };

  if (loading) return null;

  return (
    <div className={ui.card}>
      <h2 className={`${ui.h2} mb-2`}>Страница «Доставка и оплата»</h2>
      <p className="text-[14px] text-[#888] mb-6">
        Партнёры-перевозчики, самовывоз, упаковка, способы оплаты и FAQ.
        Пустые списки — используется значение по умолчанию.
      </p>

      {/* Партнёры */}
      <details className="border border-[#3a3a3a] rounded-lg p-4 mb-4" open>
        <summary className={`${ui.h3} cursor-pointer`}>Транспортные компании ({data.companies.length})</summary>
        <div className="grid gap-4 mt-4">
          {data.companies.map((c, i) => (
            <div key={i} className="border border-[#3a3a3a] rounded-lg p-4 grid md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <div>
                  <label className={ui.label}>Название</label>
                  <input value={c.name ?? ""} onChange={(e) => {
                    const n = [...data.companies]; n[i] = { ...n[i], name: e.target.value }; setData({ ...data, companies: n });
                  }} className={ui.input} />
                </div>
                <div>
                  <label className={ui.label}>Описание</label>
                  <textarea value={c.description ?? ""} onChange={(e) => {
                    const n = [...data.companies]; n[i] = { ...n[i], description: e.target.value }; setData({ ...data, companies: n });
                  }} className={ui.textarea} rows={2} />
                </div>
                <div>
                  <label className={ui.label}>Сроки</label>
                  <input value={c.timing ?? ""} onChange={(e) => {
                    const n = [...data.companies]; n[i] = { ...n[i], timing: e.target.value }; setData({ ...data, companies: n });
                  }} className={ui.input} placeholder="2–7 дней" />
                </div>
                <div>
                  <label className={ui.label}>Особенности (через запятую)</label>
                  <input
                    value={(c.features ?? []).join(", ")}
                    onChange={(e) => {
                      const n = [...data.companies];
                      n[i] = { ...n[i], features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                      setData({ ...data, companies: n });
                    }}
                    className={ui.input}
                    placeholder="Пункты выдачи, Курьер, Страхование"
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <label className={ui.label}>Логотип</label>
                  {c.logo && (
                    <div className="mb-2 rounded bg-[#1a1a1a] p-3 flex items-center justify-center h-20">
                      <img src={c.logo} alt="" className="max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className={`${ui.btn} ${ui.btnSecondary} cursor-pointer ${uploadingIdx === i ? "opacity-50 pointer-events-none" : ""}`}>
                      <Upload size={14} /> {uploadingIdx === i ? "…" : "Загрузить"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0]; if (f) uploadLogo(i, f); e.target.value = "";
                      }} />
                    </label>
                    <input
                      value={c.logo ?? ""}
                      onChange={(e) => {
                        const n = [...data.companies]; n[i] = { ...n[i], logo: e.target.value }; setData({ ...data, companies: n });
                      }}
                      placeholder="или URL"
                      className={`${ui.input} flex-1`}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={c.enabled !== false}
                    onChange={(e) => {
                      const n = [...data.companies]; n[i] = { ...n[i], enabled: e.target.checked }; setData({ ...data, companies: n });
                    }} className="w-5 h-5" />
                  <span>Показывать</span>
                </label>
                <button
                  onClick={() => setData({ ...data, companies: data.companies.filter((_, j) => j !== i) })}
                  className={`${ui.btn} ${ui.btnDanger} justify-self-start`}
                >
                  <Trash2 size={14} /> Удалить компанию
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setData({ ...data, companies: [...data.companies, { name: "", logo: "", description: "", timing: "", features: [], enabled: true }] })}
            className={`${ui.btn} ${ui.btnSecondary} justify-self-start`}
          >
            <Plus size={16} /> Добавить компанию
          </button>
        </div>
      </details>

      {/* Самовывоз */}
      <details className="border border-[#3a3a3a] rounded-lg p-4 mb-4">
        <summary className={`${ui.h3} cursor-pointer`}>Самовывоз</summary>
        <div className="grid gap-3 mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={ui.label}>Заголовок</label>
              <input value={data.pickup.title} onChange={(e) => setData({ ...data, pickup: { ...data.pickup, title: e.target.value } })} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Подзаголовок</label>
              <input value={data.pickup.subtitle} onChange={(e) => setData({ ...data, pickup: { ...data.pickup, subtitle: e.target.value } })} className={ui.input} />
            </div>
          </div>
          <div>
            <label className={ui.label}>Описание</label>
            <textarea value={data.pickup.description} onChange={(e) => setData({ ...data, pickup: { ...data.pickup, description: e.target.value } })} className={ui.textarea} rows={3} />
          </div>
          <div>
            <label className={ui.label}>Преимущества (по одному в строке)</label>
            <textarea
              value={data.pickup.features.join("\n")}
              onChange={(e) => setData({ ...data, pickup: { ...data.pickup, features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } })}
              className={ui.textarea}
              rows={3}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className={ui.label}>Адрес</label>
              <input value={data.pickup.address} onChange={(e) => setData({ ...data, pickup: { ...data.pickup, address: e.target.value } })} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Часы работы</label>
              <input value={data.pickup.hours} onChange={(e) => setData({ ...data, pickup: { ...data.pickup, hours: e.target.value } })} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Телефон</label>
              <input value={data.pickup.phone} onChange={(e) => setData({ ...data, pickup: { ...data.pickup, phone: e.target.value } })} className={ui.input} />
            </div>
          </div>
        </div>
      </details>

      {/* Упаковка */}
      <details className="border border-[#3a3a3a] rounded-lg p-4 mb-4">
        <summary className={`${ui.h3} cursor-pointer`}>Упаковка ({data.packaging.items.length})</summary>
        <div className="grid gap-3 mt-4">
          <div>
            <label className={ui.label}>Заголовок секции</label>
            <input value={data.packaging.title} onChange={(e) => setData({ ...data, packaging: { ...data.packaging, title: e.target.value } })} className={ui.input} />
          </div>
          {data.packaging.items.map((item, i) => (
            <div key={i} className="border border-[#3a3a3a] rounded p-3 grid gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#888]">Пункт #{i + 1}</span>
                <button onClick={() => setData({ ...data, packaging: { ...data.packaging, items: data.packaging.items.filter((_, j) => j !== i) } })} className="text-red-400 text-[13px]">удалить</button>
              </div>
              <input value={item.title} onChange={(e) => { const n = [...data.packaging.items]; n[i] = { ...n[i], title: e.target.value }; setData({ ...data, packaging: { ...data.packaging, items: n } }); }} placeholder="Заголовок" className={ui.input} />
              <textarea value={item.desc} onChange={(e) => { const n = [...data.packaging.items]; n[i] = { ...n[i], desc: e.target.value }; setData({ ...data, packaging: { ...data.packaging, items: n } }); }} placeholder="Описание" className={ui.textarea} rows={2} />
            </div>
          ))}
          <button
            onClick={() => setData({ ...data, packaging: { ...data.packaging, items: [...data.packaging.items, { title: "", desc: "" }] } })}
            className={`${ui.btn} ${ui.btnSecondary} justify-self-start`}
          >
            <Plus size={16} /> Добавить пункт
          </button>
        </div>
      </details>

      {/* Способы оплаты */}
      <details className="border border-[#3a3a3a] rounded-lg p-4 mb-4">
        <summary className={`${ui.h3} cursor-pointer`}>Способы оплаты ({data.paymentMethods.length})</summary>
        <div className="grid gap-3 mt-4">
          {data.paymentMethods.map((m, i) => (
            <div key={i} className="border border-[#3a3a3a] rounded p-3 grid gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#888]">Способ #{i + 1}</span>
                <div className="flex gap-3 items-center">
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" checked={m.enabled !== false}
                      onChange={(e) => { const n = [...data.paymentMethods]; n[i] = { ...n[i], enabled: e.target.checked }; setData({ ...data, paymentMethods: n }); }} />
                    показывать
                  </label>
                  <button onClick={() => setData({ ...data, paymentMethods: data.paymentMethods.filter((_, j) => j !== i) })} className="text-red-400 text-[13px]">удалить</button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <input value={m.name ?? ""} onChange={(e) => { const n = [...data.paymentMethods]; n[i] = { ...n[i], name: e.target.value }; setData({ ...data, paymentMethods: n }); }} placeholder="Название" className={ui.input} />
                <select value={m.icon ?? "card"} onChange={(e) => { const n = [...data.paymentMethods]; n[i] = { ...n[i], icon: e.target.value }; setData({ ...data, paymentMethods: n }); }} className={ui.input}>
                  {paymentIconOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <textarea value={m.description ?? ""} onChange={(e) => { const n = [...data.paymentMethods]; n[i] = { ...n[i], description: e.target.value }; setData({ ...data, paymentMethods: n }); }} placeholder="Описание" className={ui.textarea} rows={2} />
            </div>
          ))}
          <button
            onClick={() => setData({ ...data, paymentMethods: [...data.paymentMethods, { name: "", description: "", icon: "card", enabled: true }] })}
            className={`${ui.btn} ${ui.btnSecondary} justify-self-start`}
          >
            <Plus size={16} /> Добавить способ
          </button>
        </div>
      </details>

      {/* FAQ */}
      <details className="border border-[#3a3a3a] rounded-lg p-4 mb-4">
        <summary className={`${ui.h3} cursor-pointer`}>Частые вопросы ({data.faq.length})</summary>
        <div className="grid gap-3 mt-4">
          {data.faq.map((f, i) => (
            <div key={i} className="border border-[#3a3a3a] rounded p-3 grid gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#888]">Вопрос #{i + 1}</span>
                <button onClick={() => setData({ ...data, faq: data.faq.filter((_, j) => j !== i) })} className="text-red-400 text-[13px]">удалить</button>
              </div>
              <input value={f.q} onChange={(e) => { const n = [...data.faq]; n[i] = { ...n[i], q: e.target.value }; setData({ ...data, faq: n }); }} placeholder="Вопрос" className={ui.input} />
              <textarea value={f.a} onChange={(e) => { const n = [...data.faq]; n[i] = { ...n[i], a: e.target.value }; setData({ ...data, faq: n }); }} placeholder="Ответ" className={ui.textarea} rows={3} />
            </div>
          ))}
          <button
            onClick={() => setData({ ...data, faq: [...data.faq, { q: "", a: "" }] })}
            className={`${ui.btn} ${ui.btnSecondary} justify-self-start`}
          >
            <Plus size={16} /> Добавить вопрос
          </button>
        </div>
      </details>

      <div className="flex gap-3 mt-4 pt-4 border-t border-[#3a3a3a]">
        <button onClick={save} disabled={saving} className={`${ui.btn} ${ui.btnPrimary} ${saving ? "opacity-50" : ""}`}>
          <Check size={18} /> {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
};
