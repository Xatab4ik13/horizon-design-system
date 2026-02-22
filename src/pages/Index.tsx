import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import PopularProducts from "@/components/PopularProducts";
import AdvantagesSection from "@/components/AdvantagesSection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Главная"
        description="FAKTURA — мастерская уникальных изделий из натурального дерева. Панно, зеркала, мебель, кухонные аксессуары ручной работы. Доставка по России."
      />
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <AdvantagesSection />
        <PopularProducts />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
