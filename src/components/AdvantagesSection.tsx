import { Hand, Leaf, UserCheck, Truck } from "lucide-react";

const advantages = [
  { icon: Hand, title: "Ручная работа", desc: "Каждое изделие создаётся мастером вручную с вниманием к деталям" },
  { icon: Leaf, title: "Натуральные материалы", desc: "Только экологичная древесина из проверенных источников" },
  { icon: UserCheck, title: "Индивидуальный подход", desc: "Изготовление по вашим размерам и пожеланиям" },
  { icon: Truck, title: "Быстрая доставка", desc: "Доставка по всей России в кратчайшие сроки" },
];

const AdvantagesSection = () => {
  return (
    <section className="py-20 bg-accent">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          Почему выбирают нас
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {advantages.map((a) => (
            <div key={a.title} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <a.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;
