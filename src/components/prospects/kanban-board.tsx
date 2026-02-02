import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Prospect } from "@/lib/data";
import { ProspectCard } from "./prospect-card";

interface KanbanColumnProps {
  title: string;
  prospects: Prospect[];
  className?: string;
}

function KanbanColumn({ title, prospects, className }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-72 min-w-72 flex-shrink-0">
      <div className="flex items-center justify-between p-2">
        <h2 className="font-semibold font-headline text-lg">{title}</h2>
        <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
          {prospects.length}
        </span>
      </div>
      <div className="flex-1 rounded-lg bg-muted/50 p-2">
        {prospects.map((prospect) => (
          <ProspectCard key={prospect.id} prospect={prospect} />
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  prospects: Prospect[];
}

export function KanbanBoard({ prospects }: KanbanBoardProps) {
  const stages: Prospect["stage"][] = ["Potential", "Appointment", "Credit", "Closed"];

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            title={stage}
            prospects={prospects.filter((p) => p.stage === stage)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
