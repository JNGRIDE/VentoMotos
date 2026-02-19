import { useMemo, useState, useCallback, memo, useRef, useEffect } from "react";
import { Inbox, Calendar, FileText, CheckCircle } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { updateProspect } from "@/firebase/services";
import { type Prospect, type UserProfile, PROSPECT_STAGES } from "@/lib/data";
import { areDeepEqual } from "@/lib/utils";
import { ProspectCard } from "./prospect-card";
import { EditProspectDialog } from "./edit-prospect-dialog";
import { DeleteProspectDialog } from "./delete-prospect-dialog";
import { ProspectAIInsightsDialog } from "./prospect-ai-dialog";

interface KanbanColumnProps {
  title: string;
  stageValue: Prospect["stage"];
  prospects: Prospect[];
  userProfilesMap: Record<string, UserProfile>;
  currentUserProfile: UserProfile | null;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, prospectId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, newStage: Prospect["stage"]) => void;
  onMoveStage: (prospectId: string, newStage: Prospect["stage"]) => Promise<void>;
  onEdit: (prospect: Prospect) => void;
  onDelete: (prospect: Prospect) => void;
  onAIInsights: (prospect: Prospect) => void;
}

const EMPTY_PROSPECTS: Prospect[] = [];

const EMPTY_STATE_CONFIG: Record<Prospect["stage"], { icon: React.ElementType, text: string }> = {
  "Potential": { icon: Inbox, text: "No leads yet" },
  "Appointment": { icon: Calendar, text: "No appointments" },
  "Credit": { icon: FileText, text: "No applications" },
  "Closed": { icon: CheckCircle, text: "No closed deals" },
};

// Custom comparison function for KanbanColumn to prevent unnecessary re-renders.
// Uses shallow comparison for the prospects array to handle new array references with identical content efficiently.
function areKanbanColumnPropsEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  return (
    prev.title === next.title &&
    prev.stageValue === next.stageValue &&
    prev.userProfilesMap === next.userProfilesMap &&
    prev.currentUserProfile === next.currentUserProfile &&
    prev.onDragStart === next.onDragStart &&
    prev.onDrop === next.onDrop &&
    prev.onMoveStage === next.onMoveStage &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onAIInsights === next.onAIInsights &&
    (prev.prospects === next.prospects || areDeepEqual(prev.prospects, next.prospects))
  );
}

// Optimization: Memoize KanbanColumn to prevent re-renders when parent re-renders but props are unchanged
const KanbanColumn = memo(function KanbanColumn({
  title,
  stageValue,
  prospects,
  userProfilesMap,
  currentUserProfile,
  onDragStart,
  onDrop,
  onMoveStage,
  onEdit,
  onDelete,
  onAIInsights
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
      <div className="flex-1 rounded-lg bg-muted/50 p-2 min-h-[500px] flex flex-col">
        {prospects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 min-h-[200px]">
            {(() => {
              const Config = EMPTY_STATE_CONFIG[stageValue] || { icon: Inbox, text: "No prospects" };
              const Icon = Config.icon;
              return (
                <>
                  <Icon className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm font-medium">{Config.text}</p>
                </>
              );
            })()}
          </div>
        ) : (
          prospects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              userProfile={userProfilesMap[prospect.salespersonId]}
              currentUserProfile={currentUserProfile}
              onDragStart={onDragStart}
              onMoveStage={onMoveStage}
              onEdit={onEdit}
              onDelete={onDelete}
              onAIInsights={onAIInsights}
            />
          ))
        )}
      </div>
    </div>
  );
}, areKanbanColumnPropsEqual);

interface KanbanBoardProps {
  prospects: Prospect[];
  userProfiles: UserProfile[];
  currentUserProfile: UserProfile | null;
  onRefresh: () => void;
  onOptimisticUpdate: (prospect: Prospect) => void;
}

