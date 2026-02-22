import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import PopularProducts from "@/components/PopularProducts";
import AdvantagesSection from "@/components/AdvantagesSection";

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
        
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
