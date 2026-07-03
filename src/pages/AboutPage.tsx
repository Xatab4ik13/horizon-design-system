import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

const defaultText = `FAKTURA — мастерская изделий из натурального дерева.

Мы создаём панно, зеркала, двери, мебель и предметы интерьера ручной работы из массива. Каждое изделие проходит путь от эскиза до финишной отделки в одной мастерской — это позволяет нам гарантировать качество и индивидуальный подход к каждому заказу.

Принимаем заказы по индивидуальным размерам, цветам и формам. Работаем с дубом, ясенем, орехом, лиственницей и другими породами.`;

const AboutPage = () => {
  const [text, setText] = useState(defaultText);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "about_page")
      .maybeSingle()
      .then(({ data }) => {
        const v = (data?.value as { text?: string } | null) ?? null;
        if (v?.text?.trim()) setText(v.text);
      });
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <SEO pageKey="about" title="О компании" description="FAKTURA — мастерская изделий из натурального дерева. Панно, зеркала, двери, мебель ручной работы." />
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">О компании</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">О компании</h1>

          <div className="prose prose-invert max-w-none">
            {text.split("\n").map((p, i) =>
              p.trim() ? (
                <p key={i} className="text-foreground/80 text-lg leading-relaxed mb-4 whitespace-pre-line">
                  {p}
                </p>
              ) : null,
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
