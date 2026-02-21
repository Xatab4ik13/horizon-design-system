import { Hand, Leaf, UserCheck, Truck } from "lucide-react";
import { motion } from "framer-motion";
import workshopBg from "@/assets/workshop-bg.jpg";

const advantages = [
  { icon: Hand, title: "Ручная работа", desc: "Каждое изделие создаётся мастером вручную с вниманием к деталям" },
  { icon: Leaf, title: "Натуральные материалы", desc: "Только экологичная древесина из проверенных источников" },
  { icon: UserCheck, title: "Индивидуальный подход", desc: "Изготовление по вашим размерам и пожеланиям" },
  { icon: Truck, title: "Быстрая доставка", desc: "Доставка по всей России в кратчайшие сроки" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.15,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

const AdvantagesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${workshopBg})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground"
        >
          Почему выбирают нас
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((a, i) => (
            <motion.div
              key={a.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              className="group relative rounded-2xl p-8 text-center backdrop-blur-md bg-background/10 border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:bg-background/20"
            >
              {/* Icon with glow */}
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/20 blur-xl transition-all duration-500" />
                <div className="relative w-full h-full rounded-full border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors duration-500">
                  <a.icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-3 text-lg">
                {a.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {a.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;
