import type { LucideProps } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  iconColor?: string;
  valueClassName?: string;
  descriptionClassName?: string;
}

export function KpiCard({ title, value, description, icon: Icon, iconColor, valueClassName, descriptionClassName }: KpiCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-soft hover:shadow-premium transition-all duration-500 group animate-in fade-in zoom-in duration-700">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className={cn(
            "p-4 rounded-3xl transition-all duration-500 group-hover:scale-110",
            iconColor?.includes('text-primary') ? 'bg-primary/10' : 
            iconColor?.includes('text-orange') ? 'bg-orange-500/10' : 
            iconColor?.includes('text-accent') ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Icon className={cn("h-7 w-7", iconColor || "text-primary")} aria-hidden="true" />
          </div>
          <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
             <span className="text-muted-foreground font-bold">···</span>
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-muted-foreground/70 uppercase tracking-wider">{title}</p>
          <div className={cn("text-4xl font-bold font-headline tracking-tighter text-foreground/90", valueClassName)}>
            {value}
          </div>
          {description && (
            <p className={cn("text-xs flex items-center gap-1.5 font-medium", descriptionClassName || "text-muted-foreground")}>
              {description.includes('%') && (
                <span className="text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded-lg">↗</span>
              )}
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}