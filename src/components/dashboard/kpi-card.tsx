import type { LucideProps } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-5 w-5 text-muted-foreground", iconColor)} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold font-headline", valueClassName)}>{value}</div>
        {description && <p className={cn("text-xs text-muted-foreground", descriptionClassName)}>{description}</p>}
      </CardContent>
    </Card>
  );
}
