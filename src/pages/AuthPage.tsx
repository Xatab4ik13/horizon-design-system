import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const AuthPage = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    if (user) navigate("/account", { replace: true });
  }, [user, navigate]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { error } =
      mode === "signin"
        ? await signIn(form.email.trim(), form.password)
        : await signUp(form.email.trim(), form.password, {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            phone: form.phone.trim(),
          });
    setSubmitting(false);
    if (error) {
      toast({
        title: mode === "signin" ? "Не удалось войти" : "Не удалось зарегистрироваться",
        description: error,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: mode === "signin" ? "Добро пожаловать!" : "Аккаунт создан",
    });
    navigate("/account", { replace: true });
  };

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
        <div className="container mx-auto px-4 max-w-md">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{mode === "signin" ? "Вход" : "Регистрация"}</span>
          </nav>

          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <div className="flex gap-2 mb-6 p-1 bg-background/40 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Регистрация
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Имя *</label>
                    <input
                      required
                      value={form.first_name}
                      onChange={update("first_name")}
                      className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                      placeholder="Иван"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Фамилия *</label>
                    <input
                      required
                      value={form.last_name}
                      onChange={update("last_name")}
                      className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                      placeholder="Иванов"
                    />
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Телефон *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onFocus={(e) => { if (!e.target.value) setForm((f) => ({ ...f, phone: "+7 " })); }}
                    onChange={(e) => setForm((f) => ({ ...f, phone: normalizePhone(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder="+7 (900) 123-45-67"
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="mail@example.com"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Пароль *</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={update("password")}
                  className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="Не менее 6 символов"
                />
              </div>

              <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-xl">
                {submitting
                  ? "..."
                  : mode === "signin"
                    ? "Войти"
                    : "Зарегистрироваться"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;
