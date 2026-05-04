import { useEffect, useState, FormEvent } from "react";
import { adminAuth, adminCall, adminLogin, adminUploadFile } from "@/lib/adminApi";
import { supabase } from "@/integrations/supabase/client";
import { parse1CFile } from "@/lib/import1c";
import { exportProductsTo1CXlsx, downloadBlob } from "@/lib/export1c";
import { toast } from "sonner";
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

type Tab = "dashboard" | "products" | "orders" | "requests" | "vacancies" | "blog" | "settings";

const AdminPage = () => {
  const [authed, setAuthed] = useState(adminAuth.isLoggedIn());
  const [tab, setTab] = useState<Tab>("dashboard");

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Сводка", icon: Package },
    { id: "products", label: "Товары", icon: Package },
    { id: "orders", label: "Заказы", icon: ShoppingBag },
    { id: "requests", label: "Заявки", icon: MessageSquare },
    { id: "vacancies", label: "Вакансии", icon: Briefcase },
    { id: "blog", label: "Блог", icon: FileText },
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
        {tab === "vacancies" && <VacanciesPanel />}
        {tab === "blog" && <BlogPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
};

// ===================================================================
// ЛОГИН
// ===================================================================
const LoginScreen = ({ onSuccess }: { onSuccess: () => void }) => {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await adminLogin(pwd);
    setLoading(false);
    if (ok) onSuccess();
    else toast.error("Неверный пароль");
  };

  return (
    <div className={`${ui.page} flex items-center justify-center px-4`}>
      <form onSubmit={submit} className={`${ui.card} w-full max-w-md`}>
        <h1 className={`${ui.h1} mb-2 text-center`}>FAKTURA</h1>
        <p className="text-center text-[#888] mb-8 text-[15px] uppercase tracking-widest">
          Панель администратора
        </p>
        <label className={ui.label}>Пароль</label>
        <input
          type="password"
          autoFocus
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className={ui.input}
          placeholder="Введите пароль"
        />
        <button
          type="submit"
          disabled={loading || !pwd}
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
const Dashboard = ({ onNavigate }: { onNavigate: (t: Tab) => void }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    adminCall("stats")
      .then((r) => setStats(r.data))
      .catch((e) => toast.error(e.message));
  }, []);

  const cards = [
    { label: "Всего заказов", value: stats?.ordersTotal ?? "—", tab: "orders" as Tab },
    { label: "Новых заказов", value: stats?.ordersNew ?? "—", tab: "orders" as Tab, hot: true },
    { label: "Всего заявок", value: stats?.requestsTotal ?? "—", tab: "requests" as Tab },
    {
      label: "Непрочитанных заявок",
      value: stats?.requestsUnread ?? "—",
      tab: "requests" as Tab,
      hot: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <button
          key={c.label}
          onClick={() => onNavigate(c.tab)}
          className={`${ui.card} text-left hover:border-[#666] transition-colors`}
        >
          <div className="text-[14px] uppercase tracking-wider text-[#888] mb-3">{c.label}</div>
          <div className={`text-5xl font-bold ${c.hot && Number(c.value) > 0 ? "text-[#f5b15a]" : ""}`}>
            {c.value}
          </div>
        </button>
      ))}
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
  width_cm: null as number | null,
  height_cm: null as number | null,
  depth_cm: null as number | null,
  weight_kg: null as number | null,
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
      const payload = {
        items: parsed.map((p) => ({
          ...p,
          sku: p.sku || null,
          category,
          is_active: true,
          images: [],
          sort_order: 0,
        })),
      };
      const r = await adminCall<{ data: { created: number; updated: number; errors: string[] } }>(
        "products.bulkUpsert",
        payload,
      );
      const { created, updated, errors } = r.data;
      toast.success(`Импорт: создано ${created}, обновлено ${updated}`);
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
            товаров. Сопоставление с существующими — по артикулу. Скидка из 1С игнорируется. Фото
            добавьте отдельно после импорта.
          </p>
        </div>

        {parsed && (
          <div className="border border-[#3a3a3a] rounded-lg overflow-hidden">
            <div className="bg-[#1a1a1a] px-4 py-2 text-[14px] text-[#aaa]">
              Предпросмотр ({parsed.length})
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-[14px]">
                <thead className="text-[#888] text-left">
                  <tr>
                    <th className="px-3 py-2">Артикул</th>
                    <th className="px-3 py-2">Название</th>
                    <th className="px-3 py-2">Цена</th>
                    <th className="px-3 py-2">Размеры (Ш×В×Г)</th>
                    <th className="px-3 py-2">Вес</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((p, i) => (
                    <tr key={i} className="border-t border-[#3a3a3a]">
                      <td className="px-3 py-2 font-mono">{p.sku ?? "—"}</td>
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2">{Number(p.price).toLocaleString("ru-RU")} ₽</td>
                      <td className="px-3 py-2">
                        {[p.width_cm, p.height_cm, p.depth_cm]
                          .map((v) => (v ?? "—"))
                          .join(" × ")}
                      </td>
                      <td className="px-3 py-2">{p.weight_kg ?? "—"} кг</td>
                    </tr>
                  ))}
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
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [qrFor, setQrFor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminCall("products.list");
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
    await adminCall("products.delete", { id });
    toast.success("Удалено");
    load();
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

      <div className="flex justify-between items-center mb-6 mt-6">
        <h2 className={ui.h2}>Товары ({items.length})</h2>
        <button
          onClick={() => setEditing({ ...emptyProduct })}
          className={`${ui.btn} ${ui.btnPrimary}`}
        >
          <Plus size={20} />
          Добавить товар
        </button>
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
              <div className="w-20 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                {p.images?.[0] && (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
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
              <button
                onClick={() => setQrFor(p)}
                className={`${ui.btn} ${ui.btnSecondary}`}
                title="QR-код на товар"
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

  const save = async () => {
    setSaving(true);
    try {
      if (form.id) {
        await adminCall("products.update", form);
      } else {
        await adminCall("products.create", form);
      }
      toast.success("Сохранено");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await adminUploadFile("product-images", file);
      setForm({ ...form, images: [...(form.images ?? []), url] });
      toast.success("Фото загружено");
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setForm({ ...form, images: form.images.filter((_: any, i: number) => i !== idx) });
  };

  const [arUploading, setArUploading] = useState<"glb" | "usdz" | null>(null);
  const handleArUpload = async (file: File, kind: "glb" | "usdz") => {
    setArUploading(kind);
    try {
      const url = await adminUploadFile("product-models", file);
      const field = kind === "glb" ? "ar_glb_url" : "ar_usdz_url";
      setForm({ ...form, [field]: url });
      toast.success(`${kind.toUpperCase()} загружен`);
    } catch (e: any) {
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
        onChange={(e) => setForm({ ...form, [k]: e.target.value === "" ? null : Number(e.target.value) })}
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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Артикул (SKU)</label>
            <input
              value={form.sku ?? ""}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className={ui.input}
              placeholder="напр. П0002"
            />
          </div>
        </div>

        <div>
          <label className={ui.label}>Описание</label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={ui.textarea}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={ui.label}>Категория *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
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
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className={ui.input}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField k="width_cm" label="Ширина, см" />
          <NumField k="height_cm" label="Высота, см" />
          <NumField k="depth_cm" label="Глубина, см" />
          <NumField k="weight_kg" label="Вес, кг" />
        </div>

        <div>
          <label className={ui.label}>Фотографии</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {form.images?.map((url: string, i: number) => (
              <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden bg-[#1a1a1a]">
                <img src={url} alt="" className="w-full h-full object-cover" />
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
                onChange={(e) => setForm({ ...form, ar_glb_url: e.target.value || null })}
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
            {form.ar_glb_url && (
              <button
                onClick={() => setForm({ ...form, ar_glb_url: null })}
                className="text-[12px] text-[#888] hover:text-white mt-1"
              >
                Удалить
              </button>
            )}
          </div>
          <div>
            <label className={ui.label}>AR — iOS (.usdz)</label>
            <div className="flex gap-2">
              <input
                value={form.ar_usdz_url ?? ""}
                onChange={(e) => setForm({ ...form, ar_usdz_url: e.target.value || null })}
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
            {form.ar_usdz_url && (
              <button
                onClick={() => setForm({ ...form, ar_usdz_url: null })}
                className="text-[12px] text-[#888] hover:text-white mt-1"
              >
                Удалить
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
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

const OrdersPanel = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminCall("orders.list");
      setItems(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
    // Polling: realtime требует RLS-доступа, у анонимов его нет. 10 сек — компромисс.
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const setStatus = async (id: string, status: string) => {
    await adminCall("orders.updateStatus", { id, status });
    toast.success("Статус обновлён");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить заказ?")) return;
    await adminCall("orders.delete", { id });
    load();
  };

  return (
    <div>
      <h2 className={`${ui.h2} mb-6`}>Заказы ({items.length})</h2>
      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>Заказов пока нет.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((o) => (
            <div key={o.id} className={ui.card}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                  <div className="text-[14px] text-[#888]">
                    {new Date(o.created_at).toLocaleString("ru-RU")}
                  </div>
                  <div className="font-bold text-[18px] mt-1">{o.customer_name}</div>
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
                    onChange={(e) => setStatus(o.id, e.target.value)}
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
                    <b className="text-[#888]">Доставка:</b> {o.delivery_method}
                    {o.delivery_address && ` — ${o.delivery_address}`}
                  </div>
                  <div>
                    <b className="text-[#888]">Оплата:</b> {o.payment_method}
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
      )}
    </div>
  );
};

// ===================================================================
// ЗАЯВКИ
// ===================================================================
const RequestsPanel = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminCall("requests.list");
      setItems(r.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (it: any) => {
    await adminCall("requests.markRead", { id: it.id, is_read: !it.is_read });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Удалить заявку?")) return;
    await adminCall("requests.delete", { id });
    load();
  };

  return (
    <div>
      <h2 className={`${ui.h2} mb-6`}>Заявки ({items.length})</h2>
      {loading ? (
        <p className="text-[#888]">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className={`${ui.card} text-center text-[#888]`}>Заявок пока нет.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
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
      )}
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
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    try {
      const r = await adminCall("vacancies.list");
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
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const r = await adminCall("blog.list");
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
      const payload = {
        ...editing,
        slug: editing.slug || slugify(editing.title),
        published_at: editing.is_published ? editing.published_at ?? new Date().toISOString() : null,
      };
      if (editing.id) await adminCall("blog.update", payload);
      else await adminCall("blog.create", payload);
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
};

const SettingsPanel = () => {
  const [sender, setSender] = useState(emptySender);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCall("settings.get", { key: "sender" })
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
    </div>
  );
};

export default AdminPage;
