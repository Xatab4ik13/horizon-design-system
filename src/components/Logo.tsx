import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  linkTo?: string;
}

const sizeClasses = {
  sm: "text-base tracking-[0.45em]",
  md: "text-lg tracking-[0.5em]",
  lg: "text-2xl tracking-[0.55em]",
  xl: "text-4xl tracking-[0.6em]",
};

const Logo = ({ className, size = "md", linkTo = "/" }: LogoProps) => {
  const content = (
    <span
      className={cn(
        "font-light uppercase select-none",
        sizeClasses[size],
        className
      )}
      style={{
        fontFamily: "'Century Gothic', 'Avant Garde', 'Futura', sans-serif",
        letterSpacing: undefined, // handled by tailwind
      }}
    >
      {"FAKTURA".split("").map((char, i) => (
        <span key={i} className="inline-block">
          {char}
        </span>
      ))}
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center no-underline text-foreground hover:text-primary transition-colors">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
