import { motion } from "framer-motion";
import { ChevronRight, Calendar, Clock, ArrowRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const blogPosts = [
  {
    id: 1,
    title: "Как выбрать породу дерева для мебели: полное руководство",
    excerpt:
      "Дуб, ясень, бук, орех — каждая порода имеет свой характер. Разбираемся, какое дерево подходит для кухни, спальни и гостиной.",
    category: "Материалы",
    date: "18 февраля 2026",
    readTime: "8 мин",
    author: "Алексей Мастеров",
  },
  {
    id: 2,
    title: "Уход за деревянной мебелью: 10 правил долговечности",
    excerpt:
      "Правильный уход продлевает жизнь изделия на десятилетия. Рассказываем, чем обрабатывать, как чистить и чего избегать.",
    category: "Советы",
    date: "12 февраля 2026",
    readTime: "6 мин",
    author: "Мария Столярова",
  },
  {
    id: 3,
    title: "Тренды в дизайне интерьера 2026: натуральные материалы",
    excerpt:
      "Эко-стиль, ваби-саби и минимализм — дерево остаётся главным материалом года. Обзор трендов от наших дизайнеров.",
    category: "Дизайн",
    date: "5 февраля 2026",
    readTime: "10 мин",
    author: "Дарья Интерьерова",
  },
  {
    id: 4,
    title: "Процесс создания стола из массива: от чертежа до готового изделия",
    excerpt:
      "Подробный фоторепортаж из нашей мастерской — как рождается обеденный стол ручной работы за 14 дней.",
    category: "Мастерская",
    date: "28 января 2026",
    readTime: "12 мин",
    author: "Алексей Мастеров",
  },
  {
    id: 5,
    title: "Масло, воск или лак: какое покрытие выбрать?",
    excerpt:
      "Сравниваем виды финишных покрытий по износостойкости, экологичности и внешнему виду. Плюсы и минусы каждого варианта.",
    category: "Материалы",
    date: "20 января 2026",
    readTime: "7 мин",
    author: "Мария Столярова",
  },
  {
    id: 6,
    title: "Как измерить пространство для встроенной мебели",
    excerpt:
      "Пошаговая инструкция: какие замеры нужны, как учесть неровности стен и что сообщить мастеру при заказе.",
    category: "Советы",
    date: "14 января 2026",
    readTime: "5 мин",
    author: "Дарья Интерьерова",
  },
];

const categories = ["Все", "Материалы", "Советы", "Дизайн", "Мастерская"];

const BlogPage = () => {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Блог</span>
          </nav>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Блог</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Статьи о дереве, дизайне интерьера, уходе за мебелью и процессах нашей мастерской
            </p>
          </motion.div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                  cat === "Все"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/40 text-foreground/70 border-border hover:border-primary/30 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Blog grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group flex flex-col"
              >
                {/* Category badge */}
                <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/10 self-start mb-4">
                  {post.category}
                </span>

                <h2 className="text-foreground font-semibold text-lg mb-3 group-hover:text-primary transition-colors leading-tight">
                  {post.title}
                </h2>

                <p className="text-foreground/60 text-sm leading-relaxed mb-4 flex-1">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /> {post.author}
                  </span>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer">
                    Читать <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
