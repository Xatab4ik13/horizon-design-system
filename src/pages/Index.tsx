import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import PopularProducts from "@/components/PopularProducts";
import AdvantagesSection from "@/components/AdvantagesSection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useHomepageBlocks, type HomeBlockId } from "@/hooks/useSiteContent";

const defaultOrder: HomeBlockId[] = ["hero", "popular", "categories", "advantages", "contact"];

const blockMap: Record<HomeBlockId, () => JSX.Element> = {
  hero: () => <HeroSection />,
  popular: () => <PopularProducts />,
  categories: () => <CategoriesSection />,
  advantages: () => <AdvantagesSection />,
  contact: () => <ContactForm />,
};

const Index = () => {
  const order = useHomepageBlocks(defaultOrder);
  return (
    <div className="min-h-screen">
      <SEO
        title="Главная"
        description="FAKTURA — мастерская уникальных изделий из натурального дерева. Панно, зеркала, мебель, кухонные аксессуары ручной работы. Доставка по России."
      />
      <Header />
      <main>
        {order.map((id) => {
          const R = blockMap[id];
          return R ? <div key={id}>{R()}</div> : null;
        })}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
