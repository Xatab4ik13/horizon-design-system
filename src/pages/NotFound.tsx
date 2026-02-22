import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SEO title="Страница не найдена" description="Запрашиваемая страница не существует." noindex />
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Страница не найдена</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
