import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ResetPasswordPage = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase выставит сессию из ссылки и/или пришлёт событие PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 6) {
      toast({ title: "Пароль слишком короткий", description: "Минимум 6 символов", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Не удалось сменить пароль", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Пароль обновлён" });
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
            <span className="text-foreground">Смена пароля</span>
          </nav>

          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Новый пароль</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {ready
                ? "Введите новый пароль для вашего аккаунта."
                : "Проверяем ссылку… Если страница не активируется — откройте ссылку из письма ещё раз."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Новый пароль *</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!ready}
                  className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="Не менее 6 символов"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Повторите пароль *</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={!ready}
                  className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="Повторите новый пароль"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting || !ready}
                className="w-full rounded-xl"
              >
                {submitting ? "..." : "Сохранить пароль"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
