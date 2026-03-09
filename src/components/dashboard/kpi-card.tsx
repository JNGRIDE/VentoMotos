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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
    >
      <Card className="overflow-hidden border-none shadow-soft hover:shadow-premium transition-all duration-500 group h-full">
        <CardContent className="p-5 md:p-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className={cn(
              "p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all duration-500 group-hover:scale-110 shadow-inner",
              iconColor?.includes('text-primary') ? 'bg-primary/10' : 
              iconColor?.includes('text-orange') ? 'bg-orange-500/10' : 
              iconColor?.includes('text-accent') ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Icon className={cn("h-5 w-5 md:h-7 md:h-7", iconColor || "text-primary")} aria-hidden="true" />
            </div>
            <button className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
               <span className="text-muted-foreground font-bold">···</span>
            </button>
          </div>
          <div className="space-y-1 md:space-y-2">
            <p className="text-[10px] md:text-sm font-bold text-muted-foreground/70 uppercase tracking-wider truncate">{title}</p>
            <div className={cn(
              "text-2xl sm:text-3xl xl:text-4xl font-bold font-headline tracking-tighter text-foreground/90 leading-tight",
              valueClassName
            )}>
              {value}
            </div>
            {description && (
              <p className={cn(
                "text-[10px] md:text-xs flex items-center gap-1 font-medium leading-relaxed", 
                descriptionClassName || "text-muted-foreground"
              )}>
                {description.includes('%') && (
                  <span className="text-green-500 font-bold bg-green-500/10 px-1 py-0.5 rounded-md">↗</span>
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