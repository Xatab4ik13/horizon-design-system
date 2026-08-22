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
      <SEO pageKey="home"
        title="Мебель и предметы интерьера из массива дерева на заказ"
        description="Мастерская FAKTURA: мебель, панно, зеркала и двери из натурального дерева ручной работы. Изготовление на заказ в Москве и Санкт-Петербурге, доставка по России."
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
