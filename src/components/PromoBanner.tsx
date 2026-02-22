import { Button } from "@/components/ui/button";

const PromoBanner = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[hsl(216,57%,14%)] to-[hsl(35,38%,35%)] p-10 md:p-16">
          <div className="relative z-10 max-w-lg">
            <span className="inline-block text-primary text-sm font-semibold uppercase tracking-wider mb-3">
              Специальное предложение
            </span>
            <h2 className="text-3xl md:text-4xl text-white mb-4" style={{ fontFamily: "'Franklin Gothic Medium', sans-serif" }}>
              Скидка 15% на первый заказ
            </h2>
            <p className="text-white/70 mb-6 font-light">
              Оформите заказ до конца месяца и получите скидку на любое изделие из каталога.
            </p>
            <Button size="lg" className="rounded-full px-8">
              Воспользоваться
            </Button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/10" />
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-primary/5" />
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
