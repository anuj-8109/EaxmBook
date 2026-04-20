import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  gradient?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  onClick?: () => void;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    className, 
    icon: Icon, 
    label, 
    value, 
    sublabel,
    gradient = "from-violet-500 to-fuchsia-500",
    trend,
    trendValue,
    onClick,
    ...props 
  }, ref) => {
    const trendColors = {
      up: "text-success",
      down: "text-destructive",
      neutral: "text-muted-foreground",
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5",
          "bg-gradient-to-br from-card to-card/80 border border-border/50",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          onClick && "cursor-pointer hover:-translate-y-1",
          className
        )}
        {...props}
      >
        {/* Background accent */}
        <div className={cn(
          "absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2",
          gradient
        )} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
            <div className={cn(
              "p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br shadow-lg",
              gradient
            )}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
          </div>
          
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            {value}
          </p>
          
          <div className="flex items-center justify-between mt-1">
            {sublabel && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">{sublabel}</p>
            )}
            {trend && trendValue && (
              <span className={cn("text-[10px] sm:text-xs font-medium", trendColors[trend])}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";