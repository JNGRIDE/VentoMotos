"use client";

import { useState, memo } from "react";
import { MoreHorizontal, Pencil, Trash, Phone, Mail, ArrowRight, LoaderCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, areFlatObjectsEqual } from "@/lib/utils";
import { type Prospect, type UserProfile, PROSPECT_STAGES } from "@/lib/data";
import { useFirestore } from "@/firebase";
import { updateProspect } from "@/firebase/services";
import { useToast } from "@/hooks/use-toast";

interface ProspectCardProps {
  prospect: Prospect;
  userProfile?: UserProfile; // The assigned salesperson
  currentUserProfile: UserProfile | null; // The logged-in user
  onUpdate: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, prospectId: string) => void;
  onEdit: (prospect: Prospect) => void;
  onDelete: (prospect: Prospect) => void;
}

// Custom comparison function for React.memo to prevent unnecessary re-renders
// particularly when the prospects list is refreshed but the individual card data hasn't changed.
function arePropsEqual(prevProps: ProspectCardProps, nextProps: ProspectCardProps) {
  return (
    prevProps.userProfile === nextProps.userProfile &&
    prevProps.currentUserProfile === nextProps.currentUserProfile &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onDragStart === nextProps.onDragStart &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    (prevProps.prospect === nextProps.prospect || areFlatObjectsEqual(prevProps.prospect, nextProps.prospect))
  );
}

// Optimization: Memoize ProspectCard to prevent re-renders when parent re-renders but props (like prospect data) are stable
export const ProspectCard = memo(function ProspectCard({ prospect, userProfile, currentUserProfile, onUpdate, onDragStart, onEdit, onDelete }: ProspectCardProps) {
  const [isMoving, setIsMoving] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const handleMoveStage = async (newStage: Prospect["stage"]) => {
    setIsMoving(true);
    try {
      await updateProspect(db, prospect.id, { stage: newStage });
      toast({
        title: "Stage Updated",
        description: `Moved to ${newStage}`,
      });
      onUpdate();
    } catch (error) {
      console.error("Failed to move prospect", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not move prospect.",
      });
    } finally {
      setIsMoving(false);
    }
  };

  const sourceColor =
    prospect.source === "Advertising" ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground";

  return (
    <Card
      className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 group relative cursor-move"
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold truncate max-w-[150px]">{prospect.name}</CardTitle>
            <div className="flex items-center gap-1">
               <Badge className={cn("text-xs mr-1", sourceColor)} variant="outline">
                  {prospect.source}
               </Badge>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(prospect); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Move to
                      {isMoving && <LoaderCircle className="ml-2 h-3 w-3 animate-spin" />}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {PROSPECT_STAGES.filter((stage) => stage !== prospect.stage).map((stage) => (
                          <DropdownMenuItem
                            key={stage}
                            onSelect={() => handleMoveStage(stage)}
                            disabled={isMoving}
                          >
                            {stage}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(prospect); }} className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
         {/* Quick Info Icons */}
         {(prospect.phone || prospect.email) && (
            <div className="flex gap-2 text-muted-foreground">
                {prospect.phone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm" aria-label={`Phone: ${prospect.phone}`}>
                        <Phone className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{prospect.phone}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {prospect.email && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm" aria-label={`Email: ${prospect.email}`}>
                        <Mail className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{prospect.email}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
            </div>
         )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={userProfile?.avatarUrl} />
              <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[80px]">{userProfile?.name || "Unassigned"}</span>
          </div>
          <span>{new Date(prospect.lastContact).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}, arePropsEqual);
