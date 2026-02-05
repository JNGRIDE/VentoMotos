import { useMemo, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { updateProspect } from "@/firebase/services";
import type { Prospect, UserProfile } from "@/lib/data";
import { ProspectCard } from "./prospect-card";

interface KanbanColumnProps {
  title: string;
  stageValue: Prospect["stage"];
  prospects: Prospect[];
  userProfilesMap: Record<string, UserProfile>;
  currentUserProfile: UserProfile | null;
  onRefresh: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, prospectId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, newStage: Prospect["stage"]) => void;
}

function KanbanColumn({
  title,
  stageValue,
  prospects,
  userProfilesMap,
  currentUserProfile,
  onRefresh,
  onDragStart,
  onDrop
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    onDrop(e, stageValue);
  }

  return (
    <div
      className={`flex flex-col w-72 min-w-72 flex-shrink-0 transition-colors rounded-lg ${isDragOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between p-2">
        <h2 className="font-semibold font-headline text-lg">{title}</h2>
        <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
          {prospects.length}
        </span>
      </div>
      <div className="flex-1 rounded-lg bg-muted/50 p-2 min-h-[500px]">
        {prospects.map((prospect) => (
          <ProspectCard
            key={prospect.id}
            prospect={prospect}
            userProfile={userProfilesMap[prospect.salespersonId]}
            currentUserProfile={currentUserProfile}
            onUpdate={onRefresh}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  prospects: Prospect[];
  userProfiles: UserProfile[];
  currentUserProfile: UserProfile | null;
  onRefresh: () => void;
}

export function KanbanBoard({ prospects, userProfiles, currentUserProfile, onRefresh }: KanbanBoardProps) {
  const stages: Prospect["stage"][] = ["Potential", "Appointment", "Credit", "Closed"];
  const db = useFirestore();
  const { toast } = useToast();
  
  const userProfilesMap = useMemo(() => {
    return userProfiles.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, UserProfile>);
  }, [userProfiles]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, prospectId: string) => {
    e.dataTransfer.setData("prospectId", prospectId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStage: Prospect["stage"]) => {
      const prospectId = e.dataTransfer.getData("prospectId");
      if (!prospectId) return;

      const prospect = prospects.find(p => p.id === prospectId);
      if (!prospect) return;

      if (prospect.stage === newStage) return; // No change

      // Optimistic update could happen here, but for now we'll just wait for firestore
      try {
          await updateProspect(db, prospectId, { stage: newStage });
          toast({
              title: "Stage Updated",
              description: `Moved to ${newStage}`,
          });
          onRefresh(); // Trigger refresh to get latest data
      } catch (error) {
          console.error("Failed to move prospect", error);
          toast({
              variant: "destructive",
              title: "Error",
              description: "Could not move prospect.",
          });
      }
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            title={stage}
            stageValue={stage}
            prospects={prospects.filter((p) => p.stage === stage)}
            userProfilesMap={userProfilesMap}
            currentUserProfile={currentUserProfile}
            onRefresh={onRefresh}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
