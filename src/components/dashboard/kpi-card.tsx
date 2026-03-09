import type { LucideProps } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  iconColor?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  delay?: number;
}

export function KpiCard({ title, value, description, icon: Icon, iconColor, valueClassName, descriptionClassName, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="h-full"
    >
      <Card className="overflow-hidden border-none shadow-soft hover:shadow-premium transition-all duration-500 group h-full bg-card/80 backdrop-blur-md">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className={cn(
              "p-4 rounded-2xl md:rounded-3xl transition-all duration-500 group-hover:scale-110 shadow-inner",
              iconColor?.includes('text-primary') ? 'bg-primary/10' : 
              iconColor?.includes('text-orange') ? 'bg-orange-500/10' : 
              iconColor?.includes('text-accent') ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Icon className={cn("h-6 w-6 md:h-8 md:h-8", iconColor || "text-primary")} aria-hidden="true" />
            </div>
            <div className="h-2 w-2 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] md:text-xs font-black text-muted-foreground/60 uppercase tracking-[0.15em] truncate">{title}</p>
            <div className={cn(
              "text-3xl sm:text-4xl xl:text-5xl font-black font-headline tracking-tighter text-foreground/90 leading-none",
              valueClassName
            )}>
              {value}
            </div>
            {description && (
              <p className={cn(
                "text-[10px] md:text-xs flex items-center gap-1.5 font-bold leading-relaxed mt-2", 
                descriptionClassName || "text-muted-foreground/80"
              )}>
                {description.includes('%') && (
                  <span className="text-green-500 font-black bg-green-500/10 px-1.5 py-0.5 rounded-lg text-[10px]">↗</span>
                )}
                <span className="line-clamp-2 md:line-clamp-none">{description}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
