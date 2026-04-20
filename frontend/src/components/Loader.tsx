import { BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "spinner";
}

const Loader = ({ text = "Loading...", size = "md", variant = "default" }: LoaderProps) => {
  const sizeClasses = {
    sm: { wrapper: "h-16 w-16", icon: "h-6 w-6", ring: "border-2", text: "text-xs" },
    md: { wrapper: "h-24 w-24", icon: "h-10 w-10", ring: "border-3", text: "text-sm" },
    lg: { wrapper: "h-32 w-32", icon: "h-12 w-12", ring: "border-4", text: "text-base" },
  };

  const s = sizeClasses[size];

  if (variant === "spinner") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className={cn(s.icon, "text-primary animate-spin")} />
        {text && <span className={cn(s.text, "font-medium text-muted-foreground")}>{text}</span>}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className={cn("relative flex items-center justify-center", s.wrapper)}>
        {/* Rotating ring */}
        <div className={cn(
          "absolute inset-0 rounded-full border-primary/10 border-t-primary animate-spin",
          s.ring
        )} style={{ animationDuration: "1s" }} />

        {/* Soft glow */}
        <div className="absolute h-3/4 w-3/4 rounded-full bg-primary/5 blur-xl animate-pulse" />

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <BookOpen className={cn(s.icon, "text-primary animate-pulse")} />
        </div>
      </div>

      {/* Text with dots */}
      <div className={cn("flex items-center gap-2 font-medium text-muted-foreground", s.text)}>
        <span>{text}</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </div>
    </div>
  );
};

export default Loader;