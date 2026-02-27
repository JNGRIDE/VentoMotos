import { useMemo, useState, useCallback, memo, useRef, useEffect } from "react";
import { Inbox, Calendar, FileCheck, XCircle, Trophy } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { updateProspect } from "@/firebase/services";
import { type Prospect, type UserProfile, PROSPECT_STAGES } from "@/lib/data";
import { areArraysOfFlatObjectsEqual } from "@/lib/utils";
import { ProspectCard } from "./prospect-card";
import { EditProspectDialog } from "./edit-prospect-dialog";
import { DeleteProspectDialog } from "./delete-prospect-dialog";

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
}

const EMPTY_PROSPECTS: Prospect[] = [];

const EMPTY_STATE_CONFIG: Record<Prospect["stage"], { icon: React.ElementType, text: string }> = {
  "Potencial": { icon: Inbox, text: "Sin leads nuevos" },
  "Agendado": { icon: Calendar, text: "Sin citas" },
  "Crédito Aprobado": { icon: FileCheck, text: "Sin créditos" },
  "Caído": { icon: XCircle, text: "Sin descartes" },
  "Cerrado": { icon: Trophy, text: "Sin cierres" },
};

// Custom comparison function for KanbanColumn to prevent unnecessary re-renders.
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
    (prev.prospects === next.prospects || areArraysOfFlatObjectsEqual(prev.prospects, next.prospects))
  );
}

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
  onDelete
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
      className={`flex flex-col w-72 min-w-72 flex-shrink-0 transition-all rounded-3xl ${isDragOver ? 'bg-primary/10 ring-2 ring-primary/20 scale-[1.02]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between p-4 mb-2">
        <h2 className="font-bold font-headline text-lg tracking-tight">{title}</h2>
        <span className="h-6 min-w-6 px-2 flex items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary shadow-sm">
          {prospects.length}
        </span>
      </div>
      <div className="flex-1 rounded-[32px] bg-secondary/30 backdrop-blur-sm p-3 min-h-[600px] flex flex-col gap-3">
        {prospects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 min-h-[200px] border-2 border-dashed border-border/40 rounded-[24px]">
            {(() => {
              const Config = EMPTY_STATE_CONFIG[stageValue] || { icon: Inbox, text: "Sin prospectos" };
              const Icon = Config.icon;
              return (
                <>
                  <Icon className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-wider">{Config.text}</p>
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

  const userProfilesMap = useMemo(() => {
    return userProfiles.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, UserProfile>);
  }, [userProfiles]);

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

  const prospectsRef = useRef(prospects);
  useEffect(() => {
    prospectsRef.current = prospects;
  }, [prospects]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, prospectId: string) => {
    e.dataTransfer.setData("prospectId", prospectId);
  }, []);

  const handleMoveStage = useCallback(async (prospectId: string, newStage: Prospect["stage"]) => {
      const prospect = prospectsRef.current.find(p => p.id === prospectId);
      if (!prospect) return;

      if (prospect.stage === newStage) return;

      const originalStage = prospect.stage;
      const updatedProspect = {
          ...prospect,
          stage: newStage,
          stageUpdatedAt: new Date().toISOString()
      };

      onOptimisticUpdate(updatedProspect);

      try {
          await updateProspect(db, prospectId, {
              stage: newStage,
              stageUpdatedAt: new Date().toISOString()
          });
          toast({
              title: "Etapa Actualizada",
              description: `Movido a ${newStage}`,
          });
          onRefresh();
      } catch (error) {
          console.error("Failed to move prospect", error);
          toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo mover el prospecto.",
          });
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

  return (
    <>
      <ScrollArea className="w-full h-full">
        <div className="flex gap-6 pb-8 pt-2 h-full">
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
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="bg-muted/20" />
      </ScrollArea>

      {editingProspect && (
        <EditProspectDialog
          prospect={editingProspect}
          open={!!editingProspect}
          onOpenChange={(open) => !open && setEditingProspect(null)}
          onProspectUpdated={onRefresh}
          currentUserProfile={currentUserProfile}
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
    </>
  );
}
