import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
}

const formatDate = (iso: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image, published_at, created_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setPosts((data as BlogPostRow[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const articleJsonLd = posts.map((post) =>
    buildArticleJsonLd({
      title: post.title,
      description: post.excerpt ?? "",
      author: "FAKTURA",
      datePublished: post.published_at ?? post.created_at,
      id: post.slug,
    })
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Блог", url: "/blog" },
  ]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      <SEO
        title="Блог о дереве и интерьере"
        description="Статьи о породах дерева, уходе за мебелью, трендах дизайна интерьера и процессах мастерской FAKTURA."
        type="website"
        jsonLd={[...articleJsonLd, breadcrumbJsonLd]}
      />
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Блог</span>
          </nav>

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

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Статьи скоро появятся
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 group flex flex-col"
                >
                  {post.cover_image && (
                    <Link to={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="text-foreground font-semibold text-lg mb-3 group-hover:text-primary transition-colors leading-tight">
                        {post.title}
                      </h2>
                    </Link>
                    {post.excerpt && (
                      <p className="text-foreground/60 text-sm leading-relaxed mb-4 flex-1">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.published_at ?? post.created_at)}
                      </span>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                      >
                        Читать <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
