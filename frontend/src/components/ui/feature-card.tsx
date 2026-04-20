import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description?: string;
  gradient?: string;
  badge?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "glass";
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ 
    className, 
    icon: Icon, 
    title, 
    description, 
    gradient = "from-violet-500 to-fuchsia-500",
    badge,
    onClick,
    size = "md",
    variant = "default",
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: "p-3 sm:p-4",
      md: "p-4 sm:p-5",
      lg: "p-5 sm:p-6",
    };

    const iconSizes = {
      sm: "h-8 w-8 sm:h-10 sm:w-10",
      md: "h-10 w-10 sm:h-12 sm:w-12",
      lg: "h-12 w-12 sm:h-14 sm:w-14",
    };

    const iconInnerSizes = {
      sm: "h-4 w-4",
      md: "h-5 w-5 sm:h-6 sm:w-6",
      lg: "h-6 w-6 sm:h-7 sm:w-7",
    };

    const variantClasses = {
      default: "bg-card border border-border/50 shadow-lg hover:shadow-xl",
      outline: "bg-transparent border-2 border-border hover:border-primary/50",
      glass: "bg-card/60 backdrop-blur-xl border border-white/20 shadow-xl",
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden rounded-2xl transition-all duration-300",
          "hover:-translate-y-1 cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Background gradient on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity",
          gradient
        )} />
        
        {/* Decorative corner gradient */}
        <div className={cn(
          "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity",
          gradient
        )} />

        <div className="relative z-10">
          {badge && (
            <span className={cn(
              "absolute -top-1 -right-1 px-2 py-0.5 text-[10px] font-bold rounded-full text-white bg-gradient-to-r",
              gradient
            )}>
              {badge}
            </span>
          )}
          
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={cn(
              "shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform",
              gradient,
              iconSizes[size]
            )}>
              <Icon className={cn("text-white", iconInnerSizes[size])} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-sm sm:text-base lg:text-lg leading-tight truncate group-hover:text-primary transition-colors">
                {title}
              </h3>
              {description && (
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FeatureCard.displayName = "FeatureCard";