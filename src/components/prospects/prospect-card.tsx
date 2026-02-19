"use client";

import { memo } from "react";
import { MoreHorizontal, Pencil, Trash, Phone, Mail, ArrowRight, MessageCircle, Clock, Sparkles } from "lucide-react";
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
import { cn, areDeepEqual } from "@/lib/utils";
import { type Prospect, type UserProfile, PROSPECT_STAGES } from "@/lib/data";

interface ProspectCardProps {
  prospect: Prospect;
  userProfile?: UserProfile; // The assigned salesperson
  currentUserProfile: UserProfile | null; // The logged-in user
  onDragStart: (e: React.DragEvent<HTMLDivElement>, prospectId: string) => void;
  onMoveStage: (prospectId: string, newStage: Prospect["stage"]) => Promise<void>;
  onEdit: (prospect: Prospect) => void;
  onDelete: (prospect: Prospect) => void;
  onAIInsights: (prospect: Prospect) => void;
}

// Custom comparison function for React.memo to prevent unnecessary re-renders
// particularly when the prospects list is refreshed but the individual card data hasn't changed.
function arePropsEqual(prevProps: ProspectCardProps, nextProps: ProspectCardProps) {
  return (
    prevProps.userProfile === nextProps.userProfile &&
    prevProps.currentUserProfile === nextProps.currentUserProfile &&
    prevProps.onDragStart === nextProps.onDragStart &&
    prevProps.onMoveStage === nextProps.onMoveStage &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onAIInsights === nextProps.onAIInsights &&
    (prevProps.prospect === nextProps.prospect || areDeepEqual(prevProps.prospect, nextProps.prospect))
  );
}

// Optimization: Memoize ProspectCard to prevent re-renders when parent re-renders but props (like prospect data) are stable
export const ProspectCard = memo(function ProspectCard({ prospect, userProfile, currentUserProfile, onDragStart, onMoveStage, onEdit, onDelete, onAIInsights }: ProspectCardProps) {
  const sourceColor =
    prospect.source === "Advertising" ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground";

  // Visual prioritization: Colored border based on source
  const borderColor = prospect.source === "Advertising" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-green-500";

  // Time in stage
  const daysInStage = prospect.stageUpdatedAt
      ? Math.floor((new Date().getTime() - new Date(prospect.stageUpdatedAt).getTime()) / (1000 * 3600 * 24))
      : null;

  // Quick Actions Links
  const whatsappLink = prospect.phone ? `https://wa.me/52${prospect.phone.replace(/\D/g, '')}` : null;
  const phoneLink = prospect.phone ? `tel:${prospect.phone}` : null;

  return (
    <Card
      className={cn("mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 group relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", borderColor)}
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
      onClick={() => onEdit(prospect)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(prospect);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${prospect.name}`}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold truncate max-w-[150px]">{prospect.name}</CardTitle>
            <div className="flex items-center gap-1">
               <Badge className={cn("text-xs mr-1", sourceColor)} variant="outline" title={prospect.source}>
                  <span aria-hidden="true">{prospect.source.substring(0, 3)}</span>
                  <span className="sr-only">{prospect.source}</span>
               </Badge>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(prospect); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAIInsights(prospect); }} className="text-yellow-600 focus:text-yellow-700 font-medium">
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Insights
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Move to
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {PROSPECT_STAGES.filter((stage) => stage !== prospect.stage).map((stage) => (
                          <DropdownMenuItem
                            key={stage}
                            onSelect={() => onMoveStage(prospect.id, stage)}
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
         {/* Quick Actions & Info */}
         <div className="flex items-center justify-between">
            <div className="flex gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-yellow-500" onClick={(e) => { e.stopPropagation(); onAIInsights(prospect); }} aria-label="AI Insights">
                            <Sparkles className="h-3.5 w-3.5" />
                         </Button>
                    </TooltipTrigger>
                     <TooltipContent><p>AI Insights</p></TooltipContent>
                </Tooltip>
                {phoneLink && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" asChild onClick={(e) => e.stopPropagation()}>
                                <a href={phoneLink} aria-label={`Call ${prospect.phone}`}>
                                    <Phone className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{prospect.phone}</p></TooltipContent>
                    </Tooltip>
                )}
                {whatsappLink && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-green-600" asChild onClick={(e) => e.stopPropagation()}>
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${prospect.phone}`}>
                                    <MessageCircle className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>WhatsApp</p></TooltipContent>
                    </Tooltip>
                )}
                {prospect.email && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" asChild onClick={(e) => e.stopPropagation()}>
                                <a href={`mailto:${prospect.email}`} aria-label={`Email: ${prospect.email}`}>
                                    <Mail className="h-3.5 w-3.5" />
                                </a>
                             </Button>
                        </TooltipTrigger>
                         <TooltipContent><p>{prospect.email}</p></TooltipContent>
                    </Tooltip>
                )}
            </div>

            {daysInStage !== null && (
                 <div className={cn("flex items-center text-xs", daysInStage > 7 ? "text-destructive font-medium" : "text-muted-foreground")} title={`${daysInStage} days in current stage`}>
                    <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                    <span aria-hidden="true">{daysInStage}d</span>
                    <span className="sr-only">{daysInStage} days in stage</span>
                 </div>
            )}
         </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-1 border-t">
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
