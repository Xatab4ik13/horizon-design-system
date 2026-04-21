import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Calendar, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
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

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
          setPost(null);
        } else {
          setPost(data as BlogPostRow);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(25 15% 8%) 40%, hsl(30 12% 6%) 70%, hsl(0 0% 0%) 100%)",
      }}
    >
      {post && (
        <SEO
          title={post.title}
          description={post.excerpt ?? post.title}
          type="article"
          jsonLd={[
            buildArticleJsonLd({
              title: post.title,
              description: post.excerpt ?? "",
              author: "FAKTURA",
              datePublished: post.published_at ?? post.created_at,
              id: post.slug,
            }),
            buildBreadcrumbJsonLd([
              { name: "Главная", url: "/" },
              { name: "Блог", url: "/blog" },
              { name: post.title, url: `/blog/${post.slug}` },
            ]),
          ]}
        />
      )}
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/blog" className="hover:text-primary transition-colors">Блог</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground line-clamp-1">{post?.title ?? "..."}</span>
          </nav>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notFound || !post ? (
            <div className="text-center py-20">
              <p className="text-xl text-foreground mb-4">Статья не найдена</p>
              <Link to="/blog" className="text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Вернуться в блог
              </Link>
            </div>
          ) : (
            <article>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.published_at ?? post.created_at)}
                </span>
              </div>

              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full rounded-2xl mb-8 object-cover"
                />
              )}

              {post.excerpt && (
                <p className="text-lg text-foreground/80 leading-relaxed mb-8 italic border-l-2 border-primary/40 pl-4">
                  {post.excerpt}
                </p>
              )}

              <div className="prose prose-invert max-w-none text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>

              <div className="mt-12 pt-8 border-t border-border/50">
                <Link to="/blog" className="text-primary hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Все статьи
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
