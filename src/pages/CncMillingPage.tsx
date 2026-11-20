import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { buildBreadcrumbJsonLd } from "@/components/SEO";
import ContactForm from "@/components/ContactForm";
import CncServiceContent from "@/components/CncServiceContent";
import { Button } from "@/components/ui/button";
import { CNC_SERVICE, cncServiceSchema } from "@/data/cnc-service";

export default function CncMillingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={CNC_SERVICE.seoTitle} description={CNC_SERVICE.description} canonical={`https://faktura-wood.com${CNC_SERVICE.path}`} jsonLd={[
        cncServiceSchema(), buildBreadcrumbJsonLd([{ name: "Главная", url: "/" }, { name: "Услуги", url: "/services" }, { name: CNC_SERVICE.title, url: CNC_SERVICE.path }]),
      ]} />
      <Header />
      <main className="pt-32">
        <div className="container mx-auto px-4 pb-12">
          <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/">Главная</Link><ChevronRight className="h-3 w-3" /><Link to="/services">Услуги</Link><ChevronRight className="h-3 w-3" /><span>Фрезеровка на ЧПУ</span>
          </nav>
          <Button asChild className="mb-8"><a href="#cnc-request">Рассчитать фрезеровку <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
          <CncServiceContent />
        </div>
        <div id="cnc-request" className="scroll-mt-24">
          <ContactForm defaultSubject={CNC_SERVICE.subject} title="Заявка на фрезеровку ЧПУ" subtitle="Укажите материал, размеры заготовки и количество деталей. Опишите нужную обработку." source={CNC_SERVICE.path} />
        </div>
      </main>
      <Footer />
    </div>
  );
}