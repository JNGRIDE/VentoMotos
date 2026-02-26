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
    <Card className="overflow-hidden border-none animate-in fade-in zoom-in duration-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-3 rounded-2xl",
            iconColor?.includes('text-') ? iconColor.replace('text-', 'bg-') + '/10' : 'bg-primary/10'
          )}>
            <Icon className={cn("h-6 w-6", iconColor || "text-primary")} aria-hidden="true" />
          </div>
          <div className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted/50 cursor-pointer transition-colors">
             <span className="text-muted-foreground font-bold">···</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("text-3xl font-bold font-headline tracking-tight", valueClassName)}>
            {value}
          </div>
          {description && (
            <p className={cn("text-xs flex items-center gap-1", descriptionClassName || "text-muted-foreground")}>
              {description.includes('%') && (
                <span className="text-green-500 font-bold">↗</span>
              )}
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
