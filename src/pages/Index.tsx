import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import PopularProducts from "@/components/PopularProducts";
import AdvantagesSection from "@/components/AdvantagesSection";
import PromoBanner from "@/components/PromoBanner";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <AdvantagesSection />
        <PopularProducts />
        <PromoBanner />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
