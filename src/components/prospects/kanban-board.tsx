import { useMemo, useState, useCallback, memo, useRef, useEffect } from "react";
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

const EMPTY_PROSPECTS: Prospect[] = [];

// Custom comparison function for KanbanColumn to prevent unnecessary re-renders.
// Uses JSON.stringify for the prospects array to handle new array references with identical content.
function areKanbanColumnPropsEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  return (
    prev.title === next.title &&
    prev.stageValue === next.stageValue &&
    prev.userProfilesMap === next.userProfilesMap &&
    prev.currentUserProfile === next.currentUserProfile &&
    prev.onRefresh === next.onRefresh &&
    prev.onDragStart === next.onDragStart &&
    prev.onDrop === next.onDrop &&
    (prev.prospects === next.prospects || JSON.stringify(prev.prospects) === JSON.stringify(next.prospects))
  );
}

// Optimization: Memoize KanbanColumn to prevent re-renders when parent re-renders but props are unchanged
const KanbanColumn = memo(function KanbanColumn({
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
}, areKanbanColumnPropsEqual);

interface KanbanBoardProps {
  prospects: Prospect[];
  userProfiles: UserProfile[];
  currentUserProfile: UserProfile | null;
  onRefresh: () => void;
}

const STAGES: Prospect["stage"][] = ["Potential", "Appointment", "Credit", "Closed"];

export function KanbanBoard({ prospects, userProfiles, currentUserProfile, onRefresh }: KanbanBoardProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const userProfilesMap = useMemo(() => {
    return userProfiles.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, UserProfile>);
  }, [userProfiles]);

  // Optimization: Pre-calculate prospects by stage to avoid filtering on every render
  // This ensures that KanbanColumn receives stable arrays unless prospects actually change
  const prospectsByStage = useMemo(() => {
    const grouped: Record<string, Prospect[]> = {};
    for (const p of prospects) {
      if (!grouped[p.stage]) {
        grouped[p.stage] = [];
      }
      grouped[p.stage].push(p);
    }
    return grouped;
  }, [prospects]);

  // Keep a ref to prospects to avoid re-creating handleDrop when prospects change.
  // This prevents all KanbanColumns from re-rendering just because the prospects list updated.
  const prospectsRef = useRef(prospects);
  useEffect(() => {
    prospectsRef.current = prospects;
  }, [prospects]);

  // Optimization: Memoize handleDragStart to provide a stable reference to child components, preventing unnecessary re-renders
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, prospectId: string) => {
    e.dataTransfer.setData("prospectId", prospectId);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, newStage: Prospect["stage"]) => {
      const prospectId = e.dataTransfer.getData("prospectId");
      if (!prospectId) return;

      const prospect = prospectsRef.current.find(p => p.id === prospectId);
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
  }, [db, toast, onRefresh]);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            title={stage}
            stageValue={stage}
            prospects={prospectsByStage[stage] || EMPTY_PROSPECTS}
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