export function KanbanBoard({ prospects, userProfiles, currentUserProfile, onRefresh, onOptimisticUpdate }: KanbanBoardProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [deletingProspect, setDeletingProspect] = useState<Prospect | null>(null);
  const [aiProspect, setAIProspect] = useState<Prospect | null>(null);

  const userProfilesMap = useMemo(() => {
    return userProfiles.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, UserProfile>);
  }, [userProfiles]);

  // Ref to store the previous result of grouped prospects for comparison
  const prevProspectsByStageRef = useRef<Record<string, Prospect[]>>({});

  // Optimization: Pre-calculate prospects by stage to avoid filtering on every render.
  // We compare new groups with previous ones to maintain stable array references for unchanged stages.
  // This prevents unnecessary re-renders of KanbanColumn components which rely on prop equality.
  const prospectsByStage = useMemo(() => {
    const grouped: Record<string, Prospect[]> = {};
    // First, group everything as usual
    for (const p of prospects) {
      if (!grouped[p.stage]) {
        grouped[p.stage] = [];
      }
      grouped[p.stage].push(p);
    }

    // Now stabilize references by reusing old arrays if content is identical
    const result: Record<string, Prospect[]> = {};
    const prev = prevProspectsByStageRef.current;

    for (const stage of PROSPECT_STAGES) {
      const newArr = grouped[stage] || EMPTY_PROSPECTS;
      const oldArr = prev[stage];

      if (oldArr && areDeepEqual(oldArr, newArr)) {
        result[stage] = oldArr;
      } else {
        result[stage] = newArr;
      }
    }

    prevProspectsByStageRef.current = result;
    return result;
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

  const handleMoveStage = useCallback(async (prospectId: string, newStage: Prospect["stage"]) => {
      const prospect = prospectsRef.current.find(p => p.id === prospectId);
      if (!prospect) return;

      if (prospect.stage === newStage) return; // No change

      const originalStage = prospect.stage;
      const updatedProspect = {
          ...prospect,
          stage: newStage,
          stageUpdatedAt: new Date().toISOString()
      };

      // Optimistic update
      onOptimisticUpdate(updatedProspect);

      try {
          await updateProspect(db, prospectId, {
              stage: newStage,
              stageUpdatedAt: new Date().toISOString()
          });
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
          // Revert optimistic update
          onOptimisticUpdate({ ...prospect, stage: originalStage });
      }
  }, [db, toast, onRefresh, onOptimisticUpdate]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, newStage: Prospect["stage"]) => {
      const prospectId = e.dataTransfer.getData("prospectId");
      if (!prospectId) return;
      handleMoveStage(prospectId, newStage);
  }, [handleMoveStage]);

  const handleEdit = useCallback((prospect: Prospect) => {
    setEditingProspect(prospect);
  }, []);

  const handleDelete = useCallback((prospect: Prospect) => {
    setDeletingProspect(prospect);
  }, []);

  const handleAIInsights = useCallback((prospect: Prospect) => {
    setAIProspect(prospect);
  }, []);

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {PROSPECT_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              title={stage}
              stageValue={stage}
              prospects={prospectsByStage[stage] || EMPTY_PROSPECTS}
              userProfilesMap={userProfilesMap}
              currentUserProfile={currentUserProfile}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onMoveStage={handleMoveStage}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAIInsights={handleAIInsights}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {editingProspect && (
        <EditProspectDialog
          prospect={editingProspect}
          open={!!editingProspect}
          onOpenChange={(open) => !open && setEditingProspect(null)}
          onProspectUpdated={onRefresh}
          currentUserProfile={currentUserProfile}
          userProfiles={userProfiles}
        />
      )}

      {deletingProspect && (
        <DeleteProspectDialog
          prospectId={deletingProspect.id}
          prospectName={deletingProspect.name}
          open={!!deletingProspect}
          onOpenChange={(open) => !open && setDeletingProspect(null)}
          onProspectDeleted={onRefresh}
        />
      )}

      {aiProspect && (
        <ProspectAIInsightsDialog
          prospect={aiProspect}
          userProfile={userProfilesMap[aiProspect.salespersonId]}
          open={!!aiProspect}
          onOpenChange={(open) => !open && setAIProspect(null)}
        />
      )}
    </>
  );
}
