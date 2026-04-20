import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";

interface ModeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description?: string;
  gradient: string;
  onClick?: () => void;
  selected?: boolean;
}

export const ModeCard = React.forwardRef<HTMLDivElement, ModeCardProps>(
  ({ 
    className, 
    icon: Icon, 
    title, 
    description,
    gradient,
    onClick,
    selected,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden rounded-2xl p-5 sm:p-6 cursor-pointer",
          "transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
          selected 
            ? `bg-gradient-to-br ${gradient} text-white shadow-xl` 
            : "bg-card border border-border/50 shadow-lg hover:border-primary/30",
          className
        )}
        {...props}
      >
        {/* Background pattern */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, 
            backgroundSize: '20px 20px' 
          }} 
        />
        
        {/* Glow effect */}
        {selected && (
          <div className={cn(
            "absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"
          )} />
        )}

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
            selected 
              ? "bg-white/20 shadow-inner" 
              : `bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110`
          )}>
            <Icon className={cn(
              "w-7 h-7 sm:w-8 sm:h-8",
              selected ? "text-white" : "text-white"
            )} />
          </div>
          
          <h3 className={cn(
            "text-lg sm:text-xl font-bold mb-1",
            selected ? "text-white" : "text-foreground"
          )}>
            {title}
          </h3>
          
          {description && (
            <p className={cn(
              "text-xs sm:text-sm",
              selected ? "text-white/80" : "text-muted-foreground"
            )}>
              {description}
            </p>
          )}
          
          <div className={cn(
            "mt-4 flex items-center gap-1 text-xs sm:text-sm font-medium transition-all",
            selected ? "text-white" : "text-primary opacity-0 group-hover:opacity-100"
          )}>
            <span>Get Started</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    );
  }
);

ModeCard.displayName = "ModeCard";